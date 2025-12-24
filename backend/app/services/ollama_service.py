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
        "Eres un experto consultor de carrera y redactor de CVs de alto impacto. "
        "Tu tarea es transformar puntos de experiencia mediocres en logros impresionantes. "
        "Usa verbos de acción fuertes (Lideré, Optimicé, Desarrollé, Gané) y, si el usuario no proporciona métricas, "
        "agrega marcadores de posición lógicos como '[X]% ' o '[Y] personas' para que el usuario sepa dónde completarlos. "
        "No te limites a corregir la gramática, REESCRIBE el logro para que suene ambicioso y profesional.\n\n"
        "RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. Sin explicaciones.\n"
        "Formato: {\"bullets\": [\"Logro impactante 1\", \"Logro impactante 2\"]}\n\n"
        "Puntos a transformar:\n" +
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
        
        # LOG para depuración en la terminal del usuario
        print(f"\n--- DEBUG OLLAMA RESPUESTA CRUDA ---\n{content}\n-----------------------------------\n")
        
        # Intentar parsear JSON directo
        try:
            parsed = json.loads(content)
            if "bullets" in parsed and isinstance(parsed["bullets"], list):
                return parsed["bullets"]
        except json.JSONDecodeError:
            pass
            
        # Buscar bloques JSON (usando non-greedy para encontrar objetos individuales)
        # Esto maneja casos donde el modelo devuelve múltiples JSONs o texto entre ellos
        json_matches = re.finditer(r'\{.*?\}', content, re.DOTALL)
        for match in json_matches:
            try:
                candidate = match.group(0)
                parsed = json.loads(candidate)
                if "bullets" in parsed and isinstance(parsed["bullets"], list):
                    return parsed["bullets"]
            except:
                continue

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
