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
    improved = improve_bullets(model=request.model, bullets=request.bullets)
    return {
        "original": request.bullets,
        "improved": improved
    }
