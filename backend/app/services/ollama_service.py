# -*- coding: utf-8 -*-
"""Cliente simple para la API de Ollama (chat/generación)."""
import os, json, requests

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api")
OLLAMA_MODEL = os.getenv("OLLAMA_DEFAULT_MODEL", "phi3.5:latest")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "60"))

def improve_bullets(model: str = None, bullets: list[str] = None) -> list[str]:
    """Mejora bullets de experiencia usando Ollama"""
    if model is None:
        model = OLLAMA_MODEL
    if bullets is None or len(bullets) == 0:
        return []
    
    url = f"{OLLAMA_BASE}/chat"
    payload = {
        "model": model,
        "messages": [{
            "role": "user",
            "content": (
                "Reescribe estos 'highlights' de experiencia en español, "
                "con foco en impacto y métricas, en formato JSON con un array 'bullets': " +
                " ".join(f"- {b}" for b in bullets)
            )
        }],
        "stream": False,
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        # /api/chat devuelve { message: { content: "...json..." } }
        content = data.get("message", {}).get("content", "")
        try:
            parsed = json.loads(content)
            return parsed.get("bullets", bullets)
        except:
            return bullets
    except Exception as e:
        print(f"Error en Ollama: {e}")
        return bullets

def list_models() -> list[str]:
    """Obtiene la lista de modelos disponibles en Ollama"""
    try:
        resp = requests.get(f"{OLLAMA_BASE}/tags", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        models = [m["name"] for m in data.get("models", [])]
        return models
    except Exception as e:
        print(f"Error listando modelos: {e}")
        return []

def generate_text(prompt: str, model: str = None) -> str:
    """Genera texto usando Ollama"""
    if model is None:
        model = OLLAMA_MODEL
    
    url = f"{OLLAMA_BASE}/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "")
    except Exception as e:
        print(f"Error generando texto: {e}")
        return ""
