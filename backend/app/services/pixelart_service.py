# -*- coding: utf-8 -*-
"""Servicio para gestión de Pixel Art y generación con IA Multi-Proveedor"""
import uuid
import json
import re
import os
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.database import PixelArt, PixelArtLike, PixelArtComment, User, UserProfile
from app.services.gamification_service import GamificationService

# Usar multi-proveedor si está configurado, sino fallback a Ollama
try:
    from app.services.multi_ai_service import get_multi_ai_service, AIProvider
    MULTI_AI_AVAILABLE = True
except ImportError:
    from app.services.ollama_service import generate_text
    MULTI_AI_AVAILABLE = False

class PixelArtService:
    @staticmethod
    def create_piece(
        db: Session,
        user_id: str,
        title: str,
        pixels: dict,
        width: int = 32,
        height: int = 32,
        description: str = None,
        prompt: str = None,
        is_ai: bool = False
    ) -> PixelArt:
        piece_id = str(uuid.uuid4())
        piece = PixelArt(
            id=piece_id,
            user_id=user_id,
            title=title,
            description=description,
            pixels_json=pixels,
            width=width,
            height=height,
            prompt=prompt,
            is_ai_generated=is_ai
        )
        db.add(piece)
        
        # Puntos por creación
        action = 'pixelart_ai_generated' if is_ai else 'pixelart_created'
        GamificationService.add_points(db, user_id, action, f"Creaste una obra de Pixel Art: {title}")
        
        db.commit()
        db.refresh(piece)
        return piece

    @staticmethod
    def _parse_grid_response(response: str) -> list:
        """Extrae exactamente 16 líneas válidas de la respuesta del modelo"""
        # Buscar bloque de código entre ```
        code_block = re.search(r'```\n?([\s\S]*?)\n?```', response)
        if code_block:
            response = code_block.group(1)

        # Solo líneas que sean exactamente 16 caracteres de 0-7
        valid_pattern = re.compile(r'^[0-7]{16}$')
        lines = [line.strip() for line in response.split('\n')
                 if valid_pattern.match(line.strip())]

        return lines[:16]

    @staticmethod
    def _detect_object_type(prompt: str) -> str:
        """
        Detecta sugerencias de estilo para el prompt, pero NO limita la generación.
        Retorna 'general' para permitir máxima creatividad.
        """
        prompt_lower = prompt.lower()

        # Solo para sugerencias leves de composición, no para limitar
        style_hints = {
            'portrait': ['retrato', 'persona', 'avatar', 'rostro', 'cara'],
            'landscape': ['paisaje', 'atardecer', 'amanecer', 'montaña', 'horizonte'],
            'character': ['personaje', 'mario', 'pac-man', 'sonic', 'fantasma'],
            'object': ['objeto', 'casa', 'coche', 'mesa', 'silla', 'computadora']
        }

        for style, words in style_hints.items():
            if any(word in prompt_lower for word in words):
                return style

        return 'general'  # Sin restricciones - libertad total

    @staticmethod
    def _get_structure_prompt(object_type: str) -> str:
        """
        Retorna sugerencias de composición (NO reglas estrictas).
        El objetivo es guiar sin limitar la creatividad.
        """
        general_hint = """
COMPOSITION TIPS:
- Center the main subject
- Use the 16x16 space efficiently
- Make it recognizable and clear
- Be creative with the palette"""

        hints = {
            'general': general_hint,
            'portrait': """
PORTRAIT COMPOSITION:
- Focus on the face/upper body
- Center the subject horizontally
- Use appropriate proportions for head/body""",
            'landscape': """
LANDSCAPE COMPOSITION:
- Use upper rows for sky/background
- Place main subject in center-middle
- Use lower rows for ground/base""",
            'character': """
CHARACTER/SPRITE COMPOSITION:
- Make character recognizable
- Focus on key features (eyes, shapes, colors)
- Center in the grid""",
            'object': """
OBJECT COMPOSITION:
- Center the object prominently
- Make shape clear and recognizable
- Use contrasting colors for outline"""
        }
        return hints.get(object_type, general_hint)

    @staticmethod
    def _get_example_for_type(object_type: str) -> list:
        """
        Retorna un ejemplo genérico que muestra el formato SIN dictar qué crear.
        El ejemplo es abstracto para no influir en la generación.
        """
        # Ejemplo abstracto que solo muestra el formato 16x16
        abstract_example = [
            "0000000000000000",
            "0000000000000000",
            "0000111100000000",
            "0001122110000000",
            "0011122221000000",
            "0011122222110000",
            "0001122222210000",
            "0000111111100000",
            "0000111111100000",
            "0000011111000000",
            "0000011111000000",
            "0000001110000000",
            "0000001110000000",
            "0000001100000000",
            "0000000000000000",
            "0000000000000000"
        ]
        return abstract_example

    @staticmethod
    def _optimize_prompt(user_prompt: str) -> str:
        """
        Optimiza el prompt del usuario para mejor generación de pixel art.
        Usa IA para traducir español a inglés y luego estructura el prompt.
        """
        # Paso 1: Traducir a inglés usando IA
        try:
            translation_prompt = f"""Translate the following Spanish text to English.
Keep it natural and clear for generating pixel art.
Focus on the main subject, colors, and spatial relationships.

Spanish: {user_prompt}
English:"""

            if MULTI_AI_AVAILABLE:
                service = get_multi_ai_service()
                result = service.generate_text(translation_prompt, model="gpt-4.1-nano", temperature=0.3)
                if result["success"]:
                    prompt_en = result["response"].strip()
                    # Limpiar respuesta
                    prompt_en = prompt_en.replace("English:", "").strip()
                    print(f"[PixelArt] Traducción IA: '{user_prompt}' → '{prompt_en}'")
                else:
                    # Fallback a traducción básica
                    prompt_en = user_prompt
            else:
                prompt_en = user_prompt
        except Exception as e:
            print(f"[PixelArt] Error en traducción: {e}, usando prompt original")
            prompt_en = user_prompt

        # Paso 2: Estructurar prompt para pixel art
        # Extraer elementos clave del prompt en inglés
        found_colors = []
        found_objects = []
        found_position = None

        # Detectar colores (lista más completa)
        color_keywords = ["red", "blue", "green", "yellow", "black", "white", "brown", "gray", "grey", "pink", "purple", "orange", "violet"]
        for color in color_keywords:
            if color in prompt_en.lower():
                found_colors.append(color)

        # Detectar objetos comunes
        object_keywords = ["flower", "house", "cat", "dog", "sun", "moon", "tree", "car", "bird", "fish", "character", "knight", "flower", "rose", "tulip", "car", "tree"]
        prompt_lower = prompt_en.lower()
        for obj in object_keywords:
            if obj in prompt_lower:
                found_objects.append(obj)

        # Detectar preposiciones
        position_keywords = ["next to", "beside", "near", "with", "without", "on top of", "under", "between"]
        for pos in position_keywords:
            if pos in prompt_lower:
                found_position = pos
                break

        # Paso 3: Construir prompt optimizado
        if found_objects:
            # Tomar el primer objeto como sujeto principal
            main_subject = found_objects[0]

            # Si hay múltiples objetos
            if len(found_objects) > 1:
                second_object = found_objects[1]
                if found_position:
                    optimized = f"A {main_subject} {found_position} a {second_object}"
                else:
                    optimized = f"A {main_subject} and a {second_object}"
            else:
                optimized = f"A {main_subject}"

            # Agregar colores si existen
            if found_colors:
                colors_str = " and ".join(found_colors)
                if len(found_objects) > 1:
                    # Intentar asignar color al primer objeto
                    optimized = f"A {colors_str} {main_subject} {found_position} a {second_object}"
                else:
                    optimized = f"A {colors_str} {main_subject}"

            # Agregar contexto para pixel art
            optimized += ". Make it clearly visible and centered in the 16x16 grid. Use different shades (digits 1-7) to show depth and details."

            return optimized

        # Si no podemos extraer objetos, devolver la traducción completa
        return prompt_en

    @staticmethod
    def generate_with_ai(prompt: str) -> dict:
        """
        Usa IA multi-proveedor para generar una cuadrícula de 16x16.
        Optimiza automáticamente el prompt del usuario para mejor resultado.
        """
        palette_map = {
            "0": "#000000", # Fondo / Negro
            "1": "#FFDAB9", # Piel (tono humano)
            "2": "#4682B4", # Ropa / Azul Acero
            "3": "#FFFFFF", # Brillo / Gafas / Blanco
            "4": "#8B4513", # Cabello / Marrón
            "5": "#708090", # Metal / Marco Gafas / Gris
            "6": "#FF4500", # Detalle vibrante / Naranja
            "7": "#2F4F4F"  # Sombra / Gris oscuro
        }

        # Optimizar prompt del usuario (traducir, simplificar, estructurar)
        print(f"[PixelArt] Prompt original: {prompt}")
        optimized_prompt = PixelArtService._optimize_prompt(prompt)
        print(f"[PixelArt] Prompt optimizado: {optimized_prompt}")

        # Obtener sugerencias leves de composición (NO reglas)
        object_type = PixelArtService._detect_object_type(optimized_prompt)
        structure_prompt = PixelArtService._get_structure_prompt(object_type)
        example_lines = PixelArtService._get_example_for_type(object_type)

        # Translate Spanish prompts to English for better model compliance (como fallback)
        prompt_translations = {
            "retrato": "portrait", "rostro": "face", "cara": "face",
            "atardecer": "sunset", "amanecer": "sunrise", "paisaje": "landscape",
            "montaña": "mountain", "mar": "sea", "sol": "sun", "luna": "moon",
            "caballero": "knight", "personaje": "character", "alien": "alien",
            "robot": "robot", "casa": "house", "coche": "car", "mesa": "table",
            "gato": "cat", "perro": "dog", "pájaro": "bird", "pez": "fish",
            "pizza": "pizza", "manzana": "apple", "café": "coffee",
            "rio": "river", "río": "river", "azul": "blue", "arboles": "trees", "árboles": "trees",
            "verde": "green", "rojo": "red", "amarillo": "yellow",
        }

        # Aplicar traducciones restantes como fallback
        prompt_en = optimized_prompt
        for es, en in prompt_translations.items():
            prompt_en = prompt_en.replace(es, en)

        # Prompt directo y específico
        improved_prompt = f"""You are a pixel artist. Create a 16x16 pixel art image of: {prompt_en}

IMPORTANT: Draw the actual object described in the prompt. For example:
- If the prompt says "cat", draw a cat shape
- If it says "house", draw a house shape
- If it says "river", draw flowing water

Color rules:
- Use digit 0 for empty/black background
- Use digits 1-7 to draw the object with different shades
- Example: for a black cat on black background, use digits 1-7 for the cat's features
- Use white (3) for highlights, dark gray (7) for shadows

Output format: 16 lines of 16 digits each (only 0-7), no other text

Draw this: {prompt_en}"""

        # Usar multi-proveedor si está disponible, sino fallback a Ollama
        response = None
        provider_used = "unknown"
        try:
            if MULTI_AI_AVAILABLE:
                service = get_multi_ai_service()
                # Verificar que haya al menos un proveedor disponible
                available = service.get_available_providers()
                has_providers = len(available) > 0

                if has_providers:
                    # Usar proveedor configurado en .env (PIXELART_AI_PROVIDER)
                    result = service.generate_text(improved_prompt)
                    if result["success"]:
                        response = result["response"].strip()
                        provider_used = f"{result['provider']}/{result['model']}"
                    else:
                        print(f"[PixelArt] Error con proveedor principal: {result['error']}")
                        # Intentar con fallback
                        result = service.generate_with_fallback(improved_prompt)
                        if result["success"]:
                            response = result["response"].strip()
                            provider_used = f"{result['provider']}/{result['model']} (fallback)"
                        else:
                            print(f"[PixelArt] Todos los proveedores fallaron: {result['error']}")

            # Si multi-AI no disponible o falló, intentar con Ollama
            if response is None:
                from app.services.ollama_service import generate_text
                response = generate_text(improved_prompt).strip()
                provider_used = "ollama (fallback)"

        except Exception as e:
            print(f"[PixelArt] Error en generación IA: {e}, intentando Ollama")
            try:
                from app.services.ollama_service import generate_text
                response = generate_text(improved_prompt).strip()
                provider_used = "ollama (exception fallback)"
            except Exception as e2:
                print(f"[PixelArt] Error crítico: {e2}")
                return {"pixels": ["#000000"] * 1024}

        if response is None:
            print("[PixelArt] No se pudo generar respuesta, retornando fallback")
            return {"pixels": ["#000000"] * 1024}

        print(f"[PixelArt] Generado con: {provider_used}")
        lines = PixelArtService._parse_grid_response(response)

        if len(lines) < 16:
            # Fallback if AI fails to produce enough lines
            print(f"[PixelArt] Fallback: solo {len(lines)} líneas válidas encontradas")
            return {"pixels": ["#000000"] * 1024}

        # Convert 16x16 grid to 32x32 (upscaling)
        pixels_32x32 = []
        for r in range(32):
            row_16 = lines[r // 2]  # Duplicate each row 2x
            for c in range(32):
                char = row_16[c // 2]  # Duplicate each pixel 2x
                pixels_32x32.append(palette_map.get(char, "#000000"))

        return {"pixels": pixels_32x32}

    @staticmethod
    def get_gallery(db: Session, limit: int = 20, offset: int = 0):
        return db.query(PixelArt).filter_by(is_published=True).order_by(PixelArt.created_at.desc()).limit(limit).offset(offset).all()

    @staticmethod
    def toggle_like(db: Session, user_id: str, piece_id: str):
        existing = db.query(PixelArtLike).filter_by(user_id=user_id, pixel_art_id=piece_id).first()
        piece = db.query(PixelArt).filter_by(id=piece_id).first()
        
        if existing:
            db.delete(existing)
            piece.total_likes -= 1
        else:
            new_like = PixelArtLike(user_id=user_id, pixel_art_id=piece_id)
            db.add(new_like)
            piece.total_likes += 1
            # Puntos para el autor
            GamificationService.add_points(db, piece.user_id, 'pixelart_like_received', "Tu Pixel Art recibió un like")
            
        db.commit()
        return {"likes": piece.total_likes, "liked": not existing}

    @staticmethod
    def add_comment(db: Session, user_id: str, piece_id: str, content: str):
        comment_id = str(uuid.uuid4())
        comment = PixelArtComment(id=comment_id, pixel_art_id=piece_id, user_id=user_id, content=content)
        db.add(comment)

        piece = db.query(PixelArt).filter_by(id=piece_id).first()
        piece.total_comments += 1

        # Puntos para el autor
        GamificationService.add_points(db, piece.user_id, 'pixelart_comment_received', "Comentaron en tu Pixel Art")

        db.commit()
        db.refresh(comment)
        return comment

    @staticmethod
    def update_piece(db: Session, piece_id: str, user_id: str, title: str = None, pixels: dict = None) -> PixelArt:
        """Actualiza una pieza de pixel art (solo el propietario puede)"""
        piece = db.query(PixelArt).filter_by(id=piece_id).first()
        if not piece:
            raise HTTPException(status_code=404, detail="Obra no encontrada")
        if piece.user_id != user_id:
            raise HTTPException(status_code=403, detail="No puedes editar obras de otros usuarios")

        if title:
            piece.title = title
        if pixels:
            piece.pixels_json = pixels

        db.commit()
        db.refresh(piece)
        return piece

    @staticmethod
    def delete_piece(db: Session, piece_id: str, user_id: str) -> dict:
        """Elimina una pieza de pixel art (solo el propietario puede)"""
        piece = db.query(PixelArt).filter_by(id=piece_id).first()
        if not piece:
            raise HTTPException(status_code=404, detail="Obra no encontrada")
        if piece.user_id != user_id:
            raise HTTPException(status_code=403, detail="No puedes borrar obras de otros usuarios")

        # Eliminar likes y comentarios relacionados
        db.query(PixelArtLike).filter_by(pixel_art_id=piece_id).delete()
        db.query(PixelArtComment).filter_by(pixel_art_id=piece_id).delete()

        db.delete(piece)
        db.commit()
        return {"deleted": True, "id": piece_id}
