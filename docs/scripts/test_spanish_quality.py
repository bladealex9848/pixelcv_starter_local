#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test de calidad en español para modelos Ollama
"""

import requests
import json
import time

OLLAMA_BASE = "https://ollama.alexanderoviedofadul.dev/api"
TIMEOUT = 90

# Solo modelos que pasaron el primer benchmark
MODELS = [
    "phi4-mini:latest",
    "phi3.5:latest",
    "granite3.3:2b",
    "qwen3:1.7b",
    "gemma3:1b",
    "qwen3:0.6b",
]

def test_spanish_response(model: str) -> dict:
    """Prueba si el modelo responde en español con calidad"""
    url = f"{OLLAMA_BASE}/chat"

    prompt = (
        "Eres un experto consultor de carrera. Tu tarea es reescribir los siguientes textos "
        "para que suenen más profesionales y de alto impacto. "
        "Usa verbos de acción fuertes y agrega marcadores de métricas [X] si faltan datos. "
        "No te limites a corregir, REESCRIBE para impresionar.\n"
        "IMPORTANTE: Responde SIEMPRE en ESPAÑOL.\n"
        "RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. Sin explicaciones.\n"
        "Formato: {\"bullets\": [\"Texto mejorado 1\", \"Texto mejorado 2\"]}\n\n"
        "Textos originales:\n"
        "- Gané el primer premio del concurso JusticiaLAB 2024 de la Rama Judicial\n"
        "- Lideré un equipo de 5 personas para desarrollar una app móvil"
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

        # Parsear JSON
        bullets = []
        try:
            parsed = json.loads(content)
            bullets = parsed.get("bullets", [])
        except:
            import re
            json_match = re.search(r'\{[^{}]*"bullets"\s*:\s*\[[^\]]*\][^{}]*\}', content, re.DOTALL)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(0))
                    bullets = parsed.get("bullets", [])
                except:
                    pass

        # Evaluar si está en español
        spanish_words = ["el", "la", "de", "que", "un", "una", "en", "para", "con", "del", "los", "las", "por"]
        english_words = ["the", "and", "for", "with", "that", "this", "from", "was", "were", "led", "achieved"]

        combined = " ".join(bullets).lower()
        spanish_count = sum(1 for w in spanish_words if f" {w} " in f" {combined} ")
        english_count = sum(1 for w in english_words if f" {w} " in f" {combined} ")

        is_spanish = spanish_count > english_count

        # Evaluar calidad (¿es diferente al original? ¿tiene mejoras?)
        original1 = "gané el primer premio del concurso justicialab"
        original2 = "lideré un equipo de 5 personas"

        has_improvements = False
        if bullets:
            for b in bullets:
                b_lower = b.lower()
                # Si tiene métricas [X] o números específicos o verbos de acción fuertes
                if "[x]" in b_lower or "%" in b or any(word in b_lower for word in ["consolidé", "implementé", "optimicé", "impulsé", "transformé", "alcancé", "logré"]):
                    has_improvements = True
                    break
                # Si es significativamente diferente del original
                if original1 not in b_lower and original2 not in b_lower and len(b) > 50:
                    has_improvements = True
                    break

        return {
            "model": model,
            "time": round(elapsed, 2),
            "is_spanish": is_spanish,
            "has_improvements": has_improvements,
            "bullets": bullets,
            "spanish_score": spanish_count,
            "english_score": english_count
        }

    except Exception as e:
        return {
            "model": model,
            "time": time.time() - start,
            "error": str(e)
        }


def main():
    print("=" * 70)
    print("TEST DE CALIDAD EN ESPAÑOL")
    print("=" * 70)

    results = []
    for model in MODELS:
        print(f"\n>>> {model}")
        r = test_spanish_response(model)
        results.append(r)

        if "error" in r:
            print(f"   ❌ Error: {r['error']}")
        else:
            lang = "🇪🇸 Español" if r["is_spanish"] else "🇬🇧 Inglés"
            quality = "✅ Mejoras" if r["has_improvements"] else "❌ Sin mejoras"
            print(f"   {lang} | {quality} | {r['time']}s")
            print(f"   Bullets:")
            for b in r["bullets"][:2]:
                print(f"     → {b[:80]}...")

    print("\n" + "=" * 70)
    print("RESUMEN FINAL")
    print("=" * 70)
    print(f"\n{'Modelo':<20} {'Idioma':<12} {'Calidad':<15} {'Tiempo'}")
    print("-" * 60)

    for r in results:
        if "error" in r:
            print(f"{r['model']:<20} ❌ Error")
        else:
            lang = "🇪🇸 Español" if r["is_spanish"] else "🇬🇧 Inglés"
            qual = "✅ Buena" if r["has_improvements"] else "⚠️ Básica"
            print(f"{r['model']:<20} {lang:<12} {qual:<15} {r['time']}s")


if __name__ == "__main__":
    main()
