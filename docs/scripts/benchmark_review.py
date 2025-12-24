import os
import sys
import time
import json
import requests

# Configuración manual para la prueba basada en tu error
OLLAMA_URL = "https://ollama.alexanderoviedofadul.dev/api/chat"
TIMEOUT = 180 # 3 minutos para el benchmark

# CV de prueba (similar al que genera el frontend)
dummy_cv = {
    "name": "Alexander Oviedo Fadul",
    "summary": "Desarrollador de software con experiencia en IA y sistemas complejos. Ganador del concurso JusticiaLAB 2024.",
    "sections": {
        "experiencia": [
            {"company": "Rama Judicial", "position": "Asistente", "highlights": ["Lideré el proyecto JusticiaLAB", "Gané el primer concurso de innovación"]}
        ],
        "skills": ["Python", "React", "Ollama", "Docker"]
    }
}

def test_model(model_name):
    print(f"\n>>> Probando modelo: {model_name}...")
    prompt = (
        "Actúa como un reclutador senior. Revisa este CV y da feedback en Markdown (Fortalezas, Áreas de Mejora, Veredicto). "
        f"Responde en ESPAÑOL.\n\nDatos: {json.dumps(dummy_cv)}"
    )
    
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }
    
    start_time = time.time()
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        duration = time.time() - start_time
        content = resp.json().get("message", {}).get("content", "")
        print(f"✅ ÉXITO | Tiempo: {duration:.2f}s | Caracteres: {len(content)}")
        # Mostrar una parte del veredicto para evaluar calidad
        if "Veredicto" in content:
            veredicto = content.split("Veredicto")[-1][:200]
            print(f"Calidad (Veredicto): {veredicto.strip()}...")
        return duration
    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ FALLO | Tiempo transcurrido: {duration:.2f}s | Error: {str(e)}")
        return None

# Lista de modelos a testear (según disponibilidad en tu servidor)
models = ["granite3.3:2b", "phi4-mini-reasoning", "qwen3:4b", "phi3.5:latest"]

results = {}
for m in models:
    results[m] = test_model(m)

print("\n--- RESUMEN FINAL ---")
for m, t in results.items():
    status = f"{t:.2f}s" if t else "TIMEOUT/ERROR"
    print(f"- {m}: {status}")
