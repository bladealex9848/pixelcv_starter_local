#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prueba comparativa de modelos para Pixel Art.
Evalúa diferentes proveedores y modelos con prompts variados.
"""
import sys
import os

# Cargar variables de entorno desde .env (en el directorio padre backend/)
# override=True para sobrescribir variables de entorno existentes
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path, override=True)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.multi_ai_service import get_multi_ai_service, AIProvider
from app.services.pixelart_service import PixelArtService
import re

# Prompts de prueba por categoría
TEST_PROMPTS = {
    "rostro": [
        "Un retrato de una mujer con cabello largo",
        "Un anciano con barba y bigote",
        "Un niño sonriendo con gorro",
    ],
    "paisaje": [
        "Un atardecer sobre el mar con sol brillante",
        "Una montaña nevada con cielo estrellado",
        "Un bosque en otoño con hojas rojas",
    ],
    "personaje": [
        "Un caballero medieval con armadura y espada",
        "Un alien verde con grandes ojos",
        "Un robot futurista con antenas",
    ],
    "objeto": [
        "Una casa pequeña con chimenea y ventana",
        "Un coche rojo deportivo",
        "Una espada brillante con hoja de metal",
    ],
    "animal": [
        "Un gato sentado con bigotes",
        "Un pájaro volando con alas abiertas",
        "Un pez nadando en el agua",
    ],
    "comida": [
        "Una pizza con pepperoni y queso",
        "Una manzana roja con hoja verde",
        "Una taza de café humeante",
    ]
}

def validate_pixel_art(response: str) -> dict:
    """Valida que la respuesta sea pixel art válido"""
    # Buscar bloque de código
    code_match = re.search(r'```\n?([\s\S]*?)\n?```', response)
    if code_match:
        response = code_match.group(1)

    # Buscar líneas válidas de 16 caracteres de 0-7
    valid_pattern = re.compile(r'^[0-7]{16}$')
    lines = [line.strip() for line in response.split('\n')
             if valid_pattern.match(line.strip())]

    return {
        "valid": len(lines) == 16,
        "lines_found": len(lines),
        "lines": lines[:16]
    }

def test_provider_model(provider: str, model: str, prompt: str) -> dict:
    """Prueba un proveedor y modelo específicos"""
    try:
        service = get_multi_ai_service()

        # Forzar proveedor y modelo específicos
        prov_enum = AIProvider(provider)

        # Usar el MISMO prompt que pixelart_service.py
        prompt_en = prompt  # Asumimos que ya está en inglés

        improved_prompt = f"""Generate a 16x16 pixel art grid using digits 0-7.

Subject: {prompt_en}

Output format (16 lines, 16 digits each):
```
0000000000000000
0000111100000000
0001122110000000
0011122221000000
0011122222110000
0001122222210000
0000111111100000
0000111111100000
0000011111000000
0000011111000000
0000001110000000
0000001110000000
0000001100000000
0000000000000000
0000000000000000
0000000000000000
```

