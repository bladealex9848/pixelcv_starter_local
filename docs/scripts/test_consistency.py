#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test de consistencia - 3 intentos por modelo
"""

import requests
import json
import time
import re

OLLAMA_BASE = "https://ollama.alexanderoviedofadul.dev/api"
TIMEOUT = 60

# Modelos candidatos finales
MODELS = [
    "granite3.3:2b",
    "gemma3:1b",
    "qwen3:1.7b",
    "qwen3:0.6b",
]

ATTEMPTS = 3

def test_json_parsing(model: str) -> dict:
    """Prueba parsing JSON"""
    url = f"{OLLAMA_BASE}/chat"

    prompt = (
        "Eres un experto consultor de carrera. Reescribe estos textos para que suenen más profesionales.\n"
        "IMPORTANTE: Responde SIEMPRE en ESPAÑOL.\n"
        "RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. Sin explicaciones ni markdown.\n"
        "Formato exacto: {\"bullets\": [\"Texto 1\", \"Texto 2\"]}\n\n"
        "Textos:\n"
        "- Trabajé como desarrollador web\n"
        "- Hice análisis de datos"
    )

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": 0.5}
    }

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        elapsed = time.time() - start
        resp.raise_for_status()

        data = resp.json()
        content = data.get("message", {}).get("content", "")

        # Intentar parsear
        json_valid = False
        bullets = []

        # Intento 1: JSON directo
        try:
            parsed = json.loads(content)
            if "bullets" in parsed:
                json_valid = True
                bullets = parsed["bullets"]
        except:
            pass

        # Intento 2: Extraer JSON de markdown
        if not json_valid:
            json_block = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_block:
                try:
                    parsed = json.loads(json_block.group(1))
                    if "bullets" in parsed:
                        json_valid = True
                        bullets = parsed["bullets"]
                except:
                    pass

        # Intento 3: Buscar JSON suelto
        if not json_valid:
            json_match = re.search(r'\{[^{}]*"bullets"\s*:\s*\[[^\]]*\][^{}]*\}', content, re.DOTALL)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(0))
                    if "bullets" in parsed:
                        json_valid = True
                        bullets = parsed["bullets"]
                except:
                    pass

        return {
            "success": json_valid,
            "time": round(elapsed, 2),
            "bullets_count": len(bullets),
            "raw": content[:200] if not json_valid else None
        }

    except requests.exceptions.Timeout:
        return {"success": False, "time": TIMEOUT, "error": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "time": 0, "error": str(e)}


def main():
    print("=" * 70)
    print(f"TEST DE CONSISTENCIA ({ATTEMPTS} intentos por modelo)")
    print("=" * 70)

    summary = {}

    for model in MODELS:
        print(f"\n>>> {model}")
        successes = 0
        times = []

        for i in range(ATTEMPTS):
            print(f"   Intento {i+1}...", end=" ", flush=True)
            r = test_json_parsing(model)

            if r["success"]:
                successes += 1
                times.append(r["time"])
                print(f"✅ ({r['time']}s, {r['bullets_count']} bullets)")
            else:
                times.append(r["time"])
                error = r.get("error", "Parse failed")
                raw = r.get("raw", "")[:60] if r.get("raw") else ""
                print(f"❌ {error} {raw}")

            time.sleep(1)  # Evitar sobrecarga

        avg_time = sum(times) / len(times) if times else 0
        success_rate = (successes / ATTEMPTS) * 100

        summary[model] = {
            "success_rate": success_rate,
            "avg_time": round(avg_time, 2),
            "successes": successes
        }

        print(f"   → Éxito: {successes}/{ATTEMPTS} ({success_rate:.0f}%) | Tiempo promedio: {avg_time:.2f}s")

    print("\n" + "=" * 70)
    print("RANKING FINAL")
    print("=" * 70)

    # Ordenar por tasa de éxito y luego por tiempo
    ranked = sorted(summary.items(), key=lambda x: (-x[1]["success_rate"], x[1]["avg_time"]))

    print(f"\n{'#':<3} {'Modelo':<20} {'Éxito':<12} {'Tiempo Prom':<12} {'Recomendación'}")
    print("-" * 60)

    for i, (model, data) in enumerate(ranked, 1):
        rate = f"{data['success_rate']:.0f}%"
        time_str = f"{data['avg_time']:.2f}s"

        if data["success_rate"] == 100 and data["avg_time"] < 15:
            rec = "⭐ RECOMENDADO"
        elif data["success_rate"] == 100:
            rec = "👍 BUENO"
        elif data["success_rate"] >= 67:
            rec = "⚠️ INESTABLE"
        else:
            rec = "🚫 NO USAR"

        print(f"{i:<3} {model:<20} {rate:<12} {time_str:<12} {rec}")


if __name__ == "__main__":
    main()
