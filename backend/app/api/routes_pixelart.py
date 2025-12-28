# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.models.database import get_db, PixelArt
from app.services.pixelart_service import PixelArtService
from app.api.routes_auth import get_current_user

router = APIRouter(prefix="/pixelart", tags=["pixelart"])

class PixelArtCreate(BaseModel):
    title: str
    description: Optional[str] = None
    pixels: dict
    width: int = 32
    height: int = 32
    is_ai: bool = False
    prompt: Optional[str] = None

class PixelArtUpdate(BaseModel):
    title: Optional[str] = None
    pixels: Optional[dict] = None

@router.post("/")
async def create_pixel_art(
    data: PixelArtCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return PixelArtService.create_piece(
        db, current_user.id, data.title, data.pixels, 
        data.width, data.height, data.description, data.prompt, data.is_ai
    )

@router.get("/")
async def get_pixel_art_gallery(limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    pieces = PixelArtService.get_gallery(db, limit, offset)
    return [{
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "author": p.user.username,
        "author_id": p.user_id,
        "pixels": p.pixels_json,
        "likes": p.total_likes,
        "comments": p.total_comments,
        "created_at": p.created_at
    } for p in pieces]

@router.post("/generate")
async def generate_ai_art(prompt: str = Body(..., embed=True)):
    return PixelArtService.generate_with_ai(prompt)

@router.post("/{piece_id}/like")
async def like_pixel_art(
    piece_id: str, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return PixelArtService.toggle_like(db, current_user.id, piece_id)

@router.post("/{piece_id}/comment")
async def comment_pixel_art(
    piece_id: str,
    content: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return PixelArtService.add_comment(db, current_user.id, piece_id, content)

@router.put("/{piece_id}")
async def update_pixel_art(
    piece_id: str,
    data: PixelArtUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza una pieza de pixel art (solo el propietario puede)"""
    return PixelArtService.update_piece(db, piece_id, current_user.id, data.title, data.pixels)

@router.delete("/{piece_id}")
async def delete_pixel_art(
    piece_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina una pieza de pixel art (solo el propietario puede)"""
    return PixelArtService.delete_piece(db, piece_id, current_user.id)
