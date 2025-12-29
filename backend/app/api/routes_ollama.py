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


# ============================================
# Endpoints con Multi-Proveedor (3 niveles de fallback)
# ============================================

@router.post("/improve-bullets-multi")
def improve_bullets_multi(request: ImproveBulletsRequest):
    """
    Mejora bullets usando multi-proveedor con 3 niveles de fallback:
    1. Groq (llama-3.1-8b-instant)
    2. DeepSeek (deepseek-chat)
    3. Ollama (phi3.5:latest)
    """
    try:
        from app.services.multi_ai_service import get_multi_ai_service

        system_prompt = """Eres un experto en redacción profesional de CVs y currículums.
Tu tarea es mejorar bullets (viñetas) de logros profesionales.
Usa verbos de acción fuertes, incluye métricas cuando sea posible, y hazlos concisos."""

        bullets_text = "\n".join(request.bullets)
        instruction = request.instruction or "Mejora los bullets para que sean más profesionales e impactantes."

        prompt = f"""Bullets originales:
{bullets_text}

Instrucción: {instruction}

Retorna SOLO los bullets mejorados, uno por línea, sin texto adicional."""

        service = get_multi_ai_service()
        result = service.generate_with_three_tier_fallback(prompt, system_prompt)

        if not result["success"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail=result.get("error", "Error generando respuesta"))

        # Parsear respuesta - asume que viene una línea por bullet
        improved_lines = [line.strip() for line in result["response"].strip().split("\n") if line.strip()]

        return {
            "status": "success",
            "original": request.bullets,
            "improved": improved_lines,
            "provider": result["provider"],
            "model": result["model"],
            "tier_used": result.get("tier_used", 0)
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error procesando con IA multi-proveedor: {str(e)}")


@router.post("/review-cv-multi")
def review_cv_multi(request: ReviewCVRequest):
    """
    Revisión integral del CV usando multi-proveedor con 3 niveles de fallback:
    1. Groq (llama-3.1-8b-instant)
    2. DeepSeek (deepseek-chat)
    3. Ollama (phi3.5:latest)
    """
    try:
        from app.services.multi_ai_service import get_multi_ai_service

        system_prompt = """Eres un reclutador técnico senior con años de experiencia evaluando CVs.
Tu objetivo es proporcionar una revisión constructiva y detallada de un CV.
Analiza: estructura, claridad, impacto de logros, áreas de mejora y sugerencias específicas."""

        cv_text = f"""CV Data:
- Nombre: {request.cv_data.get('full_name', 'N/A')}
- Título: {request.cv_data.get('title', 'N/A')}
- Resumen: {request.cv_data.get('summary', 'N/A')}
- Experiencia: {request.cv_data.get('experience', [])}
- Educación: {request.cv_data.get('education', [])}
- Habilidades: {request.cv_data.get('skills', 'N/A')}

Proporciona una revisión detallada con:
1. Fortalezas principales (3-5 puntos)
2. Áreas de mejora (3-5 puntos)
3. Sugerencias específicas y accionables
4. Puntuación general del CV (1-10)
"""

        service = get_multi_ai_service()
        result = service.generate_with_three_tier_fallback(cv_text, system_prompt, max_tokens=3000)

        if not result["success"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail=result.get("error", "Error generando revisión"))

        return {
            "status": "success",
            "review": result["response"],
            "provider": result["provider"],
            "model": result["model"],
            "tier_used": result.get("tier_used", 0)
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error en la revisión integral multi-proveedor: {str(e)}")
