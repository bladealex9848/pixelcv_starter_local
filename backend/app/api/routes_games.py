# -*- coding: utf-8 -*-
"""Rutas de API para el sistema de juegos arcade gamificados"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.models.database import get_db
from app.services.gamification_service import GamificationService
from app.services.auth_service import get_current_user
from app.services.game_ai_service import get_ollama_move, check_ollama_health

router = APIRouter(prefix="/games", tags=["games"])


class GameSubmitRequest(BaseModel):
    """Request para enviar resultado de un juego"""
    game_id: str
    score: int
    won: bool = False
    moves: int = 0
    time_seconds: int = 0
    game_data: Optional[dict] = None


class GameSubmitResponse(BaseModel):
    """Response después de enviar resultado de un juego"""
    success: bool
    points_earned: int
    session_id: int
    message: str
    achievements: List[str]


class GameAIRequest(BaseModel):
    """Request para obtener movimiento de IA"""
    game_type: str  # 'pong', 'tictactoe', 'spaceinvaders'
    game_state: dict


@router.post("/submit", response_model=GameSubmitResponse)
async def submit_game_result(
    request: GameSubmitRequest,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Registra el resultado de un juego y calcula puntos.

    - Para usuarios registrados: acumula puntos y actualiza estadísticas
    - Para usuarios no registrados (demo mode): registra sesión sin puntos
    """
    # Verificar que el game_id es válido
    games_list = GamificationService.get_games_list()
    valid_game_ids = [g['id'] for g in games_list]

    if request.game_id not in valid_game_ids:
        raise HTTPException(status_code=400, detail=f"Juego inválido: {request.game_id}")

    # user_id es None para demo mode, el ID del usuario si está autenticado
    user_id = current_user['user_id'] if current_user else None

    try:
        session = GamificationService.record_game_session(
            db=db,
            user_id=user_id,
            game_id=request.game_id,
            score=request.score,
            won=request.won,
            moves=request.moves,
            time_seconds=request.time_seconds,
            game_data=request.game_data
        )

        if user_id:
            return GameSubmitResponse(
                success=True,
                points_earned=session.points_earned,
                session_id=session.id,
                message=f"¡Juego registrado! Ganaste {session.points_earned} puntos",
                achievements=[]
            )
        else:
            return GameSubmitResponse(
                success=True,
                points_earned=0,
                session_id=session.id,
                message="Demo mode: Juego registrado sin puntos. ¡Regístrate para competir!",
                achievements=[]
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar juego: {str(e)}")


@router.get("/list")
async def get_games_list():
    """
    Retorna la lista de juegos disponibles con sus configuraciones.

    No requiere autenticación.
    """
    games = GamificationService.get_games_list()
    return {
        "games": games,
        "total": len(games)
    }


@router.get("/leaderboard/{game_id}")
async def get_game_leaderboard(
    game_id: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Obtiene el ranking de un juego específico.

    - Incluye solo usuarios registrados
    - Ordenado por score descendente
    """
    # Verificar que el game_id es válido
    games_list = GamificationService.get_games_list()
    valid_game_ids = [g['id'] for g in games_list]

    if game_id not in valid_game_ids:
        raise HTTPException(status_code=400, detail=f"Juego inválido: {game_id}")

    leaderboard = GamificationService.get_game_leaderboard(
        db=db,
        game_id=game_id,
        limit=min(limit, 100)
    )

    # Buscar info del juego
    game_info = next((g for g in games_list if g['id'] == game_id), None)

    return {
        "game_id": game_id,
        "game_name": game_info['name'] if game_info else game_id,
        "game_icon": game_info['icon'] if game_info else '?',
        "leaderboard": leaderboard,
        "total": len(leaderboard)
    }


@router.get("/my-scores")
async def get_my_game_scores(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene las mejores puntuaciones del usuario en cada juego.

    Requiere autenticación.
    """
    from app.models.database import GameSession, User

    user_id = current_user['user_id']

    # Obtener juegos disponibles
    games_list = GamificationService.get_games_list()

    # Para cada juego, obtener la mejor puntuación del usuario
    my_scores = []
    for game in games_list:
        best_session = db.query(GameSession).filter(
            GameSession.user_id == user_id,
            GameSession.game_id == game['id']
        ).order_by(GameSession.score.desc()).first()

        if best_session:
            my_scores.append({
                'game_id': game['id'],
                'game_name': game['name'],
                'game_icon': game['icon'],
                'best_score': best_session.score,
                'won': best_session.won,
                'moves': best_session.moves,
                'time_seconds': best_session.time_seconds,
                'points_earned': best_session.points_earned,
                'played_at': best_session.created_at.isoformat()
            })

    return {
        "scores": my_scores,
        "total": len(my_scores)
    }


@router.post("/ai/move")
async def get_ai_move(request: GameAIRequest):
    """
    Obtiene un movimiento de IA para un juego usando Ollama.

    Los movimientos se calculan localmente con fallback a Ollama para mejora.
    Timeout de 2 segundos para mantener el juego fluido.
    """
    try:
        move = get_ollama_move(request.game_type, request.game_state)
        if move is None:
            return {
                "move": None,
                "using_fallback": True,
                "message": "IA no disponible, usando algoritmo local"
            }
        return {
            "move": move,
            "using_fallback": False,
            "message": "Movimiento calculado con IA"
        }
    except Exception as e:
        return {
            "move": None,
            "using_fallback": True,
            "message": f"Error en IA: {str(e)}"
        }


@router.get("/ai/status")
async def get_ai_status():
    """
    Verifica el estado del servicio de IA (Ollama).

    No requiere autenticación.
    """
    is_healthy = check_ollama_health()
    return {
        "available": is_healthy,
        "message": "Ollama disponible" if is_healthy else "Ollama no disponible - usando IA local",
    }
