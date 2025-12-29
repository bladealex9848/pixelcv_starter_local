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
        if object_type == 'general':
            return """
COMPOSITION TIPS:
- Center the main subject
- Use the 16x16 space efficiently
- Make it recognizable and clear
- Be creative with the palette"""

        hints = {
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
        return hints.get(object_type, hints['general'])

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
    def generate_with_ai(prompt: str) -> dict:
        """
        Usa IA multi-proveedor (Groq por defecto) para generar una cuadrícula de 16x16.
        Permite TOTAL libertad creativa - solo define formato y paleta.
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

        # Obtener sugerencias leves de composición (NO reglas)
        object_type = PixelArtService._detect_object_type(prompt)
        structure_prompt = PixelArtService._get_structure_prompt(object_type)
        example_lines = PixelArtService._get_example_for_type(object_type)

        improved_prompt = f"""You are creating a 16x16 Pixel Art grid. The user wants: "{prompt}"

COLOR PALETTE (use ONLY digits 0-7):
0=Black/Background  1=Skin/Light tones  2=Blue/Cool colors  3=White/Bright
4=Brown/Dark tones  5=Gray/Metal  6=Orange/Accent  7=Shadow

{structure_prompt}

CRITICAL OUTPUT RULES:
1. Output EXACTLY 16 lines
2. Each line MUST have EXACTLY 16 characters
3. Use ONLY digits 0-7, nothing else
4. NO explanations, NO text before or after
5. Make it recognizable as: {prompt}

FORMAT EXAMPLE (abstract, showing 16x16 structure):
{chr(10).join(example_lines)}

Now CREATE the pixel art for: "{prompt}"
Output ONLY the 16 lines of 16 digits each:"""

        # Usar multi-proveedor si está disponible, sino fallback a Ollama
        if MULTI_AI_AVAILABLE:
            service = get_multi_ai_service()
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
                    return {"pixels": ["#000000"] * 1024}
        else:
            response = generate_text(improved_prompt).strip()
            provider_used = "ollama (legacy)"

        print(f"[PixelArt] Generado con: {provider_used}")
        lines = PixelArtService._parse_grid_response(response)

        if len(lines) < 16:
            # Fallback if AI fails to produce enough lines
            print(f"[PixelArt] Fallback: solo {len(lines)} líneas válidas encontradas")
            return {"pixels": ["#000000"] * 1024}

        # Convert 16x16 grid to 32x32 (upscaling)
        pixels_32x32 = []
        for r in range(32):
            row_16 = lines[min(r // 2, 15)]
            for c in range(32):
                char = row_16[min(c // 2, len(row_16)-1)]
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
