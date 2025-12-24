#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Benchmark de modelos Ollama para PixelCV
Prueba: improve-bullets (JSON) y review-cv (Markdown)
"""

import requests
import json
import time
import re

OLLAMA_BASE = "https://ollama.alexanderoviedofadul.dev/api"
TIMEOUT = 120

# Modelos a probar
MODELS = [
    "qwen3:4b",
    "phi4-mini:latest",
    "phi3.5:latest",
    "granite3.3:2b",
    "qwen3:1.7b",
    "gemma3:1b",
    "qwen3:0.6b",
    "gemma3:270m",
]

# Bullets de prueba (simulando pasos 2, 4, 5)
TEST_BULLETS = [
    "Trabajé en desarrollo web con React",
    "Hice proyectos de machine learning",
    "Colaboré con el equipo de desarrollo",
]

# CV de prueba para review (paso 6)
TEST_CV = {
    "name": "Juan Pérez",
    "label": "Desarrollador Full Stack",
    "email": "juan@ejemplo.com",
    "experience": [
        {
            "company": "Tech Corp",
            "position": "Desarrollador Senior",
            "highlights": [
                "Desarrollé aplicaciones web",
                "Trabajé en equipo"
            ]
        }
    ],
    "education": [
        {
            "institution": "Universidad Nacional",
            "area": "Ingeniería de Sistemas",
            "studyType": "Pregrado"
        }
    ],
    "skills": ["Python", "JavaScript", "React", "FastAPI"]
}

def test_improve_bullets(model: str) -> dict:
    """Prueba improve-bullets y evalúa calidad JSON"""
    url = f"{OLLAMA_BASE}/chat"

    prompt = (
        "Eres un experto consultor de carrera. Tu tarea es reescribir los siguientes textos "
        "para que suenen más profesionales y de alto impacto. "
        "Usa verbos de acción fuertes y agrega marcadores de métricas [X] si faltan datos. "
        "No te limites a corregir, REESCRIBE para impresionar.\n"
        "RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. Sin explicaciones.\n"
        "Formato: {\"bullets\": [\"Texto mejorado 1\", \"Texto mejorado 2\", \"Texto mejorado 3\"]}\n\n"
        "Textos originales:\n" +
        "\n".join(f"- {b}" for b in TEST_BULLETS)
    )

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": 0.7}
    }

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        elapsed = time.time() - start
        resp.raise_for_status()

        data = resp.json()
        content = data.get("message", {}).get("content", "")

        # Evaluar parsing JSON
        json_valid = False
        bullets_count = 0
        parsed_bullets = []

        # Intento 1: JSON directo
        try:
            parsed = json.loads(content)
            if "bullets" in parsed and isinstance(parsed["bullets"], list):
                json_valid = True
                bullets_count = len(parsed["bullets"])
                parsed_bullets = parsed["bullets"]
        except:
            pass

        # Intento 2: Buscar JSON en el texto
        if not json_valid:
            # Buscar bloques de código JSON
            json_block = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if json_block:
                try:
                    parsed = json.loads(json_block.group(1))
                    if "bullets" in parsed and isinstance(parsed["bullets"], list):
                        json_valid = True
                        bullets_count = len(parsed["bullets"])
                        parsed_bullets = parsed["bullets"]
                except:
                    pass

        # Intento 3: Buscar objeto JSON suelto
        if not json_valid:
            json_match = re.search(r'\{[^{}]*"bullets"\s*:\s*\[[^\]]*\][^{}]*\}', content, re.DOTALL)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(0))
                    if "bullets" in parsed and isinstance(parsed["bullets"], list):
                        json_valid = True
                        bullets_count = len(parsed["bullets"])
                        parsed_bullets = parsed["bullets"]
                except:
                    pass

        return {
            "model": model,
            "test": "improve-bullets",
            "success": json_valid,
            "time_seconds": round(elapsed, 2),
            "bullets_returned": bullets_count,
            "bullets": parsed_bullets[:3] if parsed_bullets else [],
            "raw_response": content[:500] if not json_valid else None,
            "error": None
        }

    except requests.exceptions.Timeout:
        return {
            "model": model,
            "test": "improve-bullets",
            "success": False,
            "time_seconds": TIMEOUT,
            "error": "TIMEOUT"
        }
    except Exception as e:
        return {
            "model": model,
            "test": "improve-bullets",
            "success": False,
            "time_seconds": time.time() - start,
            "error": str(e)
        }


def test_review_cv(model: str) -> dict:
    """Prueba review-cv y evalúa calidad Markdown"""
    url = f"{OLLAMA_BASE}/chat"

    cv_text = json.dumps(TEST_CV, indent=2, ensure_ascii=False)

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

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        elapsed = time.time() - start
        resp.raise_for_status()

        data = resp.json()
        content = data.get("message", {}).get("content", "")

        # Evaluar calidad del Markdown
        has_fortalezas = "fortaleza" in content.lower() or "🌟" in content
        has_mejoras = "mejora" in content.lower() or "🛠️" in content
        has_veredicto = "veredicto" in content.lower() or "📈" in content or "conclusi" in content.lower()
        is_spanish = any(word in content.lower() for word in ["el", "la", "de", "que", "es", "un", "una"])
        not_json_echo = not content.strip().startswith("{") and "experience" not in content[:200]

        sections_found = sum([has_fortalezas, has_mejoras, has_veredicto])
        quality_score = sections_found + (1 if is_spanish else 0) + (1 if not_json_echo else 0)

        return {
            "model": model,
            "test": "review-cv",
            "success": quality_score >= 3,
            "time_seconds": round(elapsed, 2),
            "quality_score": quality_score,
            "has_fortalezas": has_fortalezas,
            "has_mejoras": has_mejoras,
            "has_veredicto": has_veredicto,
            "is_spanish": is_spanish,
            "not_json_echo": not_json_echo,
            "response_length": len(content),
            "preview": content[:300] if content else None,
            "error": None
        }

    except requests.exceptions.Timeout:
        return {
            "model": model,
            "test": "review-cv",
            "success": False,
            "time_seconds": TIMEOUT,
            "error": "TIMEOUT"
        }
    except Exception as e:
        return {
            "model": model,
            "test": "review-cv",
            "success": False,
            "time_seconds": time.time() - start,
            "error": str(e)
        }


def main():
    print("=" * 70)
    print("BENCHMARK DE MODELOS OLLAMA PARA PIXELCV")
    print("=" * 70)
    print(f"Servidor: {OLLAMA_BASE}")
    print(f"Timeout: {TIMEOUT}s")
    print(f"Modelos: {len(MODELS)}")
    print("=" * 70)

    results = []

    for model in MODELS:
        print(f"\n>>> Probando: {model}")
        print("-" * 50)

        # Test 1: improve-bullets
        print("  [1/2] improve-bullets (JSON)...", end=" ", flush=True)
        r1 = test_improve_bullets(model)
        status1 = "✅" if r1["success"] else "❌"
        print(f"{status1} ({r1['time_seconds']}s)")
        if r1.get("error"):
            print(f"        Error: {r1['error']}")
        elif r1["success"]:
            print(f"        Bullets: {r1['bullets_returned']}/3")
        else:
            print(f"        Raw: {r1.get('raw_response', '')[:100]}...")
        results.append(r1)

        # Test 2: review-cv
        print("  [2/2] review-cv (Markdown)...", end=" ", flush=True)
        r2 = test_review_cv(model)
        status2 = "✅" if r2["success"] else "❌"
        print(f"{status2} ({r2['time_seconds']}s)")
        if r2.get("error"):
            print(f"        Error: {r2['error']}")
        else:
            print(f"        Score: {r2['quality_score']}/5 (F:{r2['has_fortalezas']} M:{r2['has_mejoras']} V:{r2['has_veredicto']} ES:{r2['is_spanish']} !JSON:{r2['not_json_echo']})")
        results.append(r2)

    # Resumen final
    print("\n" + "=" * 70)
    print("RESUMEN DE RESULTADOS")
    print("=" * 70)

    summary = {}
    for r in results:
        model = r["model"]
        if model not in summary:
            summary[model] = {"bullets_ok": False, "review_ok": False, "total_time": 0, "errors": []}

        if r["test"] == "improve-bullets":
            summary[model]["bullets_ok"] = r["success"]
            summary[model]["bullets_time"] = r["time_seconds"]
        else:
            summary[model]["review_ok"] = r["success"]
            summary[model]["review_time"] = r["time_seconds"]

        summary[model]["total_time"] += r["time_seconds"]
        if r.get("error"):
            summary[model]["errors"].append(r["error"])

    print(f"\n{'Modelo':<20} {'Bullets':<10} {'Review':<10} {'Tiempo':<12} {'Recomendación'}")
    print("-" * 70)

    for model in MODELS:
        s = summary[model]
        bullets = "✅" if s["bullets_ok"] else "❌"
        review = "✅" if s["review_ok"] else "❌"
        time_str = f"{s['total_time']:.1f}s"

        if s["bullets_ok"] and s["review_ok"]:
            if s["total_time"] < 30:
                rec = "⭐ EXCELENTE"
            elif s["total_time"] < 60:
                rec = "👍 BUENO"
            else:
                rec = "🐢 LENTO"
        elif s["bullets_ok"] or s["review_ok"]:
            rec = "⚠️ PARCIAL"
        else:
            rec = "🚫 ELIMINAR"

        print(f"{model:<20} {bullets:<10} {review:<10} {time_str:<12} {rec}")

    # Guardar resultados detallados
    with open("benchmark_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print("Resultados detallados guardados en: benchmark_results.json")
    print("=" * 70)


if __name__ == "__main__":
    main()
