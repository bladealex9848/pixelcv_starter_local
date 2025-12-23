# -*- coding: utf-8 -*-
"""Rutas principales para creación y render de CVs."""
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse
from app.services.yaml_service import build_yaml
from app.services.render_service import render_cv
from app.services.ollama_service import improve_bullets
import os

router = APIRouter(prefix="/cv", tags=["cv"])

@router.post("")
def create_cv(payload: dict = Body(...)):
    """Crea YAML compatible con RenderCV, opcionalmente mejora bullets con IA, y renderiza."""
    try:
        cv_id = str(uuid4())
        # IA opcional para mejorar highlights
        if payload.get("improve", False) and payload.get("model"):
            sections = payload.get("sections", {})
            for section_name, entries in sections.items():
                for entry in entries:
                    if isinstance(entry, dict) and "highlights" in entry:
                        entry["highlights"] = improve_bullets(payload["model"], entry["highlights"])
            payload["sections"] = sections
        yaml_text = build_yaml(payload)
        artefactos = render_cv(yaml_text, cv_id, formats=tuple(payload.get("formats", ["pdf", "png"])) )
        return {"cvId": cv_id, "artefactos": artefactos, "yaml": yaml_text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{cv_id}/pdf")
def get_pdf(cv_id: str):
    import pathlib
    storage_dir = pathlib.Path(os.getenv("PIXELCV_STORAGE", "./app/static/artefactos")).resolve()
    pdf_path = storage_dir / cv_id / "CV.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF no encontrado")
    return FileResponse(str(pdf_path), media_type="application/pdf", filename="CV.pdf")
