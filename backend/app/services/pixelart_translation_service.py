# -*- coding: utf-8 -*-
"""Servicio de traducción con contexto para desambiguación de prompts de Pixel Art."""
import re
import os
from typing import Dict, Optional

# Try to import multi-AI service for LLM-based disambiguation
try:
    from app.services.multi_ai_service import get_multi_ai_service
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


class PixelArtTranslationService:
    """
    Servicio para traducir prompts de español a inglés con detección de contexto.
    Soluciona problemas de ambigüedad como "rosa" (flor vs color).

    Estrategia:
    1. Método primario: LLM para detectar contexto y desambiguar
    2. Método fallback: Diccionario estático de palabras ambiguas
    """

    @staticmethod
    def disambiguate_with_llm(prompt: str) -> Optional[str]:
        """
        Usa el LLM para desambiguar palabras problemáticas en el prompt.
        Retorna el prompt desambiguado o None si falla.
        """
        if not LLM_AVAILABLE:
            return None

        try:
            disambiguation_prompt = f"""You are a translation assistant for pixel art generation. Your task is to identify and resolve ambiguous Spanish words in prompts.

Analyze this Spanish prompt: "{prompt}"

Common ambiguities to resolve:
- "rosa" → "rose" (flower) OR "pink" (color)
- "naranja" → "orange" (color) OR "orange" (fruit) OR "orange blossom" (flower)
- "café" → "coffee" (drink) OR "brown" (color) OR "cafe" (place)
- "vino" → "wine" (drink) OR "red wine color" (color)

Determine the correct translation based on CONTEXT:
- If mentioning petals, plants, garden, bouquet → flower
- If mentioning color, paint, tone, shade → color
- If mentioning eat, sweet, fruit → fruit
- If mentioning drink, cup, glass → drink

Return ONLY the corrected prompt with ambiguous words translated to their specific English meaning. Preserve all other words in Spanish.

Example:
Input: "Rosa Roja"
Output: "rose Roja"

Input: "Color rosa para pintar"
Output: "Color pink para pintar"

Now analyze: "{prompt}"

Output:"""


            service = get_multi_ai_service()
            result = service.generate_text(disambiguation_prompt, model="gpt-4.1-nano", temperature=0.3)

            if result["success"]:
                disambiguated = result["response"].strip().strip('"').strip("'")
                # Limpiar posibles prefijos como "Output:"
                if ":" in disambiguated and len(disambiguated.split(":")) > 1:
                    disambiguated = disambiguated.split(":", 1)[1].strip()

                if disambiguated and disambiguated != prompt:
                    print(f"[TranslationLLM] Prompt desambiguado via LLM")
                    print(f"[TranslationLLM] Original: {prompt}")
                    print(f"[TranslationLLM] Desambiguado: {disambiguated}")
                    return disambiguated
                else:
                    print(f"[TranslationLLM] LLM no hizo cambios, usando fallback")
                    return None
            else:
                print(f"[TranslationLLM] Error en LLM: {result.get('error', 'unknown')}")
                return None

        except Exception as e:
            print(f"[TranslationLLM] Excepción: {e}, usando diccionario fallback")
            return None

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
        Estrategia:
        1. Intenta usar LLM para detectar contexto y desambiguar
        2. Si LLM falla, usa diccionario estático como fallback
        """
        # Paso 1: Intentar desambiguación con LLM
        llm_result = PixelArtTranslationService.disambiguate_with_llm(prompt)
        if llm_result:
            return llm_result

        # Paso 2: Fallback a diccionario estático
        print(f"[TranslationFallback] Usando diccionario estático")
        return PixelArtTranslationService._disambiguate_with_dict(prompt)

    @staticmethod
    def _disambiguate_with_dict(prompt: str) -> str:
        """
        Fallback: Desambigua usando diccionario estático de reglas.
        """
        prompt_lower = prompt.lower()
        context = PixelArtTranslationService.detect_context(prompt)
        result = prompt

        # Caso especial: "rosa" (flor vs color)
        if "rosa" in prompt_lower:
            if context["explicit_flower"] or context["has_flowers"]:
                # Contexto claro de flor → "rose"
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
