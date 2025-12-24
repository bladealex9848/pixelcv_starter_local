# -*- coding: utf-8 -*-
"""Rutas para verificar y usar Ollama"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.ollama_service import list_models, generate_text, improve_bullets

router = APIRouter(prefix="/ollama", tags=["ollama"])

class ImproveBulletsRequest(BaseModel):
    bullets: List[str]
    model: Optional[str] = None
    instruction: Optional[str] = None

class ReviewCVRequest(BaseModel):
    cv_data: dict
    model: Optional[str] = None

@router.get("/models")
def get_models():
    """Obtiene la lista de modelos disponibles en Ollama"""
    models = list_models()
    return {
        "status": "connected" if models else "disconnected",
        "models": models,
        "count": len(models)
    }

@router.post("/test")
def test_ollama():
    """Prueba la conexión con Ollama generando texto"""
    test_text = generate_text("Hola, responde en español brevemente.")
    return {
        "status": "success" if test_text else "error",
        "response": test_text
    }

@router.post("/improve-bullets")
def improve_bullets_endpoint(request: ImproveBulletsRequest):
    """Mejora bullets de experiencia"""
    try:
        improved = improve_bullets(model=request.model, bullets=request.bullets, instruction=request.instruction)
        return {
            "status": "success",
            "original": request.bullets,
            "improved": improved
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error procesando con IA: {str(e)}")

@router.post("/review-cv")
def review_cv_endpoint(request: ReviewCVRequest):
    """Realiza una revisión integral del CV"""
    try:
        from app.services.ollama_service import review_cv
        review = review_cv(model=request.model, cv_data=request.cv_data)
        return {
            "status": "success",
            "review": review
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error en la revisión integral: {str(e)}")
