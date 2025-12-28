# -*- coding: utf-8 -*-
"""Servicio para gestión de Pixel Art y generación con Ollama"""
import uuid
import json
from typing import List, Optional
from sqlalchemy.orm import Session
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
    def generate_with_ai(prompt: str) -> dict:
        """
        Usa Ollama para generar una cuadrícula de 16x16 basada en caracteres.
        Luego se mapea a colores y se escala a 32x32 para mayor fidelidad.
        """
        palette_map = {
            "0": "#000000", # Fondo / Negro
            "1": "#FFDAB9", # Piel (Ingeniero)
            "2": "#4682B4", # Ropa / Azul Acero
            "3": "#FFFFFF", # Brillo / Gafas
            "4": "#8B4513", # Cabello / Marrón
            "5": "#708090", # Metal / Marco Gafas
            "6": "#FF4500", # Detalle vibrante
            "7": "#2F4F4F"  # Sombra
        }
        
        improved_prompt = f"""
        TASK: Create a 16x16 Pixel Art representing: "{prompt}".
        PALETTE:
        0: Empty/Black, 1: Skin, 2: Clothing, 3: White/Highlights, 4: Hair, 5: Metal/Glasses, 6: Bright Detail, 7: Shadow.
        
        RULES:
        1. Output ONLY a block of 16 lines, each with 16 characters from the palette (0-7).
        2. No text, no JSON, just the grid.
        3. Make it centered and recognizable.
        
        EXAMPLE OUTPUT:
        0000444400000000
        0004444440000000
        ... (16 lines)
        """
        
        response = generate_text(improved_prompt).strip()
        lines = [line.strip() for line in response.split('\n') if any(c in "01234567" for c in line)]
        
        if len(lines) < 16:
            # Fallback if AI fails to produce enough lines
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
