# -*- coding: utf-8 -*-
"""Rutas de Gamificación - Leaderboard, Stats, Badges"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db, User
from app.api.routes_auth import get_current_user
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/leaderboard")
def get_leaderboard(limit: int = 100, db: Session = Depends(get_db)):
    """Obtiene el ranking de usuarios por puntos"""
    leaderboard = GamificationService.get_leaderboard(db, limit)
    return {"leaderboard": leaderboard}


@router.get("/stats/me")
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene las estadísticas del usuario actual"""
    stats = GamificationService.get_user_stats(db, current_user.id)
    return stats


@router.get("/stats/{user_id}")
def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """Obtiene las estadísticas públicas de un usuario"""
    stats = GamificationService.get_user_stats(db, user_id)
    return stats


@router.get("/badges")
def get_all_badges():
    """Obtiene la lista de todos los badges disponibles"""
    from app.models.database import BADGES
    
    badges_list = []
    for key, value in BADGES.items():
        badges_list.append({
            "key": key,
            "name": value["name"],
            "description": value["description"],
            "icon": value["icon"]
        })
    
    return {"badges": badges_list}
