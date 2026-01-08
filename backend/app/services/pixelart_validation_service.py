# -*- coding: utf-8 -*-
"""Servicio de validación de resultados de PixelArt generado por IA."""
import re
from typing import Dict, Any, List, Tuple
import numpy as np


class PixelArtValidationService:
    """
    Servicio para validar la coherencia y calidad de pixelart generado.
    Analiza distribución de colores, formas y elementos esperados.
    """

    @staticmethod
    def validate_generation(prompt: str, pixels: list[str]) -> Dict[str, Any]:
        """
        Valida si la generación es coherente con el prompt.
        Retorna dict con validación completa y suggestions.
        """
        validation = {
            "is_valid": True,
            "confidence": 0.0,
            "issues": [],
            "suggestions": [],
            "metrics": {}
        }

        # 1. Verificar que no esté vacío/negro
        non_black = sum(1 for p in pixels if p != "#000000")
        total = len(pixels)
        validation["metrics"]["colored_pixels"] = non_black
        validation["metrics"]["colored_percentage"] = (non_black / total) * 100 if total > 0 else 0

        if non_black < 50:
            validation["is_valid"] = False
            validation["confidence"] = 0.0
            validation["issues"].append("La imagen está casi vacía")
            validation["suggestions"].append("Intenta con un prompt más descriptivo")
            return validation

        # 2. Verificar distribución de colores
        unique_colors = len(set(pixels))
        validation["metrics"]["unique_colors"] = unique_colors

        if unique_colors < 3:
            validation["issues"].append(f"Pocos colores usados: {unique_colors}")
            validation["suggestions"].append("Añade más detalles o colores al prompt")
            validation["confidence"] -= 0.1
        elif unique_colors > 8:
            # Buena variedad de colores
            validation["confidence"] += 0.1

        # 3. Verificar palabras clave del prompt
        prompt_lower = prompt.lower()
        detected_elements = PixelArtValidationService._check_expected_elements(prompt_lower, pixels)
        validation["metrics"]["detected_elements"] = detected_elements

        # Calcular puntuación de elementos
        if detected_elements["total_expected"] > 0:
            element_ratio = detected_elements["total_found"] / detected_elements["total_expected"]
            validation["metrics"]["element_detection_ratio"] = element_ratio
            validation["confidence"] += element_ratio * 0.5

        # 4. Verificar balance de la imagen
        balance = PixelArtValidationService._check_image_balance(pixels)
        validation["metrics"]["balance"] = balance
        if balance > 0.3:
            validation["confidence"] += 0.1
        elif balance < 0.1:
            validation["issues"].append("La imagen está desbalanceada (demasiado concentrada)")
            validation["confidence"] -= 0.1

        # 5. Verificar complejidad
        complexity = PixelArtValidationService._calculate_complexity(pixels)
        validation["metrics"]["complexity"] = complexity
        if complexity < 0.2:
            validation["issues"].append("La imagen es muy simple")
            validation["suggestions"].append("Añade más detalles al prompt")

        # Normalizar confidence a 0-1
        validation["confidence"] = max(0.0, min(1.0, validation["confidence"]))

        # Determinar si es válida (confidence > 0.5)
        validation["is_valid"] = validation["confidence"] > 0.5

        return validation

    @staticmethod
    def _check_expected_elements(prompt: str, pixels: list[str]) -> Dict[str, Any]:
        """
        Verifica si los elementos esperados del prompt están presentes.
        Usa análisis de distribución de colores y patrones.
        """
        detected = {
            "found": [],
            "missing": [],
            "total_found": 0,
            "total_expected": 0
        }

        # Convertir a matriz 32x32 para análisis espacial
        grid = np.array(pixels).reshape(32, 32)

        # Elementos esperados y sus indicadores visuales
        elements = {
            "sol": {
                "keywords": ["sol", "sun", "soleado"],
                "check": lambda g: PixelArtValidationService._has_circle_in_upper_quarter(g),
                "description": "círculo en cuarto superior"
            },
            "luna": {
                "keywords": ["luna", "moon", "lunar"],
                "check": lambda g: PixelArtValidationService._has_circle_in_upper_quarter(g),
                "description": "círculo en cuadro superior"
            },
            "casa": {
                "keywords": ["casa", "house", "vivienda"],
                "check": lambda g: PixelArtValidationService._has_rectangle_and_triangle(g),
                "description": "rectángulo + triángulo"
            },
            "árbol": {
                "keywords": ["árbol", "arbol", "tree"],
                "check": lambda g: PixelArtValidationService._has_vertical_structure_with_top(g),
                "description": "estructura vertical con copa"
            },
            "flor": {
                "keywords": ["flor", "flower", "rosa", "pétalo"],
                "check": lambda g: PixelArtValidationService._has_circle_with_surrounding(g),
                "description": "círculo central con elementos alrededor"
            },
            "gato": {
                "keywords": ["gato", "cat"],
                "check": lambda g: PixelArtValidationService._has_ears_shape(g),
                "description": "forma con orejas puntiagudas"
            },
            "persona": {
                "keywords": ["persona", "person", "niño", "niña", "nino", "nina", "retrato", "cara"],
                "check": lambda g: PixelArtValidationService._has_vertical_symmetry(g),
                "description": "simetría vertical (rostro)"
            },
            "rio": {
                "keywords": ["río", "rio", "river", "agua"],
                "check": lambda g: PixelArtValidationService._has_horizontal_wavy_line(g),
                "description": "línea horizontal ondulada"
            },
            "montaña": {
                "keywords": ["montaña", "montana", "mountain"],
                "check": lambda g: PixelArtValidationService._has_triangle_shape(g),
                "description": "forma triangular"
            }
        }

        # Verificar cada elemento
        for element_name, element_data in elements.items():
            if any(keyword in prompt for keyword in element_data["keywords"]):
                detected["total_expected"] += 1
                try:
                    if element_data["check"](grid):
                        detected["found"].append(element_name)
                        detected["total_found"] += 1
                    else:
                        detected["missing"].append(element_name)
                except Exception as e:
                    print(f"[Validation] Error verificando {element_name}: {e}")
                    detected["missing"].append(element_name)

        return detected

    @staticmethod
    def _has_circle_in_upper_quarter(grid: np.ndarray) -> bool:
        """Verifica si hay un círculo en el cuarto superior de la imagen."""
        upper_portion = grid[:8, :]  # Primeras 8 filas
        # Buscar agrupación de píxeles no negros
        non_regions = PixelArtValidationService._find_colored_regions(upper_portion)
        return len(non_regions) > 0

    @staticmethod
    def _has_rectangle_and_triangle(grid: np.ndarray) -> bool:
        """Verifica si hay forma similar a casa (rectángulo + triángulo)."""
        # Buscar región rectangular en parte inferior
        lower_half = grid[16:, :]
        # Buscar región más densa
        return PixelArtValidationService._has_dense_region(lower_half, threshold=0.3)

    @staticmethod
    def _has_vertical_structure_with_top(grid: np.ndarray) -> bool:
        """Verifica si hay estructura vertical con algo en la parte superior (árbol)."""
        # Buscar columna o columnas verticales con píxeles
        center = grid[:, 12:20]  # Columnas centrales
        has_trunk = np.any(center != "#000000")

        # Verificar si hay algo en la parte superior
        top = grid[:12, :]
        has_top = np.any(top != "#000000")

        return has_trunk and has_top

    @staticmethod
    def _has_circle_with_surrounding(grid: np.ndarray) -> bool:
        """Verifica si hay un círculo con elementos alrededor (flor)."""
        # Buscar región central densa
        center = grid[8:24, 8:24]
        center_density = np.sum(center != "#000000") / center.size

        # Verificar si hay píxeles alrededor
        return center_density > 0.3

    @staticmethod
    def _has_ears_shape(grid: np.ndarray) -> bool:
        """Verifica si hay forma con orejas (gato)."""
        # Buscar tres regiones verticales: oreja izq, centro, oreja der
        upper = grid[:12, :]

        # Dividir en tercios
        left = upper[:, :10]
        middle = upper[:, 10:22]
        right = upper[:, 22:]

        left_has = np.any(left != "#000000")
        middle_has = np.any(middle != "#000000")
        right_has = np.any(right != "#000000")

        return left_has and middle_has and right_has

    @staticmethod
    def _has_vertical_symmetry(grid: np.ndarray) -> bool:
        """Verifica si hay simetría vertical (rostro/persona)."""
        # Comparar mitades izq y der
        left_half = grid[:, :16]
        right_half = grid[:, 16:]

        # Contar píxeles no negros en cada mitad
        left_count = np.sum(left_half != "#000000")
        right_count = np.sum(right_half != "#000000")

        # Verificar simetría aproximada
        if left_count == 0 or right_count == 0:
            return False

        ratio = min(left_count, right_count) / max(left_count, right_count)
        return ratio > 0.6

    @staticmethod
    def _has_horizontal_wavy_line(grid: np.ndarray) -> bool:
        """Verifica si hay línea horizontal ondulada (río)."""
        # Buscar en tercio inferior o medio
        lower_third = grid[20:, :]

        # Verificar si hay líneas horizontales con variación vertical
        for y in range(lower_third.shape[0] - 1):
            row = lower_third[y, :]
            next_row = lower_third[y + 1, :]

            # Buscar píxeles en ambas filas
            if np.any(row != "#000000") and np.any(next_row != "#000000"):
                return True

        return False

    @staticmethod
    def _has_triangle_shape(grid: np.ndarray) -> bool:
        """Verifica si hay forma triangular (montaña)."""
        # Buscar patrón triangular en la imagen
        center_col = 16

        # Verificar si hay píxeles que se ensanchan hacia abajo
        for y in range(5, 20):
            width = min(y * 2, 32)
            start = max(0, center_col - width // 2)
            end = min(32, center_col + width // 2)
            row = grid[y, start:end]

            if np.any(row != "#000000"):
                return True

        return False

    @staticmethod
    def _has_dense_region(grid: np.ndarray, threshold: float = 0.3) -> bool:
        """Verifica si hay una región densa de píxeles coloreados."""
        non_black = np.sum(grid != "#000000")
        density = non_black / grid.size
        return density >= threshold

    @staticmethod
    def _find_colored_regions(grid: np.ndarray) -> int:
        """Cuenta regiones de píxeles coloreados."""
        non_black = grid != "#000000"

        # Contar regiones conectadas (simplificado)
        regions = 0
        visited = set()

        for y in range(grid.shape[0]):
            for x in range(grid.shape[1]):
                if non_black[y, x] and (y, x) not in visited:
                    regions += 1
                    # Marcar región (simplificado - solo marca el píxel)
                    visited.add((y, x))

        return regions

    @staticmethod
    def _check_image_balance(pixels: list[str]) -> float:
        """
        Calcula el balance de la imagen.
        Retorna 0-1, donde 1 es perfectamente balanceado.
        """
        grid = np.array(pixels).reshape(32, 32)

        # Dividir en 4 cuadrantes
        top_left = grid[:16, :16]
        top_right = grid[:16, 16:]
        bottom_left = grid[16:, :16]
        bottom_right = grid[16:, 16:]

        # Contar píxeles no negros en cada cuadrante
        counts = [
            np.sum(top_left != "#000000"),
            np.sum(top_right != "#000000"),
            np.sum(bottom_left != "#000000"),
            np.sum(bottom_right != "#000000")
        ]

        total = sum(counts)
        if total == 0:
            return 0.0

        # Calcular desviación estándar relativa
        mean = total / 4
        variance = sum((c - mean) ** 2 for c in counts) / 4
        std = variance ** 0.5

        # Balance = 1 - (std_dev / mean)
        balance = 1 - (std / mean if mean > 0 else 0)
        return max(0.0, min(1.0, balance))

    @staticmethod
    def _calculate_complexity(pixels: list[str]) -> float:
        """
        Calcula la complejidad de la imagen.
        Considera variedad de colores y patrones.
        """
        unique_colors = len(set(pixels))
        total = len(pixels)

        # Complejidad base por colores
        color_complexity = min(1.0, unique_colors / 20)

        # Complejidad por distribución
        grid = np.array(pixels).reshape(32, 32)
        non_black = np.sum(grid != "#000000")
        distribution = non_black / total

        # Complejidad combinada
        complexity = (color_complexity * 0.6) + (distribution * 0.4)
        return complexity

    @staticmethod
    def compare_variants(prompt: str, variants: List[dict]) -> int:
        """
        Compara múltiples variantes y retorna el índice de la mejor.
        Usa el confidence score de validación.
        """
        if not variants:
            return 0

        best_index = 0
        best_score = -1

        for i, variant in enumerate(variants):
            validation = variant.get("validation", {})
            confidence = validation.get("confidence", 0.0)

            # Preferir variantes con mayor confidence
            # Si hay empate, preferir PixelLab
            if confidence > best_score:
                best_score = confidence
                best_index = i
            elif confidence == best_score:
                # Empate: preferir PixelLab
                if variant.get("provider") == "pixellab":
                    best_index = i

        return best_index
