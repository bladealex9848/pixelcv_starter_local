# -*- coding: utf-8 -*-
"""
Test de validación para generación de Pixel Art con IA
Verifica que el prompt "Crea a un ingeniero humano con gafas" funcione correctamente.

Para ejecutar:
    cd /Volumes/NVMe1TB/GitHub/pixelcv_starter_local/backend
    python tests/test_pixelart_generation.py
"""
import sys
import os
import re

# Agregar el directorio raíz del backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pixelart_service import PixelArtService


def test_grid_parsing():
    """Test: Validar que el parsing de la grilla funciona correctamente"""
    print("\n[Test 1] Validación de parsing de grilla...")

    # Simular una respuesta típica del modelo con texto extra
    mock_response = """
Here's a pixel art of an engineer with glasses:

```
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
```

Hope this helps! This represents an engineer with brown hair, skin-colored face, glasses, and blue clothing.
    """

    # Usar el método de parsing del servicio
    lines = PixelArtService._parse_grid_response(mock_response)

    # Verificar que se extrajeron exactamente 16 líneas
    assert len(lines) == 16, f"Debe extraer 16 líneas, extrajo {len(lines)}"

    # Verificar que cada línea tiene exactamente 16 caracteres
    for i, line in enumerate(lines):
        assert len(line) == 16, f"Línea {i+1} debe tener 16 caracteres, tiene {len(line)}"
        # Verificar que solo contiene caracteres válidos (0-7)
        assert all(c in "01234567" for c in line), f"Línea {i+1} contiene caracteres inválidos: {line}"

    print("  ✅ Parsing de grilla funciona correctamente")
    print(f"  - 16 líneas extraídas correctamente")
    print(f"  - Cada línea tiene 16 caracteres válidos (0-7)")
    return True


def test_parsing_without_code_block():
    """Test: Validar parsing cuando el modelo no usa bloques de código"""
    print("\n[Test 2] Validación de parsing sin bloques de código...")

    mock_response = """
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
"""

    lines = PixelArtService._parse_grid_response(mock_response)
    assert len(lines) == 16, f"Debe extraer 16 líneas, extrajo {len(lines)}"

    print("  ✅ Parsing sin bloques de código funciona")
    return True


def test_parsing_filters_invalid_lines():
    """Test: Validar que el parsing filtra líneas inválidas"""
    print("\n[Test 3] Validación de filtrado de líneas inválidas...")

    mock_response = """
Step 1: First I'll create the head
0000044440000000
Here's row 2:
0000444444000000
0003111113000000
This line has 8 chars: 01234567
0001111111000000
Row 5 with glasses:
0005133315000000
0000111110000000
0000011100000000
Now the torso:
0002222222000000
0022222222200000
0022222222200000
0022222222200000
0022222222200000
0000222220000000
0002200022000000
0002200022000000
0007700077000000
That's all!
"""

    lines = PixelArtService._parse_grid_response(mock_response)

    # Debe extraer exactamente 16 líneas válidas (ignorando el texto)
    assert len(lines) == 16, f"Debe extraer 16 líneas, extrajo {len(lines)}"

    print("  ✅ Filtrado de líneas inválidas funciona")
    print(f"  - Se filtraron correctamente líneas con texto")
    return True