Your task: Create the 16x16 grid for "{prompt_en}". Output ONLY the grid."""

        result = service.generate_text(improved_prompt, prov_enum, model)

        if not result["success"]:
            return {
                "success": False,
                "error": result.get("error", "Unknown error"),
                "provider": provider,
                "model": model
            }

        validation = validate_pixel_art(result["response"])

        return {
            "success": True,
            "provider": provider,
            "model": model,
            "valid": validation["valid"],
            "lines_found": validation["lines_found"],
            "response_preview": result["response"][:200]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "provider": provider,
            "model": model
        }

def main():
    print("=" * 60)
    print(" PRUEBA COMPARATIVA DE MODELOS PARA PIXEL ART")
    print("=" * 60)

    service = get_multi_ai_service()
    available = service.get_available_providers()

    print(f"\nProveedores disponibles: {[p.value for p in available]}")

    # Configuraciones a probar
    configs_to_test = [
        # OpenAI (gpt-5-nano NO recomendado para Pixel Art - usa todos los tokens en razonamiento)
        ("openai", "gpt-4.1-nano"),
        ("openai", "gpt-4o-mini"),
        ("openai", "gpt-4o"),

        # Groq
        ("groq", "llama-3.1-8b-instant"),
        ("groq", "llama-3.3-70b-versatile"),

        # DeepSeek
        ("deepseek", "deepseek-chat"),

        # OpenRouter (modelos gratuitos)
        ("openrouter", "meta-llama/llama-3.3-70b-instruct:free"),
        ("openrouter", "nvidia/nemotron-nano-9b-v2:free"),

        # Together
        ("together", "Qwen/Qwen2.5-72B-Instruct-Turbo"),

        # Mistral
        ("mistral", "mistral-small-latest"),

        # Ollama (local)
        ("ollama", "phi3.5:latest"),
    ]

    # Filtrar solo proveedores disponibles
    configs_to_test = [(p, m) for p, m in configs_to_test if AIProvider(p) in available]

    print(f"\nConfiguraciones a probar: {len(configs_to_test)}")
    for p, m in configs_to_test:
        print(f"  - {p}/{m}")

    # Seleccionar un prompt representativo de cada categoría (en inglés para mejor formato)
    sample_prompts = {
        "rostro": "A portrait of a woman with long hair",
        "paisaje": "A sunset over the sea with bright sun",
        "personaje": "A medieval knight with armor and sword",
        "objeto": "A small house with chimney and window",
        "animal": "A cat sitting with whiskers",
    }

    results = []

    print("\n" + "=" * 60)
    print(" EJECUTANDO PRUEBAS...")
    print("=" * 60)

    for category, prompt in sample_prompts.items():
        print(f"\n📝 Categoría: {category.upper()}")
        print(f"   Prompt: {prompt}")
        print("-" * 60)

        for provider, model in configs_to_test:
            print(f"   Probando {provider}/{model}...", end=" ")

            result = test_provider_model(provider, model, prompt)
            results.append({**result, "category": category})

            if result["success"]:
                if result["valid"]:
                    print(f"✅ VÁLIDO ({result['lines_found']}/16 líneas)")
                else:
                    print(f"⚠️  INVÁLIDO ({result['lines_found']}/16 líneas)")
                    # Debug: mostrar respuesta cruda
                    print(f"   📋 Respuesta cruda (primeros 300 chars):")
                    print(f"      {repr(result.get('response_preview', ''))}")
            else:
                print(f"❌ ERROR: {result.get('error', 'Unknown')[:50]}")

    # Resumen de resultados
    print("\n" + "=" * 60)
    print(" RESUMEN DE RESULTADOS")
    print("=" * 60)

    # Agrupar por proveedor/modelo
    stats = {}
    for r in results:
        key = f"{r['provider']}/{r['model']}"
        if key not in stats:
            stats[key] = {"valid": 0, "invalid": 0, "errors": 0}

        if not r["success"]:
            stats[key]["errors"] += 1
        elif r["valid"]:
            stats[key]["valid"] += 1
        else:
            stats[key]["invalid"] += 1

    # Ordenar por éxito
    sorted_stats = sorted(stats.items(), key=lambda x: x[1]["valid"], reverse=True)

    print(f"\n{'Proveedor/Modelo':<50} {'Válidos':>8} {'Inválidos':>10} {'Errores':>8}")
    print("-" * 80)

    for key, data in sorted_stats:
        total = data["valid"] + data["invalid"] + data["errors"]
        success_rate = (data["valid"] / total * 100) if total > 0 else 0
        print(f"{key:<50} {data['valid']:>8} {data['invalid']:>10} {data['errors']:>8} ({success_rate:.0f}%)")

    # Recomendación
    best = sorted_stats[0] if sorted_stats else None
    if best and best[1]["valid"] > 0:
        print(f"\n🏆 RECOMENDACIÓN: {best[0]}")
        print(f"   Tasa de éxito: {best[1]['valid']}/{len(sample_prompts)} categorías válidas")

if __name__ == "__main__":
    main()
