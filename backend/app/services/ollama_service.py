# -*- coding: utf-8 -*-
"""Cliente simple para la API de Ollama (chat/generación)."""
import os, json, requests

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api")

def improve_bullets(model: str, bullets: list[str]) -> list[str]:
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
        "format": "json",
        "stream": False,
    }
    resp = requests.post(url, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    content = data.get("message", {}).get("content", "")
    try:
        parsed = json.loads(content)
        return parsed.get("bullets", bullets)
    except:
        return bullets
