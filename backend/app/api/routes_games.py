# -*- coding: utf-8 -*-
"""Rutas de API para el sistema de juegos arcade gamificados"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.models.database import get_db
from app.services.gamification_service import GamificationService
from app.api.routes_auth import get_current_user
from app.services.game_ai_service import get_ollama_move, check_ollama_health
from app.services.game_training_service import GameTrainingService
from app.services.game_parameters_service import GameParametersService
from app.services.game_algorithms_service import GameAlgorithmService

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
    - Si game_data incluye training_data, se guarda para análisis offline de IA
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

        # NUEVO: Guardar datos de entrenamiento si se proporcionan
        if request.game_data and 'training_data' in request.game_data:
            try:
                GameTrainingService.record_training_data(
                    db=db,
                    session_id=session.id,
                    training_data=request.game_data['training_data']
                )
            except Exception as e:
                # No fallar el submit si falla guardar training_data
                print(f"[Games] Warning: No se guardó training_data: {e}")

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


# ============== NUEVOS ENDPOINTS PARA SISTEMA OFFLINE ==============


@router.get("/ai/parameters/{game_id}/{difficulty}")
async def get_ai_parameters(
    game_id: str,
    difficulty: str,
    db: Session = Depends(get_db)
):
    """
    Retorna los parámetros activos para un juego y dificultad.

    No requiere autenticación.
    """
    try:
        params = GameParametersService.get_active_parameters(db, game_id, difficulty)
        return {
            "game_id": game_id,
            "difficulty": difficulty,
            "parameters": params
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo parámetros: {str(e)}")


@router.get("/ai/parameters/history/{game_id}")
async def get_parameters_history(
    game_id: str,
    difficulty: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Retorna el historial de versiones de parámetros para un juego.

    Útil para análisis y rollback.

    No requiere autenticación.
    """
    try:
        history = GameParametersService.get_parameter_version_history(
            db=db,
            game_id=game_id,
            difficulty=difficulty,
            limit=min(limit, 100)
        )

        return {
            "game_id": game_id,
            "difficulty": difficulty,
            "history": [
                {
                    "version": h.version,
                    "parameters": h.parameters_snapshot,
                    "change_reason": h.change_reason,
                    "created_at": h.created_at.isoformat()
                }
                for h in history
            ],
            "total": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial: {str(e)}")


@router.post("/ai/train")
async def train_ai_parameters(
    game_id: str,
    difficulty: str = 'medium',
    batch_size: int = 50,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Ejecuta entrenamiento offline de parámetros de IA.

    Analiza partidas completadas con Ollama (sin restricciones de tiempo)
    y genera mejores parámetros para los algoritmos locales.

    Requiere autenticación. Solo admin debería usar este endpoint.

    Este proceso puede tomar 2-5 minutos.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Autenticación requerida")

    # TODO: Verificar que el usuario sea admin
    # if not current_user.get('is_admin', False):
    #     raise HTTPException(status_code=403, detail="Solo admin puede entrenar IA")

    try:
        result = GameTrainingService.train_parameters_batch(
            db=db,
            game_id=game_id,
            difficulty=difficulty,
            batch_size=min(batch_size, 100)
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en entrenamiento: {str(e)}")


@router.get("/ai/training/stats")
async def get_training_stats(
    game_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas de datos de entrenamiento recolectados.

    Útil para monitorear cuántos datos hay disponibles para entrenamiento.

    No requiere autenticación.
    """
    try:
        stats = GameTrainingService.get_training_stats(db=db, game_id=game_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")


@router.post("/ai/parameters/initialize")
async def initialize_parameters(
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Inicializa parámetros por defecto para todos los juegos.

    Debe ejecutarse al iniciar el sistema o cuando se agregan nuevos juegos.

    Requiere autenticación.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Autenticación requerida")

    try:
        result = GameParametersService.initialize_default_parameters(db)
        return {
            "status": "success",
            "message": f"Parámetros inicializados: {result['total']} totales ({result['created']} nuevos, {result['updated']} actualizados)",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inicializando parámetros: {str(e)}")


# ============== ENDPOINTS DEPRECATED (Mantener por compatibilidad) ==============


@router.post("/ai/move")
async def get_ai_move(request: GameAIRequest):
    """
    ⚠️ DEPRECATED: Este endpoint será removido en futuras versiones.

    Usa GameAlgorithmService directamente en el frontend para latencia cero.
    Este endpoint hace llamadas en tiempo real a Ollama causando timeouts 502.

    RECOMENDACIÓN:
    - Frontend debe usar GameAlgorithmService.get_<game>_move() localmente
    - Solo usar este endpoint para backward compatibility temporal
    """
    try:
        move = get_ollama_move(request.game_type, request.game_state)
        if move is None:
            return {
                "move": None,
                "using_fallback": True,
                "message": "⚠️ DEPRECATED: IA no disponible, usando algoritmo local",
                "deprecated_warning": "Este endpoint será removido. Usa algoritmos locales en el frontend."
            }
        return {
            "move": move,
            "using_fallback": False,
            "message": "⚠️ DEPRECATED: Movimiento calculado con IA",
            "deprecated_warning": "Este endpoint será removido. Usa algoritmos locales en el frontend."
        }
    except Exception as e:
        return {
            "move": None,
            "using_fallback": True,
            "message": f"⚠️ DEPRECATED: Error en IA: {str(e)}",
            "deprecated_warning": "Este endpoint será removido. Usa algoritmos locales en el frontend."
        }
