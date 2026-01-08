# -*- coding: utf-8 -*-
"""Servicio de traducción con contexto para desambiguación de prompts de Pixel Art."""
import re
from typing import Dict, Optional


class PixelArtTranslationService:
    """
    Servicio para traducir prompts de español a inglés con detección de contexto.
    Soluciona problemas de ambigüedad como "rosa" (flor vs color).
    """

    # Diccionario de palabras ambiguas con sus traducciones según contexto
    AMBIGUOUS_WORDS = {
        "rosa": {
            "flor": "rose",
            "color": "pink"
        },
        "naranja": {
            "flor": "orange blossom",
            "color": "orange",
            "fruta": "orange"
        },
        "café": {
            "bebida": "coffee",
            "color": "brown",
            "lugar": "cafe"
        },
        "vino": {
            "bebida": "wine",
            "color": "red wine"
        },
        "trigo": {
            "planta": "wheat",
            "color": "wheat color"
        }
    }

    # Palabras clave que indican contexto específico
    CONTEXT_INDICATORS = {
        "flor": [
            "flor", "flores", "pétalo", "pétalos", "pétalo", "planta", "plantas",
            "jardín", "jardin", "ramo", "bouquet", "tallo", "hojas", "hoja",
            "botón", "botón floral", "florecer", "brote"
        ],
        "color": [
            "color", "de color", "tono", "tonal", "pintar", "colorear",
            "matiz", "tinte", "pigmento", "sombra", "shader"
        ],
        "objeto": [
            "casa", "árbol", "arbol", "gato", "perro", "mesa", "silla", "coche",
            "persona", "niño", "niña", "nino", "nina", "retrato", "rostro"
        ],
        "bebida": [
            "beber", "tomar", "taza", "vaso", "botella", "copa", "líquido",
            "bebida", "beber", "trago", "sorbo"
        ],
        "fruta": [
            "fruta", "fruto", "comer", "dulce", "ácido", "jugoso", "cáscara"
        ]
    }

    @staticmethod
    def detect_context(prompt: str) -> Dict[str, bool]:
        """
        Detecta el contexto del prompt para desambiguar palabras.
        Retorna un diccionario con los contextos detectados.
        """
        prompt_lower = prompt.lower()

        detected_context = {
            "has_flowers": any(
                word in prompt_lower
                for word in PixelArtTranslationService.CONTEXT_INDICATORS["flor"]
            ),
            "has_colors": any(
                word in prompt_lower
                for word in PixelArtTranslationService.CONTEXT_INDICATORS["color"]
            ),
            "has_objects": len([
                word for word in PixelArtTranslationService.CONTEXT_INDICATORS["objeto"]
                if word in prompt_lower
            ]) > 2,
            "explicit_flower": any(
                flower in prompt_lower
                for flower in ["flor", "flores", "pétalo", "pétalos", "pétalo", "petalo", "petalos"]
            ),
            "explicity_color": any(
                color in prompt_lower
                for color in ["color", "de color", "tono", "pintar"]
            ),
            "explicit_drink": any(
                drink in prompt_lower
                for drink in ["beber", "tomar", "taza", "vaso", "bebida"]
            ),
            "explicit_fruit": any(
                fruit in prompt_lower
                for fruit in ["fruta", "fruto", "comer", "dulce"]
            )
        }

        return detected_context

    @staticmethod
    def disambiguate_translation(prompt: str) -> str:
        """
        Desambigua traducciones problemáticas basándose en el contexto.
        Retorna el prompt con las palabras ambiguas traducidas correctamente.
        """
        prompt_lower = prompt.lower()
        context = PixelArtTranslationService.detect_context(prompt)
        result = prompt

        # Caso especial: "rosa" (flor vs color)
        if "rosa" in prompt_lower:
            if context["explicit_flower"] or context["has_flowers"]:
                # Contexto claro de flor → "rose"
                # Usar regex con word boundaries y manejo de mayúsculas
                result = re.sub(
                    r"\b[Rr]osa\b",
                    "rose",
                    result,
                    flags=0
                )
                print(f"[TranslationContext] 'rosa' detectado como flor (rose)")
            elif context["explicity_color"]:
                # Contexto de color → "pink"
                result = re.sub(
                    r"\b[Rr]osa\b",
                    "pink",
                    result,
                    flags=0
                )
                print(f"[TranslationContext] 'rosa' detectado como color (pink)")
            else:
                # Sin contexto claro, ser explícito para evitar ambigüedad
                # Priorizar flor si hay palabras botánicas
                botanical_words = ["pétalo", "petalo", "tallo", "hoja", "jardín", "jardin", "petalo"]
                if any(word in prompt_lower for word in botanical_words):
                    result = re.sub(
                        r"\b[Rr]osa\b",
                        "rose",
                        result,
                        flags=0
                    )
                    print(f"[TranslationContext] 'rosa' → rose (contexto botánico)")
                else:
                    # Por defecto, priorizar flor (más común en pixel art)
                    # y dejar que la traducción IA maneje el resto
                    result = re.sub(
                        r"\b[Rr]osa\b",
                        "rose",
                        result,
                        flags=0
                    )
                    print(f"[TranslationContext] 'rosa' → rose (ambiguo, default flor)")

        # Caso especial: "naranja" (flor vs color vs fruta)
        if "naranja" in prompt_lower:
            if context["explicit_flower"] or context["has_flowers"]:
                # Si ya dice "flor" en el prompt, solo usar "orange"
                if "flor" in prompt_lower:
                    result = re.sub(
                        r"\b[Nn]aranja\b",
                        "orange",
                        result,
                        flags=0
                    )
                    print(f"[TranslationContext] 'naranja' → orange (contexto flor explícito)")
                else:
                    result = re.sub(
                        r"\b[Nn]aranja\b",
                        "orange flower",
                        result,
                        flags=0
                    )
                    print(f"[TranslationContext] 'naranja' → orange flower")
            elif context["explicit_fruit"] or any(
                word in prompt_lower for word in ["comer", "dulce", "fruta"]
            ):
                result = re.sub(
                    r"\b[Nn]aranja\b",
                    "orange fruit",
                    result,
                    flags=0
                )
                print(f"[TranslationContext] 'naranja' → orange fruit")
            # Si no hay contexto claro, dejar "orange" que sirve para ambos

        # Caso especial: "café" (bebida vs color vs lugar)
        if "café" in prompt_lower or "cafe" in prompt_lower:
            if context["explicit_drink"] or any(
                word in prompt_lower for word in ["taza", "vaso", "beber", "tomar"]
            ):
                result = re.sub(
                    r"\b[Cc]af[ée]\b",
                    "coffee",
                    result,
                    flags=0
                )
                print(f"[TranslationContext] 'café' → coffee")
            elif context["explicity_color"]:
                result = re.sub(
                    r"\b[Cc]af[ée]\b",
                    "brown",
                    result,
                    flags=0
                )
                print(f"[TranslationContext] 'café' → brown (color)")

        # Caso especial: "vino" (bebida vs color)
        if "vino" in prompt_lower and "vin" not in prompt_lower:
            if context["explicit_drink"]:
                result = re.sub(
                    r"\b[Vv]ino\b",
                    "wine",
                    result,
                    flags=0
                )
                print(f"[TranslationContext] 'vino' → wine")

        return result

    @staticmethod
    def get_translation_with_context(prompt: str) -> str:
        """
        Aplica desambiguación de contexto al prompt antes de la traducción IA.
        Este método debe llamarse ANTES de enviar el prompt a la IA para traducción.
        """
        # Primero desambiguamos las palabras problemáticas
        disambiguated = PixelArtTranslationService.disambiguate_translation(prompt)

        # Si hubo cambios, lo mostramos en logs
        if disambiguated != prompt:
            print(f"[TranslationContext] Prompt original: {prompt}")
            print(f"[TranslationContext] Prompt desambiguado: {disambiguated}")

        return disambiguated