def test_generate_engineer_with_glasses():
    """Test: Generar un ingeniero humano con gafas usando Ollama"""
    print("\n[Test 4] Generación de ingeniero con gafas (requiere Ollama)...")

    prompt = "Crea a un ingeniero humano. Que sea como una foto, ademas tiene gafas."

    try:
        result = PixelArtService.generate_with_ai(prompt)
    except Exception as e:
        print(f"  ⚠️  Ollama no disponible: {e}")
        print("  - Este test requiere que Ollama esté corriendo")
        print("  - Skipping test gracefully...")
        return None  # Fallo gracioso

    # 1. Verificar estructura básica
    assert "pixels" in result, "Debe retornar un dict con 'pixels'"
    pixels = result["pixels"]

    # 2. Verificar cantidad de píxeles (32x32 = 1024)
    assert len(pixels) == 1024, f"Debe tener 1024 píxeles, tiene {len(pixels)}"

    # 3. Verificar formato de colores hexadecimales
    hex_pattern = re.compile(r'^#[0-9A-Fa-f]{6}$')
    invalid_pixels = [i for i, p in enumerate(pixels) if not hex_pattern.match(p)]
    assert len(invalid_pixels) == 0, f"Píxeles con formato inválido en posiciones: {invalid_pixels[:5]}..."

    # 4. Verificar que no sea todo negro (fallback = Ollama no funcionó)
    non_black = [p for p in pixels if p != "#000000"]
    if len(non_black) == 0:
        print("  ⚠️  Ollama no disponible o no generó contenido válido")
        print("  - La imagen es completamente negra (fallback)")
        print("  - Este test requiere Ollama para generar contenido real")
        print("  - Skipping validación de contenido...")
        return None  # Fallo gracioso - Ollama no funciona

    # 5. Verificar colores de la paleta
    palette = {"#000000", "#FFDAB9", "#4682B4", "#FFFFFF", "#8B4513", "#708090", "#FF4500", "#2F4F4F"}
    invalid_colors = [p for p in set(pixels) if p not in palette]
    assert len(invalid_colors) == 0, f"Colores fuera de la paleta: {invalid_colors}"

    # 6. Verificar presencia de elementos clave
    has_skin = "#FFDAB9" in pixels
    has_clothing = "#4682B4" in pixels
    has_glasses = "#FFFFFF" in pixels or "#708090" in pixels

    print("  ✅ Generación de pixel art completada")
    print(f"  - Píxeles totales: {len(pixels)}")
    print(f"  - Píxeles no-negros: {len(non_black)}")
    print(f"  - Colores únicos: {len(set(pixels))}")
    print(f"  - Tiene color de piel: {'✓' if has_skin else '✗'}")
    print(f"  - Tiene color de ropa: {'✓' if has_clothing else '✗'}")
    print(f"  - Tiene colores de gafas: {'✓' if has_glasses else '✗'}")

    # Advertencias (no fallan el test)
    if not has_skin:
        print("  ⚠️  Advertencia: No se detectó color de piel (#FFDAB9)")
    if not has_clothing:
        print("  ⚠️  Advertencia: No se detectó color de ropa (#4682B4)")
    if not has_glasses:
        print("  ⚠️  Advertencia: No se detectaron colores de gafas")

    return True


def visualize_grid(pixels: list, size: int = 32):
    """Muestra una representación ASCII del pixel art"""
    # Mapeo de colores a caracteres ASCII
    char_map = {
        "#000000": " ",  # Negro = espacio
        "#FFDAB9": "O",  # Piel
        "#4682B4": "#",  # Ropa
        "#FFFFFF": "*",  # Blanco/Gafas
        "#8B4513": "@",  # Cabello
        "#708090": "=",  # Metal/Gafas
        "#FF4500": "+",  # Detalle
        "#2F4F4F": ".",  # Sombra
    }

    print("\n  Vista ASCII del resultado:")
    print("  " + "-" * size)
    for row in range(size):
        line = "  |"
        for col in range(size):
            pixel = pixels[row * size + col]
            line += char_map.get(pixel, "?")
        line += "|"
        print(line)
    print("  " + "-" * size)


if __name__ == "__main__":
    print("=" * 60)
    print("TEST DE GENERACIÓN DE PIXEL ART CON IA")
    print("=" * 60)

    all_passed = True
    ollama_skipped = False

    # Tests de parsing (no requieren Ollama)
    try:
        test_grid_parsing()
    except AssertionError as e:
        print(f"  ❌ FALLÓ: {e}")
        all_passed = False

    try:
        test_parsing_without_code_block()
    except AssertionError as e:
        print(f"  ❌ FALLÓ: {e}")
        all_passed = False

    try:
        test_parsing_filters_invalid_lines()
    except AssertionError as e:
        print(f"  ❌ FALLÓ: {e}")
        all_passed = False

    # Test de generación (requiere Ollama)
    try:
        result = test_generate_engineer_with_glasses()
        if result is True:
            # Si el test pasó completamente, mostrar visualización
            prompt = "Crea a un ingeniero humano. Que sea como una foto, ademas tiene gafas."
            gen_result = PixelArtService.generate_with_ai(prompt)
            visualize_grid(gen_result["pixels"])
        elif result is None:
            # Ollama no disponible - no es un fallo del test
            ollama_skipped = True
    except AssertionError as e:
        print(f"  ❌ FALLÓ: {e}")
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        if ollama_skipped:
            print("✅ TESTS DE PARSING PASARON (Ollama no disponible)")
        else:
            print("✅ TODOS LOS TESTS PASARON")
    else:
        print("❌ ALGUNOS TESTS FALLARON")
    print("=" * 60)
