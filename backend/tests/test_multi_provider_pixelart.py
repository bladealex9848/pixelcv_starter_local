# -*- coding: utf-8 -*-
"""
Test Multi-Proveedor para Generación de Pixel Art con IA
Prueba todos los proveedores disponibles y determina el mejor.

Ejecutar:
    cd /Volumes/NVMe1TB/GitHub/pixelcv_starter_local/backend
    python tests/test_multi_provider_pixelart.py
"""
import sys
import os
import re
import time
from dataclasses import dataclass
from typing import Optional

# Agregar el directorio raíz del backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv()

from app.services.multi_ai_service import MultiAIService, AIProvider


@dataclass
class TestResult:
    """Resultado de un test de proveedor"""
    provider: str
    model: str
    success: bool
    valid_lines: int
    non_black_pixels: int
    unique_colors: int
    has_skin: bool
    has_clothing: bool
    has_glasses: bool
    time_seconds: float
    error: Optional[str] = None


# Prompt mejorado para generación de pixel art
PIXELART_PROMPT = """TASK: Create a 16x16 Pixel Art grid for: "Un ingeniero humano con gafas, como una foto profesional".

PALETTE (use ONLY these digits 0-7):
0=Black/Background  1=Skin  2=Blue/Clothing  3=White/Glasses  4=Brown/Hair  5=Gray/Metal  6=Orange/Accent  7=Shadow

STRUCTURE FOR HUMAN FIGURE:
- Rows 1-2: Background (mostly 0)
- Rows 3-5: HEAD (use 4 for hair on top, 1 for face, 5 or 3 for glasses)
- Rows 6-7: NECK (use 1 for skin)
- Rows 8-12: TORSO (use 2 for clothing)
- Rows 13-16: LEGS (use 2 or 7 for pants)

OUTPUT RULES:
1. Output EXACTLY 16 lines
2. Each line has EXACTLY 16 characters (only digits 0-7)
3. NO text, NO JSON, NO explanations before or after
4. Make figure centered and recognizable

COMPLETE EXAMPLE (engineer with glasses):
0000044440000000
0000444444000000
0003111113000000
0001111111000000
0005133315000000
0000111110000000
0000011100000000
0002222222000000
0022222222200000
0022222222200000
0022222222200000
0022222222200000
0000222220000000
0002200022000000
0002200022000000
0007700077000000

Now create the pixel art. Output ONLY the 16 lines of 16 digits each:"""


def parse_grid_response(response: str) -> list:
    """Extrae líneas válidas de la respuesta"""
    # Buscar bloque de código
    code_block = re.search(r'```\n?([\s\S]*?)\n?```', response)
    if code_block:
        response = code_block.group(1)

    valid_pattern = re.compile(r'^[0-7]{16}$')
    lines = [line.strip() for line in response.split('\n')
             if valid_pattern.match(line.strip())]
    return lines[:16]


