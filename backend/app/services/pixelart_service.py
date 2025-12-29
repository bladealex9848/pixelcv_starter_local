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
        """Detecta si el prompt pide humano, personaje, naturaleza u objeto"""
        prompt_lower = prompt.lower()
        keywords = {
            'human': ['persona', 'human', 'gente', 'person', 'character', 'personaje',
                      'ingeniero', 'doctor', 'medico', 'niño', 'niña', 'mujer', 'hombre',
                      'avatar', 'gente', 'chico', 'chica', 'bebé', 'bebe', 'caballero', 'dama'],
            'character': ['pac-man', 'pacman', 'mario', 'sonic', 'fantasma', 'ghost',
                          'monster', 'monstruo', 'poke', 'dragon', 'dino', 'dinosaurio',
                          'zombie', 'alien', 'robot', 'ninja', 'pirata'],
            'nature': ['flor', 'flower', 'árbol', 'arbol', 'tree', 'planta', 'plant',
                       'atardecer', 'sunset', 'amanecer', 'sunrise', 'sol', 'sun',
                       'luna', 'moon', 'estrella', 'star', 'montaña', 'mountain', 'mar', 'sea'],
            'object': ['coche', 'car', 'auto', 'carro', 'casa', 'house', 'mesa', 'table',
                       'silla', 'chair', 'computadora', 'computer', 'laptop', 'teléfono', 'phone',
                       'libro', 'book', 'reloj', 'watch', 'gafas', 'lentes']
        }
        for obj_type, words in keywords.items():
            if any(word in prompt_lower for word in words):
                return obj_type
        return 'human'  # Default

    @staticmethod
    def _get_structure_prompt(object_type: str) -> str:
        """Retorna la estructura específica según el tipo de objeto"""
        structures = {
            'human': """
HUMAN FIGURE STRUCTURE:
- Rows 1-2: Background/sky (mostly 0)
- Rows 3-5: HEAD (use 4 for hair on top, 1 for face, 5 or 3 for glasses/accessories)
- Rows 6-7: NECK (use 1 for skin)
- Rows 8-12: TORSO (use 2 for clothing)
- Rows 13-16: LEGS (use 2 or 7 for pants/shoes)""",
            'character': """
CHARACTER/SPRITE STRUCTURE:
- Center the character in the middle
- Use pixels efficiently for recognizable shape
- Focus on distinctive features (eyes, mouth, props)
- Leave appropriate background space
- Make it look like a game character""",
            'nature': """
NATURE/SCENE STRUCTURE:
- Top rows: Sky/background gradient (0 for dark, 3/6 for bright)
- Middle rows: Main subject (flower, sun, tree, etc.)
- Bottom rows: Ground/stem/frame
- Use natural colors from palette creatively""",
            'object': """
OBJECT STRUCTURE:
- Center the object prominently
- Use clear outlines with contrasting colors
- Show recognizable shape and key details
- Keep background minimal (mostly 0)"""
        }
        return structures.get(object_type, structures['human'])

    @staticmethod
    def _get_example_for_type(object_type: str) -> list:
        """Retorna un ejemplo de 16 líneas según el tipo de objeto"""
        examples = {
            'human': [
                "0000044440000000",
                "0000444444000000",
                "0003111113000000",
                "0001111111000000",
                "0005111115000000",
                "0000111110000000",
                "0000011100000000",
                "0002222222000000",
                "0022222222200000",
                "0022222222200000",
                "0022222222200000",
                "0022222222200000",
                "0000222220000000",
                "0002200022000000",
                "0002200022000000",
                "0007700077000000"
            ],
            'character': [
                "0000000000000000",
                "0000000000000000",
                "0000066000000000",
                "0000666666000000",
                "0006633336600000",
                "0066333333660000",
                "0063311113360000",
                "0063111111360000",
                "0063111111360000",
                "0003111111300000",
                "0003113331300000",
                "0000313331000000",
                "0000313331000000",
                "0000001100000000",
                "0000001100000000",
                "0000000000000000"
            ],
            'nature': [
                "3333330000666666",
                "3333000000666660",
                "3333000000666600",
                "3300000000666000",
                "3000000000660000",
                "0000000006600000",
                "0044444440000000",
                "0044111444000000",
                "0044111444000000",
                "0004111400000000",
                "0000414000000000",
                "0000770000000000",
                "0000700000000000",
                "0007000000000000",
                "0070000000000000",
                "0000000000000000"
            ],
            'object': [
                "0000000000000000",
                "0000000000000000",
                "0000444400000000",
                "0004422440000000",
                "0044222244000000",
                "0042211224000000",
                "0042211224000000",
                "0042211224000000",
                "0042211224000000",
                "0042222224000000",
                "0042222224000000",
                "0004222240000000",
                "0004422440000000",
                "0000444400000000",
                "0000000000000000",
                "0000000000000000"
            ]
        }
        return examples.get(object_type, examples['human'])

    @staticmethod
    def generate_with_ai(prompt: str) -> dict:
        """
        Usa IA multi-proveedor (Groq por defecto) para generar una cuadrícula de 16x16.
        Detecta automáticamente el tipo de objeto y adapta la estructura.
        Luego se escala a 32x32 para mayor fidelidad.
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

        # Detectar tipo de objeto y obtener estructura/ejemplo correspondientes
        object_type = PixelArtService._detect_object_type(prompt)
        structure_prompt = PixelArtService._get_structure_prompt(object_type)
        example_lines = PixelArtService._get_example_for_type(object_type)

        type_names = {
            'human': 'person/human',
            'character': 'game character',
            'nature': 'nature/scene',
            'object': 'object'
        }

        improved_prompt = f"""TASK: Create a 16x16 Pixel Art grid for: "{prompt}"

PALETTE (use ONLY these digits 0-7):
0=Black/Background  1=Skin/Light  2=Blue/Cool  3=White/Bright  4=Brown/Dark  5=Gray/Metal  6=Orange/Accent  7=Shadow

{structure_prompt}

OUTPUT RULES:
1. Output EXACTLY 16 lines
2. Each line has EXACTLY 16 characters (only digits 0-7)
3. NO text, NO JSON, NO explanations before or after
4. Make the {type_names[object_type]} recognizable and well-centered

EXAMPLE ({type_names[object_type]}):
{chr(10).join(example_lines)}

Now create pixel art for: "{prompt}"
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
