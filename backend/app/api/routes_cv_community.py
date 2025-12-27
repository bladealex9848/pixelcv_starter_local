# -*- coding: utf-8 -*-
"""Rutas extendidas para CVs - Comunidad, Gamificación y Landing Pages"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import yaml
import secrets
from datetime import datetime

from app.models.database import get_db, User, CV, Comment
from app.api.routes_auth import get_current_user
from app.services.gamification_service import GamificationService
from app.services.yaml_service import build_yaml
from app.services.render_service import render_cv

router = APIRouter(prefix="/community", tags=["community"])


class CreateCVRequest(BaseModel):
    yaml_content: str
    design: Optional[dict] = None


class UpdateCVRequest(BaseModel):
    yaml_content: Optional[str] = None
    design: Optional[dict] = None


class PublishCVRequest(BaseModel):
    is_published: bool
    slug: Optional[str] = None


class CommentRequest(BaseModel):
    content: str
    parent_id: Optional[str] = None


@router.post("/create")
def create_cv(request: CreateCVRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        cv_data = yaml.safe_load(request.yaml_content)
        name = cv_data.get('cv', {}).get('name', 'Sin nombre')
        cv_id = str(secrets.token_hex(8))
        slug = f"{name.lower().replace(' ', '-')}-{cv_id[:6]}"
        
        cv = CV(
            id=cv_id,
            user_id=current_user.id,
            name=name,
            slug=slug,
            yaml_content=request.yaml_content,
            design=request.design or {}
        )
        db.add(cv)
        
        GamificationService.add_points(db, current_user.id, 'cv_created', "Creaste un nuevo CV", cv_id)
        
        profile = db.query(User).filter_by(id=current_user.id).first().profile
        profile.cvs_created += 1
        
        db.commit()
        return {"message": "CV creado", "cv": {"id": cv.id, "name": cv.name, "slug": cv.slug}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/browse")
def browse_cvs(
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "created",
    db: Session = Depends(get_db)
):
    """Explora CVs públicos de la comunidad"""
    query = db.query(CV).filter(CV.is_published == True)
    
    if sort_by == "popular":
        query = query.order_by(CV.total_likes.desc())
    elif sort_by == "visited":
        query = query.order_by(CV.total_visits.desc())
    else:
        query = query.order_by(CV.created_at.desc())
    
    cvs = query.offset(skip).limit(limit).all()
    
    results = []
    for cv in cvs:
        results.append({
            "id": cv.id,
            "name": cv.name,
            "slug": cv.slug,
            "author": {"username": cv.user.username, "avatar_url": cv.user.avatar_url},
            "total_visits": cv.total_visits,
            "total_likes": cv.total_likes,
            "total_comments": cv.total_comments,
            "created_at": cv.created_at
        })
    
    return {"cvs": results, "total": len(results)}


@router.get("/public/{slug}")
def get_public_cv(slug: str, db: Session = Depends(get_db)):
    cv = db.query(CV).filter_by(slug=slug, is_published=True).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV no encontrado")
    
    return {
        "id": cv.id,
        "name": cv.name,
        "slug": cv.slug,
        "yaml_content": cv.yaml_content,
        "design": cv.design,
        "pdf_url": f"/cv/{cv.id}/pdf" if cv.pdf_path else None,
        "total_visits": cv.total_visits,
        "total_likes": cv.total_likes,
        "total_comments": cv.total_comments,
        "author": {
            "username": cv.user.username,
            "full_name": cv.user.full_name,
            "avatar_url": cv.user.avatar_url
        }
    }


@router.post("/{cv_id}/visit")
def record_visit(
    cv_id: str,
    visitor_ip: str = Query(None),
    db: Session = Depends(get_db)
):
    cv = db.query(CV).filter_by(id=cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV no encontrado")
    
    GamificationService.record_visit(db, cv_id, visitor_ip)
    return {"message": "Visita registrada"}


@router.post("/{cv_id}/like")
def toggle_like(cv_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv, profile = GamificationService.toggle_like(db, cv_id, current_user.id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV no encontrado")
    return {"liked": True, "total_likes": cv.total_likes}


@router.post("/{cv_id}/comment")
def add_comment(
    cv_id: str,
    request: CommentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment, owner_profile = GamificationService.add_comment(db, cv_id, current_user.id, request.content, request.parent_id)
    return {"message": "Comentario agregado", "comment_id": comment.id}


@router.get("/{cv_id}/comments")
def get_comments(cv_id: str, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter_by(cv_id=cv_id, parent_id=None).order_by(Comment.created_at.desc()).all()
    
    results = []
    for comment in comments:
        results.append({
            "id": comment.id,
            "content": comment.content,
            "author": {
                "username": comment.user.username,
                "avatar_url": comment.user.avatar_url
            },
            "created_at": comment.created_at,
            "replies_count": len(comment.replies) if hasattr(comment, 'replies') else 0
        })
    
    return {"comments": results}
