# -*- coding: utf-8 -*-
"""Cliente simple para la API de Ollama (chat/generación)."""
import os, json, requests, re

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
    prompt = (
        "Actúa como un experto redactor de currículums. Reescribe los siguientes puntos de experiencia laboral "
        "para que suenen más profesionales, orientados a resultados y con métricas si es posible. "
        "RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. No incluyas texto antes ni después del JSON.\n"
        "Formato esperado: {\"bullets\": [\"punto mejorado 1\", \"punto mejorado 2\"]}\n\n"
        "Puntos originales:\n" +
        "\n".join(f"- {b}" for b in bullets)
    )

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": 0.7}
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        content = data.get("message", {}).get("content", "")
        
        # Intentar parsear JSON directo
        try:
            parsed = json.loads(content)
            if "bullets" in parsed and isinstance(parsed["bullets"], list):
                return parsed["bullets"]
        except json.JSONDecodeError:
            pass
            
        # Si falla, buscar bloque JSON con regex
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                if "bullets" in parsed and isinstance(parsed["bullets"], list):
                    return parsed["bullets"]
            except:
                pass

        # Si todo falla, intentar devolver bullets si el modelo devolvió una lista markdown
        lines = [line.strip().lstrip('-•*').strip() for line in content.split('\n') if line.strip().startswith(('- ', '* ', '• '))]
        if lines:
            return lines

        print(f"Advertencia: No se pudo parsear respuesta de Ollama: {content[:100]}...")
        return bullets # Fallback al original

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
