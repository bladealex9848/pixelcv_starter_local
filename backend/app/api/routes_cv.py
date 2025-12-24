# -*- coding: utf-8 -*-
"""Rutas principales para creacion y render de CVs."""
from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter, HTTPException, Body, Depends, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import pathlib
import re
import secrets

from app.services.yaml_service import build_yaml
from app.services.render_service import render_cv
from app.services.ollama_service import improve_bullets
from app.services.auth_service import AuthService
from app.services.gamification_service import GamificationService
from app.models.database import get_db, CV, User, UserProfile

router = APIRouter(prefix="/cv", tags=["cv"])


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Obtiene el usuario actual del token JWT (opcional)"""
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        return AuthService.get_current_user(db, token)
    except:
        return None


def generate_slug(name: str) -> str:
    """Genera un slug URL-friendly a partir del nombre"""
    # Limpiar caracteres especiales
    slug = name.lower().strip()
    slug = re.sub(r'[áàäâ]', 'a', slug)
    slug = re.sub(r'[éèëê]', 'e', slug)
    slug = re.sub(r'[íìïî]', 'i', slug)
    slug = re.sub(r'[óòöô]', 'o', slug)
    slug = re.sub(r'[úùüû]', 'u', slug)
    slug = re.sub(r'[ñ]', 'n', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    # Agregar sufijo unico
    suffix = secrets.token_hex(4)
    return f"{slug}-{suffix}"


@router.post("")
def create_cv(
    payload: dict = Body(...),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Crea YAML compatible con RenderCV, guarda en BD y renderiza PDF."""
    try:
        cv_id = str(uuid4())

        # IA opcional para mejorar highlights
        if payload.get("improve", False) and payload.get("model"):
            sections = payload.get("sections", {})
            for section_name, entries in sections.items():
                if isinstance(entries, list):
                    for entry in entries:
                        if isinstance(entry, dict) and "highlights" in entry:
                            entry["highlights"] = improve_bullets(payload["model"], entry["highlights"])
            payload["sections"] = sections

        # Construir YAML y renderizar PDF
        yaml_text = build_yaml(payload)
        artefactos = render_cv(yaml_text, cv_id, formats=tuple(payload.get("formats", ["pdf"])))

        # Guardar en base de datos si hay usuario autenticado
        if current_user:
            slug = generate_slug(payload.get("name", "cv"))

            cv = CV(
                id=cv_id,
                user_id=current_user.id,
                name=payload.get("name", "Sin nombre"),
                slug=slug,
                yaml_content=yaml_text,
                design={"theme": payload.get("theme", "classic")},
                is_published=False,
                pdf_path=artefactos.get("pdf"),
                png_path=artefactos.get("png"),
                html_path=artefactos.get("html"),
            )
            db.add(cv)

            # Actualizar contador de CVs creados
            profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
            if profile:
                profile.cvs_created = (profile.cvs_created or 0) + 1

                # Otorgar puntos por crear CV
                GamificationService.add_points(
                    db, current_user.id, 'cv_created',
                    f"CV creado: {payload.get('name', 'Sin nombre')}"
                )

            db.commit()

            return {
                "cvId": cv_id,
                "slug": slug,
                "artefactos": artefactos,
                "yaml": yaml_text,
                "saved": True,
                "message": "CV creado y guardado exitosamente"
            }
        else:
            # Sin autenticacion, solo generar PDF
            return {
                "cvId": cv_id,
                "artefactos": artefactos,
                "yaml": yaml_text,
                "saved": False,
                "message": "CV generado (inicia sesion para guardarlo)"
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my")
def get_my_cvs(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Obtiene todos los CVs del usuario autenticado"""
    try:
        token = authorization.replace("Bearer ", "")
        user = AuthService.get_current_user(db, token)
        if not user:
            raise HTTPException(status_code=401, detail="No autenticado")

        cvs = db.query(CV).filter(CV.user_id == user.id).order_by(CV.created_at.desc()).all()

        return {
            "cvs": [
                {
                    "id": cv.id,
                    "name": cv.name,
                    "slug": cv.slug,
                    "is_published": cv.is_published,
                    "total_visits": cv.total_visits,
                    "total_likes": cv.total_likes,
                    "total_comments": cv.total_comments,
                    "created_at": cv.created_at.isoformat() if cv.created_at else None,
                    "published_at": cv.published_at.isoformat() if cv.published_at else None,
                }
                for cv in cvs
            ],
            "total": len(cvs)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{cv_id}/publish")
def publish_cv(
    cv_id: str,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Publica o despublica un CV"""
    try:
        token = authorization.replace("Bearer ", "")
        user = AuthService.get_current_user(db, token)
        if not user:
            raise HTTPException(status_code=401, detail="No autenticado")

        cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user.id).first()
        if not cv:
            raise HTTPException(status_code=404, detail="CV no encontrado")

        # Toggle publicacion
        was_published = cv.is_published
        cv.is_published = not cv.is_published

        if cv.is_published and not was_published:
            cv.published_at = datetime.utcnow()

            # Actualizar contador y otorgar puntos
            profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            if profile:
                profile.cvs_published = (profile.cvs_published or 0) + 1
                GamificationService.add_points(
                    db, user.id, 'cv_published',
                    f"CV publicado: {cv.name}"
                )

        db.commit()

        return {
            "cv_id": cv_id,
            "is_published": cv.is_published,
            "slug": cv.slug,
            "message": "CV publicado" if cv.is_published else "CV despublicado"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{cv_id}/pdf")
def get_pdf(cv_id: str):
    """Descarga el PDF de un CV"""
    storage_dir = pathlib.Path(os.getenv("PIXELCV_STORAGE", "./app/static/artefactos")).resolve()
    pdf_path = storage_dir / cv_id / "CV.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF no encontrado")
    return FileResponse(str(pdf_path), media_type="application/pdf", filename="CV.pdf")


@router.delete("/{cv_id}")
def delete_cv(
    cv_id: str,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Elimina un CV"""
    try:
        token = authorization.replace("Bearer ", "")
        user = AuthService.get_current_user(db, token)
        if not user:
            raise HTTPException(status_code=401, detail="No autenticado")

        cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user.id).first()
        if not cv:
            raise HTTPException(status_code=404, detail="CV no encontrado")

        db.delete(cv)
        db.commit()

        return {"message": "CV eliminado", "cv_id": cv_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
