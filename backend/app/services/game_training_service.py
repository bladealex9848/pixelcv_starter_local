# -*- coding: utf-8 -*-
"""Servicio de entrenamiento offline de IA para juegos

Analiza partidas completadas con Ollama (sin restricciones de tiempo) para:
- Identificar patrones de juego de los jugadores
- Detectar debilidades en la IA
- Generar mejores parámetros para los algoritmos locales
"""
import json
import random
import re
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session
import requests

from app.models.database import GameTrainingData, GameSession, User
from app.services.game_parameters_service import GameParametersService
from app.services.ollama_service import generate_text


OLLAMA_BASE = "http://localhost:11434/api"
OLLAMA_TIMEOUT = 120  # 2 minutos para análisis offline (sin restricción de 5s)


class GameTrainingService:
    """Servicio de entrenamiento offline de IA usando Ollama"""

    @staticmethod
    def record_training_data(
        db: Session,
        session_id: int,
        training_data: dict
    ) -> GameTrainingData:
        """
        Guarda datos de entrenamiento de una partida completada.

        Args:
            db: Sesión de base de datos
            session_id: ID de la sesión de juego
            training_data: Datos recolectados durante el juego
                {
                    game_id: str,
                    moves_sequence: list,
                    final_board_state: dict,
                    player_won: bool,
                    critical_moments: list (opcional)
                }

        Returns:
            GameTrainingData creado
        """
        # Obtener la sesión para extraer datos adicionales
        session = db.query(GameSession).filter_by(id=session_id).first()
        if not session:
            raise ValueError(f"Sesión {session_id} no encontrada")

        # Obtener datos del jugador si está autenticado
        player_level = None
        player_experience = None
        if session.user_id:
            user = db.query(User).filter_by(id=session.user_id).first()
            if user:
                # Buscar perfil del usuario
                from app.models.database import UserProfile
                profile = db.query(UserProfile).filter_by(user_id=session.user_id).first()
                if profile:
                    player_level = profile.level
                    player_experience = profile.experience

        # Crear registro de training data
        record = GameTrainingData(
            session_id=session_id,
            game_id=training_data.get('game_id', session.game_id),
            moves_sequence=training_data.get('moves_sequence', []),
            final_board_state=training_data.get('final_board_state'),
            player_won=training_data.get('player_won', session.won),
            player_score=session.score,
            total_moves=len(training_data.get('moves_sequence', [])),
            critical_moments=training_data.get('critical_moments', []),
            player_level=player_level,
            player_experience=player_experience
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return record

    @staticmethod
    def analyze_game_with_ai(
        db: Session,
        training_record_id: int,
        model: Optional[str] = None
    ) -> dict:
        """
        Analiza una partida completada con IA para extraer insights.

        Args:
            db: Sesión de base de datos
            training_record_id: ID del registro de training data
            model: Modelo de Ollama a usar (opcional)

        Returns:
            dict con insights de la partida
        """
        training_data = db.query(GameTrainingData).filter_by(
            id=training_record_id
        ).first()

        if not training_data:
            raise ValueError(f"Training data {training_record_id} no encontrado")

        # Construir prompt según el juego
        prompt = GameTrainingService._build_analysis_prompt(training_data)

        try:
            # Llamar a Ollama sin restricciones de tiempo
            insights_text = generate_text(
                prompt,
                model=model,
                max_tokens=500
            )

            # Parsear respuesta
            insights = GameTrainingService._parse_insights(insights_text)

            return insights

        except Exception as e:
            print(f"[GameTraining] Error analizando juego {training_record_id}: {e}")
            # Retornar insights vacíos en caso de error
            return {
                'player_patterns': [],
                'ai_weaknesses': [],
                'suggested_adjustments': {},
                'reasoning': f'Error: {str(e)}'
            }

    @staticmethod
    def _build_analysis_prompt(training_data: GameTrainingData) -> str:
        """Construye prompt específico para análisis según el juego"""
        game_id = training_data.game_id

        if game_id == 'pong':
            return f"""Analiza esta partida de Pong y extrae insights para mejorar la IA:

RESULTADO:
- Jugador ganó: {training_data.player_won}
- Score jugador: {training_data.player_score}

MOVIMIENTOS: {len(training_data.moves_sequence)} eventos registrados

MOMENTOS CRÍTICOS:
{json.dumps(training_data.critical_moments[:10], indent=2) if training_data.critical_moments else "[]"}

TU TAREA:
1. Identifica patrones de juego del jugador (ej: "ataca siempre a la esquina superior")
2. Detecta debilidades en la IA actual (ej: "llegó tarde a rebotes rápidos")
3. Sugiere ajustes ESPECÍFICOS de parámetros:
   - base_error (0-100, menor = más preciso)
   - reaction_delay_chance (0.0-1.0, menor = más rápido)
   - max_bounces (1-5, cuántos rebotes predecir)
   - aggressive_offset (0-50, offset para estrategia agresiva)

IMPORTANTE: Responde SOLO con JSON válido (sin markdown, sin texto extra):
{{
  "player_patterns": ["patrón1", "patrón2"],
  "ai_weaknesses": ["debilidad1"],
  "suggested_adjustments": {{
    "base_error": 15.0,
    "reaction_delay_chance": 0.1,
    "max_bounces": 2,
    "aggressive_offset": 10
  }},
  "reasoning": "explicación breve de por qué estos ajustes"
}}"""

        elif game_id == 'tictactoe':
            # Obtener estado final del tablero
            final_board = training_data.final_board_state or {}
            board_str = final_board.get('board', '---------')

            return f"""Analiza esta partida de Tic Tac Toe y extrae insights para mejorar la IA:

RESULTADO:
- Jugador ganó: {training_data.player_won}
- Movimientos totales: {training_data.total_moves}
- Tablero final: {board_str}

TU TAREA:
1. Identifica patrones de juego del jugador
2. Detecta debilidades en la IA (ej: "no bloqueó esquina crítica")
3. Sugiere ajustes ESPECÍFICOS de parámetros:
   - error_chance (0.0-1.0, probabilidad de error)
   - max_depth (1-9, profundidad de minimax)
   - position_weights (array de 9 números, pesos de cada posición)

IMPORTANTE: Responde SOLO con JSON válido:
{{
  "player_patterns": ["patrón1"],
  "ai_weaknesses": ["debilidad1"],
  "suggested_adjustments": {{
    "error_chance": 0.15,
    "max_depth": 4,
    "position_weights": [3, 2, 3, 2, 4, 2, 3, 2, 3]
  }},
  "reasoning": "explicación"
}}"""

        else:
            # Prompt genérico para otros juegos
            return f"""Analiza esta partida de {game_id}:

Resultado: {'Jugador ganó' if training_data.player_won else 'IA ganó'}
Score: {training_data.player_score}
Movimientos: {training_data.total_moves}

Sugiere ajustes para mejorar la IA en formato JSON con:
- player_patterns: array de strings
- ai_weaknesses: array de strings
- suggested_adjustments: objeto con parámetros
- reasoning: explicación

Responde SOLO con JSON válido."""

    @staticmethod
    def _parse_insights(insights_text: str) -> dict:
        """
        Parsea la respuesta de Ollama para extraer JSON.

        Maneja respuestas que pueden incluir markdown o texto extra.
        """
        # Limpiar texto - eliminar markdown si existe
        text = insights_text.strip()

        # Buscar JSON entre ```json ... ``` o solo {...}
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        else:
            # Buscar primer objeto JSON completo
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                text = json_match.group(0)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Si falla, intentar extraer valores con regex
            return {
                'player_patterns': [],
                'ai_weaknesses': [],
                'suggested_adjustments': {},
                'reasoning': 'Error parseando JSON'
            }

    @staticmethod
    def train_parameters_batch(
        db: Session,
        game_id: str,
        difficulty: str = 'medium',
        batch_size: int = 50,
        model: Optional[str] = None
    ) -> dict:
        """
        Analiza un batch de partidas y genera mejores parámetros.

        Este proceso puede tomar 2-5 minutos porque analiza cada partida
        con IA sin restricciones de tiempo.

        Args:
            db: Sesión de base de datos
            game_id: ID del juego a entrenar
            difficulty: Dificultad de los parámetros a entrenar
            batch_size: Cantidad de partidas a analizar
            model: Modelo de Ollama a usar (opcional)

        Returns:
            dict con resultado del entrenamiento
        """
        # 1. Obtener partidas recientes para entrenar
        week_ago = datetime.utcnow() - timedelta(days=7)
        games = db.query(GameTrainingData).filter(
            GameTrainingData.game_id == game_id,
            GameTrainingData.created_at > week_ago
        ).order_by(
            GameTrainingData.created_at.desc()
        ).limit(batch_size).all()

        if len(games) < 10:
            return {
                "status": "insufficient_data",
                "count": len(games),
                "message": f"Se necesitan al menos 10 partidas, hay {len(games)}"
            }

        # 2. Analizar cada partida con IA (puede tomar varios minutos)
        insights_list = []
        for i, game in enumerate(games):
            try:
                print(f"[GameTraining] Analizando partida {i+1}/{len(games)}...")
                insights = GameTrainingService.analyze_game_with_ai(
                    db=db,
                    training_record_id=game.id,
                    model=model
                )
                insights_list.append(insights)
            except Exception as e:
                print(f"[GameTraining] Error analizando juego {game.id}: {e}")
                continue

        if len(insights_list) < 5:
            return {
                "status": "analysis_failed",
                "count": len(insights_list),
                "message": f"Solo {len(insights_list)} partidas se analizaron correctamente"
            }

        # 3. Agregar insights y calcular nuevos parámetros
        new_params = GameTrainingService._aggregate_insights_to_parameters(
            game_id=game_id,
            difficulty=difficulty,
            insights_list=insights_list
        )

        # 4. Actualizar parámetros en BD
        try:
            from app.services.game_parameters_service import GameParametersService
            updated_params = GameParametersService.update_parameters(
                db=db,
                game_id=game_id,
                difficulty=difficulty,
                new_parameters=new_params,
                change_reason="ai_trained",
                performance_metrics={
                    "games_analyzed": len(insights_list),
                    "training_date": datetime.utcnow().isoformat()
                }
            )

            return {
                "status": "success",
                "games_analyzed": len(insights_list),
                "new_parameters": new_params,
                "version": updated_params.version,
                "message": f"Entrenamiento completado con {len(insights_list)} partidas analizadas"
            }

        except Exception as e:
            return {
                "status": "update_failed",
                "error": str(e),
                "message": "Error actualizando parámetros en BD"
            }

    @staticmethod
    def _aggregate_insights_to_parameters(
        game_id: str,
        difficulty: str,
        insights_list: list[dict]
    ) -> dict:
        """
        Agrega múltiples insights de IA para calcular nuevos parámetros.

        Usa promedio ponderado y suavizado exponencial para evitar cambios drásticos.
        """
        # Obtener parámetros actuales como base
        current_params = GameParametersService.get_active_parameters(
            db=None,  # No necesitamos BD para defaults
            game_id=game_id,
            difficulty=difficulty
        )

        # Extraer todos los suggested_adjustments válidos
        all_adjustments = []
        for insights in insights_list:
            if 'suggested_adjustments' in insights and isinstance(insights['suggested_adjustments'], dict):
                all_adjustments.append(insights['suggested_adjustments'])

        if not all_adjustments:
            # No hay ajustes válidos, retornar actuales
            return current_params

        # Calcular promedios de cada parámetro
        new_params = {}
        param_keys = set()

        # Obtener todas las llaves de parámetros
        for adj in all_adjustments:
            param_keys.update(adj.keys())

        # Calcular promedio para cada parámetro
        for key in param_keys:
            values = []
            for adj in all_adjustments:
                if key in adj and isinstance(adj[key], (int, float)):
                    values.append(adj[key])

            if values:
                # Promedio simple
                avg_value = sum(values) / len(values)

                # Si el parámetro existe en los actuales, aplicar suavizado
                if key in current_params and isinstance(current_params[key], (int, float)):
                    # Suavizado exponencial (alpha = 0.3)
                    # Esto evita cambios drásticos
                    alpha = 0.3
                    new_value = alpha * avg_value + (1 - alpha) * current_params[key]
                    new_params[key] = new_value
                else:
                    # Parámetro nuevo, usar el promedio directamente
                    new_params[key] = avg_value

        # Asegurar que los parámetros críticos siempre estén presentes
        if game_id == 'pong':
            if 'base_error' not in new_params:
                new_params['base_error'] = current_params.get('base_error', 20.0)
            if 'reaction_delay_chance' not in new_params:
                new_params['reaction_delay_chance'] = current_params.get('reaction_delay_chance', 0.05)
            if 'max_bounces' not in new_params:
                new_params['max_bounces'] = current_params.get('max_bounces', 2)
            if 'paddle_speed' not in new_params:
                new_params['paddle_speed'] = current_params.get('paddle_speed', 6.0)
            if 'strategy' not in new_params:
                new_params['strategy'] = current_params.get('strategy', 'balanced')

        elif game_id == 'tictactoe':
            if 'error_chance' not in new_params:
                new_params['error_chance'] = current_params.get('error_chance', 0.15)
            if 'max_depth' not in new_params:
                new_params['max_depth'] = current_params.get('max_depth', 4)
            if 'position_weights' not in new_params:
                new_params['position_weights'] = current_params.get(
                    'position_weights',
                    [3, 2, 3, 2, 4, 2, 3, 2, 3]
                )

        return new_params

    @staticmethod
    def get_training_stats(db: Session, game_id: Optional[str] = None) -> dict:
        """
        Obtiene estadísticas de datos de entrenamiento recolectados.

        Args:
            db: Sesión de base de datos
            game_id: ID del juego (opcional, si es None retorna stats de todos)

        Returns:
            dict con estadísticas
        """
        query = db.query(GameTrainingData)

        if game_id:
            query = query.filter_by(game_id=game_id)

        total_games = query.count()

        # Estadísticas por resultado
        player_wins = query.filter_by(player_won=True).count()
        ai_wins = total_games - player_wins

        # Últimos 7 días
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_games = query.filter(GameTrainingData.created_at > week_ago).count()

        # Estadísticas por juego (si no se especifica uno)
        by_game = {}
        if not game_id:
            from sqlalchemy import func
            game_stats = db.query(
                GameTrainingData.game_id,
                func.count(GameTrainingData.id).label('count')
            ).group_by(GameTrainingData.game_id).all()

            by_game = {g.game_id: g.count for g in game_stats}

        return {
            'total_games': total_games,
            'player_wins': player_wins,
            'ai_wins': ai_wins,
            'win_rate': player_wins / total_games if total_games > 0 else 0,
            'recent_games_7d': recent_games,
            'by_game': by_game
        }
