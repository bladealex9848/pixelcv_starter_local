# -*- coding: utf-8 -*-
"""Servicio para gestión de Pixel Art y generación con Ollama"""
import uuid
import json
import re
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.database import PixelArt, PixelArtLike, PixelArtComment, User, UserProfile
from app.services.gamification_service import GamificationService
from app.services.ollama_service import generate_text

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
    def generate_with_ai(prompt: str) -> dict:
        """
        Usa Ollama para generar una cuadrícula de 16x16 basada en caracteres.
        Luego se mapea a colores y se escala a 32x32 para mayor fidelidad.
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

        improved_prompt = f"""TASK: Create a 16x16 Pixel Art grid for: "{prompt}".

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

Now create pixel art for: "{prompt}"
Output ONLY the 16 lines of 16 digits each:"""

        response = generate_text(improved_prompt).strip()
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
