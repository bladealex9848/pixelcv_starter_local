# -*- coding: utf-8 -*-
"""Cliente simple para la API de Ollama (chat/generación)."""
import os, json, requests, re

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api")
OLLAMA_MODEL = os.getenv("OLLAMA_DEFAULT_MODEL", "phi3.5:latest")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "300"))

def improve_bullets(model: str = None, bullets: list[str] = None, instruction: str = None) -> list[str]:
    """Mejora bullets de experiencia usando Ollama"""
    if model is None:
        model = OLLAMA_MODEL
    if bullets is None or len(bullets) == 0:
        return []
    
    url = f"{OLLAMA_BASE}/chat"
    
    base_instruction = (
        "Eres un experto consultor de carrera. Tu tarea es reescribir los siguientes textos "
        "para que suenen más profesionales y de alto impacto. "
    )
    
    if instruction:
        base_instruction += f"\nIMPORTANTE - Sigue esta instrucción específica del usuario: '{instruction}'.\n"
    else:
        base_instruction += (
            "Usa verbos de acción fuertes y agrega marcadores de métricas [X] si faltan datos. "
            "No te limites a corregir, REESCRIBE para impresionar.\n"
        )

    prompt = (
        f"{base_instruction}\n"
        "RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. Sin explicaciones.\n"
        "Formato: {\"bullets\": [\"Texto mejorado 1\", \"Texto mejorado 2\"]}\n\n"
        "Textos originales:\n" +
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
        
        # Log discreto de actividad
        print(f"[Ollama] Respuesta recibida ({len(content)} caracteres). Procesando sugerencias...")
        
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

def review_cv(model: str = None, cv_data: dict = None) -> str:
    """Revisa el CV completo y devuelve feedback en Markdown"""
    if model is None:
        model = OLLAMA_MODEL
    
    url = f"{OLLAMA_BASE}/chat"
    
    # Convertir datos relevantes a texto
    cv_text = json.dumps(cv_data, indent=2, ensure_ascii=False)
    
    prompt = (
        "SISTEMA: Eres un RECLUTADOR TÉCNICO SENIOR con 20 años de experiencia en selección de talento.\n"
        "TAREA: Analiza el siguiente CV proporcionado en formato JSON y genera un REPORTE CRÍTICO DE CALIDAD.\n"
        "REGLAS ESTRICTAS:\n"
        "1. NO devuelvas el JSON original.\n"
        "2. NO inventes experiencia que no existe.\n"
        "3. USA FORMATO MARKDOWN PROFESIONAL.\n"
        "4. Responde SIEMPRE en ESPAÑOL.\n\n"
        "ESTRUCTURA DEL REPORTE:\n"
        "### 🌟 Fortalezas\n"
        "(Lista de lo que destaca positivamente)\n\n"
        "### 🛠️ Áreas de Mejora\n"
        "(Crítica constructiva sobre verbos de acción, métricas faltantes, claridad o diseño)\n\n"
        "### 📈 Veredicto Profesional\n"
        "(Conclusión breve sobre el impacto del perfil y qué tan 'contratable' parece)\n\n"
        f"--- DATOS DEL CV A ANALIZAR ---\n{cv_text}"
    )

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": 0.4}
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "No se pudo generar la revisión.")
    except requests.exceptions.ReadTimeout:
        return "⚠️ La IA está tomando demasiado tiempo para responder (Timeout). Por favor, intenta de nuevo en unos momentos o con un modelo más ligero."
    except requests.exceptions.ConnectionError:
        return "❌ No se pudo conectar con el servicio de IA (Ollama). Asegúrate de que el servidor de IA esté activo."
    except Exception as e:
        print(f"Error revisando CV: {e}")
        return f"Ocurrió un error inesperado al generar la revisión: {str(e)}"

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
