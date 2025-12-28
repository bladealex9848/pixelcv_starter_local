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
        Usa Ollama para generar una matriz de píxeles (código) basada en el prompt.
        Mejora el prompt internamente para obtener mejores resultados artísticos.
        """
        improved_prompt = f"""
        Actúa como un experto artista de Pixel Art. Genera una matriz de 32x32 píxeles para: "{prompt}".
        REGLAS ESTRICTAS:
        1. Responde ÚNICAMENTE con un objeto JSON válido.
        2. El formato debe ser: {{"pixels": ["#HEX", "#HEX", ...]}} donde hay exactamente 1024 colores.
        3. Usa una paleta retro vibrante.
        4. No incluyas explicaciones ni texto fuera del JSON.
        """
        
        response = generate_text(improved_prompt)
        try:
            # Intentar extraer JSON de la respuesta
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            print(f"[PixelArt] Error parseando IA: {e}")
            return {"pixels": ["#000000"] * 1024}

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
