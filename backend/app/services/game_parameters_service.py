# -*- coding: utf-8 -*-
"""Servicio de gestión de parámetros configurables para IA de juegos

Este servicio maneja el ciclo de vida de los parámetros de IA:
- Inicialización de parámetros por defecto
- Obtención de parámetros activos
- Actualización con versionado
- Rollback a versiones anteriores
- Historial completo de cambios
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.models.database import GameAIParameters, AIParameterHistory
from app.services.game_algorithms_service import GameAlgorithmService


class GameParametersService:
    """Servicio para gestionar parámetros configurables de IA con versionado"""

    @staticmethod
    def get_active_parameters(db: Session, game_id: str, difficulty: str = 'medium') -> dict:
        """
        Obtiene los parámetros activos para un juego y dificultad.

        Args:
            db: Sesión de base de datos
            game_id: ID del juego (pong, tictactoe, etc.)
            difficulty: Dificultad (easy, medium, hard, expert)

        Returns:
            dict con los parámetros. Si no hay parámetros en BD, retorna defaults.
        """
        # Buscar parámetros activos en BD
        param = db.query(GameAIParameters).filter_by(
            game_id=game_id,
            difficulty=difficulty,
            is_active=True
        ).first()

        if param:
            # Retornar parámetros desde BD
            return param.parameters
        else:
            # Retornar parámetros por defecto
            return GameAlgorithmService.get_default_parameters(game_id, difficulty)

    @staticmethod
    def update_parameters(
        db: Session,
        game_id: str,
        difficulty: str,
        new_parameters: dict,
        change_reason: str = "ai_trained",
        performance_metrics: Optional[dict] = None
    ) -> GameAIParameters:
        """
        Actualiza parámetros y guarda historial para rollback.

        Args:
            db: Sesión de base de datos
            game_id: ID del juego
            difficulty: Dificultad
            new_parameters: Nuevos parámetros (dict)
            change_reason: Razón del cambio ("ai_trained", "manual_adjustment", "rollback")
            performance_metrics: Métricas antes del cambio (opcional)

        Returns:
            GameAIParameters actualizado con nueva versión
        """
        # Buscar parámetros actuales
        current = db.query(GameAIParameters).filter_by(
            game_id=game_id,
            difficulty=difficulty,
            is_active=True
        ).first()

        if current:
            # Guardar snapshot de versión anterior en historial
            history = AIParameterHistory(
                game_id=game_id,
                difficulty=difficulty,
                parameters_snapshot=current.parameters,
                version=current.version,
                change_reason=change_reason,
                previous_version=current.version - 1 if current.version > 1 else None,
                performance_metrics=performance_metrics or {}
            )
            db.add(history)

            # Actualizar a nueva versión
            current.version += 1
            current.parameters = new_parameters
            current.trained_at = datetime.utcnow()

        else:
            # Crear nuevos parámetros (primera versión)
            current = GameAIParameters(
                game_id=game_id,
                difficulty=difficulty,
                parameters=new_parameters,
                version=1,
                is_active=True,
                created_at=datetime.utcnow(),
                trained_at=datetime.utcnow()
            )
            db.add(current)

        db.commit()
        db.refresh(current)

        return current

    @staticmethod
    def rollback_parameters(
        db: Session,
        game_id: str,
        difficulty: str,
        target_version: int
    ) -> GameAIParameters:
        """
        Revierte a una versión anterior de parámetros.

        Args:
            db: Sesión de base de datos
            game_id: ID del juego
            difficulty: Dificultad
            target_version: Versión a restaurar

        Returns:
            GameAIParameters con los parámetros restaurados
        """
        # Buscar la versión en historial
        history_entry = db.query(AIParameterHistory).filter_by(
            game_id=game_id,
            difficulty=difficulty,
            version=target_version
        ).first()

        if not history_entry:
            raise ValueError(f"Versión {target_version} no encontrada en historial")

        # Obtener parámetros actuales
        current = db.query(GameAIParameters).filter_by(
            game_id=game_id,
            difficulty=difficulty,
            is_active=True
        ).first()

        if current:
            # Guardar snapshot del estado actual antes de rollback
            rollback_history = AIParameterHistory(
                game_id=game_id,
                difficulty=difficulty,
                parameters_snapshot=current.parameters,
                version=current.version,
                change_reason="rollback_pre_snapshot",
                previous_version=current.version - 1,
                performance_metrics={}
            )
            db.add(rollback_history)

            # Restaurar parámetros de la versión objetivo
            current.parameters = history_entry.parameters_snapshot
            current.version = target_version
            current.trained_at = datetime.utcnow()

            # Crear entrada de historial para el rollback
            rollback_entry = AIParameterHistory(
                game_id=game_id,
                difficulty=difficulty,
                parameters_snapshot=history_entry.parameters_snapshot,
                version=target_version,
                change_reason="rollback",
                previous_version=current.version + 1,
                performance_metrics={}
            )
            db.add(rollback_entry)

        else:
            # No hay parámetros actuales, crear desde historial
            current = GameAIParameters(
                game_id=game_id,
                difficulty=difficulty,
                parameters=history_entry.parameters_snapshot,
                version=target_version,
                is_active=True,
                created_at=datetime.utcnow(),
                trained_at=datetime.utcnow()
            )
            db.add(current)

        db.commit()
        db.refresh(current)

        return current

    @staticmethod
    def get_parameter_version_history(
        db: Session,
        game_id: str,
        difficulty: str,
        limit: int = 20
    ) -> list[AIParameterHistory]:
        """
        Obtiene el historial de versiones de parámetros.

        Args:
            db: Sesión de base de datos
            game_id: ID del juego
            difficulty: Dificultad
            limit: Máximo número de versiones a retornar

        Returns:
            Lista de AIParameterHistory ordenadas por fecha descendente
        """
        history = db.query(AIParameterHistory).filter_by(
            game_id=game_id,
            difficulty=difficulty
        ).order_by(
            AIParameterHistory.created_at.desc()
        ).limit(limit).all()

        return history

    @staticmethod
    def initialize_default_parameters(db: Session) -> dict:
        """
        Inicializa parámetros por defecto para todos los juegos.

        Debe llamarse al iniciar la aplicación o cuando se agregan nuevos juegos.

        Args:
            db: Sesión de base de datos

        Returns:
            dict con resumen de parámetros creados
        """
        created_count = 0
        updated_count = 0

        # Definir juegos y dificultades a inicializar
        games_to_init = {
            'pong': ['easy', 'medium', 'hard', 'expert'],
            'tictactoe': ['easy', 'medium', 'hard', 'expert'],
        }

        for game_id, difficulties in games_to_init.items():
            for difficulty in difficulties:
                # Verificar si ya existen
                existing = db.query(GameAIParameters).filter_by(
                    game_id=game_id,
                    difficulty=difficulty
                ).first()

                default_params = GameAlgorithmService.get_default_parameters(game_id, difficulty)

                if existing:
                    # Solo actualizar si no está activo
                    if not existing.is_active:
                        existing.is_active = True
                        existing.parameters = default_params
                        updated_count += 1
                else:
                    # Crear nuevos parámetros
                    new_param = GameAIParameters(
                        game_id=game_id,
                        difficulty=difficulty,
                        parameters=default_params,
                        version=1,
                        is_active=True,
                        created_at=datetime.utcnow()
                    )
                    db.add(new_param)
                    created_count += 1

        db.commit()

        return {
            'created': created_count,
            'updated': updated_count,
            'total': created_count + updated_count
        }

    @staticmethod
    def get_all_active_parameters(db: Session) -> list[GameAIParameters]:
        """
        Obtiene todos los parámetros activos de todos los juegos.

        Útil para dashboard de administración.

        Args:
            db: Sesión de base de datos

        Returns:
            Lista de GameAIParameters activos
        """
        params = db.query(GameAIParameters).filter_by(
            is_active=True
        ).order_by(
            GameAIParameters.game_id,
            GameAIParameters.difficulty
        ).all()

        return params