def grid_to_pixels(lines: list) -> list:
    """Convierte grilla 16x16 a lista de 1024 colores (32x32)"""
    palette_map = {
        "0": "#000000", "1": "#FFDAB9", "2": "#4682B4", "3": "#FFFFFF",
        "4": "#8B4513", "5": "#708090", "6": "#FF4500", "7": "#2F4F4F"
    }

    if len(lines) < 16:
        return ["#000000"] * 1024

    pixels_32x32 = []
    for r in range(32):
        row_16 = lines[min(r // 2, 15)]
        for c in range(32):
            char = row_16[min(c // 2, len(row_16)-1)]
            pixels_32x32.append(palette_map.get(char, "#000000"))
    return pixels_32x32


def test_provider(service: MultiAIService, provider: AIProvider, model: str = None) -> TestResult:
    """Prueba un proveedor específico"""
    config = service.providers.get(provider)
    if not config:
        return TestResult(
            provider=provider.value, model="N/A", success=False,
            valid_lines=0, non_black_pixels=0, unique_colors=0,
            has_skin=False, has_clothing=False, has_glasses=False,
            time_seconds=0, error="Proveedor no configurado"
        )

    model = model or config.default_model
    print(f"\n  Probando {provider.value} con {model}...")

    start_time = time.time()
    result = service.generate_text(PIXELART_PROMPT, provider, model)
    elapsed = time.time() - start_time

    if not result["success"]:
        return TestResult(
            provider=provider.value, model=model, success=False,
            valid_lines=0, non_black_pixels=0, unique_colors=0,
            has_skin=False, has_clothing=False, has_glasses=False,
            time_seconds=elapsed, error=result["error"]
        )

    # Parsear respuesta
    lines = parse_grid_response(result["response"])
    pixels = grid_to_pixels(lines)

    # Analizar resultado
    non_black = len([p for p in pixels if p != "#000000"])
    unique = len(set(pixels))
    has_skin = "#FFDAB9" in pixels
    has_clothing = "#4682B4" in pixels
    has_glasses = "#FFFFFF" in pixels or "#708090" in pixels

    return TestResult(
        provider=provider.value,
        model=model,
        success=len(lines) >= 16,
        valid_lines=len(lines),
        non_black_pixels=non_black,
        unique_colors=unique,
        has_skin=has_skin,
        has_clothing=has_clothing,
        has_glasses=has_glasses,
        time_seconds=elapsed,
        error=None if len(lines) >= 16 else f"Solo {len(lines)} líneas válidas"
    )


def calculate_score(result: TestResult) -> float:
    """Calcula un puntaje para el resultado (0-100)"""
    if not result.success:
        return 0

    score = 0
    # Líneas válidas (max 30 puntos)
    score += min(result.valid_lines / 16 * 30, 30)
    # Píxeles no negros (max 25 puntos) - normalizado a ~400 como ideal
    score += min(result.non_black_pixels / 400 * 25, 25)
    # Colores únicos (max 15 puntos) - 5+ colores es ideal
    score += min(result.unique_colors / 5 * 15, 15)
    # Elementos clave (max 15 puntos)
    if result.has_skin:
        score += 5
    if result.has_clothing:
        score += 5
    if result.has_glasses:
        score += 5
    # Velocidad (max 15 puntos) - menos de 5s es ideal
    if result.time_seconds < 5:
        score += 15
    elif result.time_seconds < 10:
        score += 10
    elif result.time_seconds < 20:
        score += 5

    return round(score, 1)


def visualize_grid_compact(pixels: list, size: int = 32):
    """Visualización ASCII compacta (cada 2 píxeles = 1 char)"""
    char_map = {
        "#000000": " ", "#FFDAB9": "O", "#4682B4": "#",
        "#FFFFFF": "*", "#8B4513": "@", "#708090": "=",
        "#FF4500": "+", "#2F4F4F": ".",
    }
    print("  " + "-" * 16)
    for row in range(0, size, 2):
        line = "  |"
        for col in range(0, size, 2):
            pixel = pixels[row * size + col]
            line += char_map.get(pixel, "?")
        line += "|"
        print(line)
    print("  " + "-" * 16)


def main():
    print("=" * 70)
    print("TEST MULTI-PROVEEDOR DE PIXEL ART CON IA")
    print("=" * 70)

    service = MultiAIService()
    available = service.get_available_providers()

    print(f"\nProveedores disponibles: {[p.value for p in available]}")

    # Configuración de modelos a probar por proveedor
    test_configs = [
        (AIProvider.OLLAMA, "phi3.5:latest"),
        (AIProvider.GROQ, "llama-3.3-70b-versatile"),
        (AIProvider.GROQ, "llama-3.1-8b-instant"),
        (AIProvider.OPENROUTER, "meta-llama/llama-3.3-70b-instruct:free"),
        (AIProvider.DEEPSEEK, "deepseek-chat"),
        (AIProvider.TOGETHER, "Qwen/Qwen2.5-72B-Instruct-Turbo"),
        (AIProvider.TOGETHER, "meta-llama/Llama-3.2-3B-Instruct-Turbo"),
        (AIProvider.DEEPINFRA, "nvidia/Llama-3.3-Nemotron-Super-49B-v1.5"),
        (AIProvider.MISTRAL, "mistral-small-latest"),
    ]

    results = []
    for provider, model in test_configs:
        if provider not in available:
            print(f"\n  ⚠️  {provider.value} no disponible (API key no configurada)")
            continue

        try:
            result = test_provider(service, provider, model)
            results.append(result)

            if result.success:
                score = calculate_score(result)
                print(f"  ✅ {result.provider}/{result.model}")
                print(f"     Líneas: {result.valid_lines}/16 | No-negro: {result.non_black_pixels}")
                print(f"     Colores: {result.unique_colors} | Tiempo: {result.time_seconds:.1f}s")
                print(f"     Piel: {'✓' if result.has_skin else '✗'} | Ropa: {'✓' if result.has_clothing else '✗'} | Gafas: {'✓' if result.has_glasses else '✗'}")
                print(f"     SCORE: {score}/100")
            else:
                print(f"  ❌ {result.provider}/{result.model}: {result.error}")
        except Exception as e:
            print(f"  ❌ Error con {provider.value}/{model}: {e}")

    # Resumen y ranking
    print("\n" + "=" * 70)
    print("RANKING DE PROVEEDORES")
    print("=" * 70)

    successful = [r for r in results if r.success]
    if successful:
        ranked = sorted(successful, key=lambda r: calculate_score(r), reverse=True)
        for i, r in enumerate(ranked, 1):
            score = calculate_score(r)
            emoji = "🥇" if i == 1 else ("🥈" if i == 2 else ("🥉" if i == 3 else "  "))
            print(f"{emoji} #{i}: {r.provider}/{r.model} - Score: {score}/100 ({r.time_seconds:.1f}s)")

        # Determinar ganadores
        print("\n" + "=" * 70)
        print("RECOMENDACIONES")
        print("=" * 70)

        best = ranked[0]
        print(f"\n🏆 MEJOR GENERAL: {best.provider}/{best.model}")
        print(f"   Score: {calculate_score(best)}/100")

        # Más rápido exitoso
        fastest = min([r for r in successful if r.non_black_pixels > 100],
                      key=lambda r: r.time_seconds, default=None)
        if fastest and fastest != best:
            print(f"\n⚡ MÁS RÁPIDO: {fastest.provider}/{fastest.model}")
            print(f"   Tiempo: {fastest.time_seconds:.1f}s")

        # Configuración recomendada para .env
        print("\n" + "-" * 70)
        print("CONFIGURACIÓN RECOMENDADA PARA .env:")
        print("-" * 70)
        print(f"PIXELART_AI_PROVIDER={best.provider}")
        print(f"PIXELART_AI_MODEL={best.model}")
        if fastest and fastest != best:
            print(f"\n# Alternativa rápida:")
            print(f"# PIXELART_AI_PROVIDER={fastest.provider}")
            print(f"# PIXELART_AI_MODEL={fastest.model}")

        # Mostrar visualización del mejor
        print("\n" + "-" * 70)
        print(f"VISUALIZACIÓN DEL MEJOR ({best.provider}/{best.model}):")
        print("-" * 70)

        # Re-generar para visualizar
        result = service.generate_text(PIXELART_PROMPT, AIProvider(best.provider), best.model)
        if result["success"]:
            lines = parse_grid_response(result["response"])
            pixels = grid_to_pixels(lines)
            visualize_grid_compact(pixels)

    else:
        print("\n❌ Ningún proveedor generó un resultado válido")
        print("   Verifica las API keys en .env")

    # Guardar resultados para documentación
    print("\n" + "=" * 70)
    return results


if __name__ == "__main__":
    main()
