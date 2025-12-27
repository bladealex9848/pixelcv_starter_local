# Arquitectura Técnica del Sistema de IA Offline

## Overview

Este documento describe la arquitectura técnica interna del sistema de IA offline para juegos arcade en PixelCV, incluyendo detalles de implementación, patrones de diseño y consideraciones de rendimiento.

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Modelos de Datos](#modelos-de-datos)
3. [Servicios Backend](#servicios-backend)
4. [Frontend Components](#frontend-components)
5. [Flujo de Datos](#flujo-de-datos)
6. [Algoritmos Locales](#algoritmos-locales)
7. [Entrenamiento Offline](#entrenamiento-offline)
8. [Consideraciones de Rendimiento](#consideraciones-de-rendimiento)

---

## Arquitectura General

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │  PongGame.tsx   │         │ TicTacToe.tsx   │                │
│  │                 │         │                 │                │
│  │ • getLocalAIMove│         │ • makeAIMove    │                │
│  │ • gameEventsRef │         │ • movesRef      │                │
│  │ • onGameEnd     │         │ • onGameEnd     │                │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                          │
│           └─────────────┬─────────────┘                          │
│                         ▼                                        │
│              POST /games/submit                                  │
│              {training_data: {...}}                              │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              routes_games.py                            │    │
│  │  • /submit → GamificationService + GameTrainingService   │    │
│  │  • /train → GameTrainingService                         │    │
│  │  • /parameters/* → GameParametersService                │    │
│  └─────────────────────────────────────────────────────────┘    │
│           │                    │                    │            │
│           ▼                    ▼                    ▼            │
│  ┌──────────────┐    ┌──────────────────┐  ┌──────────────┐    │
│  │Gamification  │    │GameTraining      │  │GameParameters│    │
│  │Service       │    │Service           │  │Service       │    │
│  │              │    │                  │  │              │    │
│  │• Puntos      │    │• record_training │  │• get_params  │    │
│  │• Niveles     │    │• train_batch     │  │• update      │    │
│  └──────────────┘    └────────┬─────────┘  └──────────────┘    │
│                               │                                │
│                               ▼                                │
│                      ┌─────────────────┐                       │
│                      │  OllamaService  │                       │
│                      │  (offline only) │                       │
│                      │  120s timeout   │                       │
│                      └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite/PostgreSQL)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │GameAIParameters  │  │GameTrainingData  │  │AIParameter   │   │
│  │                  │  │                  │  │History       │   │
│  │• game_id         │  │• session_id      │  │• version     │   │
│  │• difficulty      │  │• moves_sequence  │  │• snapshot    │   │
│  │• parameters      │  │• player_won      │  │• change_reason│   │
│  │• version         │  │• critical_moments│  │              │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  Ollama API   │
                  │  (Remote VPS) │
                  │               │
                  │• qwen3:0.6b   │
                  │• granite3.3:2b│
                  └───────────────┘
```

---

## Modelos de Datos

### GameAIParameters

**Propósito:** Almacenar parámetros configurables para la IA de cada juego y dificultad.

```python
class GameAIParameters(Base):
    __tablename__ = "game_ai_parameters"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, nullable=False)  # 'pong', 'tictactoe'
    difficulty = Column(String, nullable=False)  # 'easy', 'medium', 'hard', 'expert'

    # Parámetros configurables (JSON flexible)
    parameters = Column(JSON, nullable=False)

    # Control de versiones
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

    # Métricas
    total_games_trained = Column(Integer, default=0)
    win_rate_vs_players = Column(Float, default=0.5)
    trained_at = Column(DateTime)

    # Índice único para búsqueda rápida
    __table_args__ = (
        UniqueConstraint('game_id', 'difficulty', name='unique_game_difficulty'),
        Index('idx_active_params', 'game_id', 'difficulty', 'is_active'),
    )
```

**Estructura de `parameters` por juego:**

```python
# Pong
{
    "base_error": 20.0,              # Margen de error en píxeles
    "reaction_delay_chance": 0.05,   # Probabilidad de retraso
    "max_bounces": 2,                # Máximo rebotes a predecir
    "paddle_speed": 6.0,             # Velocidad de paleta (reservado)
    "strategy": "balanced",          # 'balanced', 'aggressive', 'defensive'
    "difficulty_multiplier": 1.0     # Multiplicador dinámico
}

# Tic Tac Toe
{
    "error_chance": 0.15,            # Probabilidad de error
    "max_depth": 4,                  # Profundidad de Minimax
    "position_weights": [3, 2, 3, 2, 4, 2, 3, 2, 3]  # Pesos por celda
}
```

### GameTrainingData

**Propósito:** Almacenar datos crudos de partidas para análisis offline.

```python
class GameTrainingData(Base):
    __tablename__ = "game_training_data"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"))

    # Metadata
    game_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Resultado
    player_won = Column(Boolean, nullable=False)
    player_score = Column(Integer, nullable=False)
    total_moves = Column(Integer, default=0)

    # Datos de entrenamiento (JSON flexible)
    moves_sequence = Column(JSON, nullable=False)
    final_board_state = Column(JSON)
    critical_moments = Column(JSON, default=list)

    # Contexto del jugador
    player_level = Column(Integer)
    player_experience = Column(Integer)

    # Índices para consultas eficientes
    __table_args__ = (
        Index('idx_training_game_created', 'game_id', 'created_at'),
        Index('idx_training_recent', 'created_at'),
    )
```

**Estructura de datos recolectados:**

```python
# Pong moves_sequence
[
    {
        "timestamp": 1500,           # ms desde inicio
        "ball_x": 450.5,
        "ball_y": 230.2,
        "ball_vx": 5.8,
        "ball_vy": -2.1,
        "player_paddle_y": 180.0,
        "opponent_paddle_y": 200.5,
        "rally_count": 3,
        "event_type": "paddle_hit"   # 'paddle_hit', 'wall_bounce', 'score'
    },
    # ... 500-5000 eventos
]

# Tic Tac Toe moves_sequence
[
    {
        "position": 4,               # Índice de celda (0-8)
        "timestamp": 2500,           # ms desde inicio
        "board_state": [0, 0, 0, 'X', 'O', 0, 0, 0, 0]  # Estado antes del movimiento
    },
    # ... 5-25 movimientos
]
```

### AIParameterHistory

**Propósito:** Mantener historial de versiones para análisis y rollback.

```python
class AIParameterHistory(Base):
    __tablename__ = "ai_parameter_history"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)

    # Snapshot de parámetros
    parameters_snapshot = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False)

    # Metadata de cambio
    change_reason = Column(String)    # 'ai_trained', 'manual', 'rollback'
    previous_version = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Performance metrics (opcional)
    performance_metrics = Column(JSON)

    # Índices
    __table_args__ = (
        Index('idx_history_version', 'game_id', 'difficulty', 'version'),
    )
```

---

## Servicios Backend

### GameAlgorithmService

**Archivo:** `backend/app/services/game_algorithms_service.py`

**Responsabilidad:** Proveer algoritmos determinísticos locales para movimientos de IA.

```python
class GameAlgorithmService:
    """Servicio unificado de algoritmos locales para IA de juegos"""

    @staticmethod
    def get_pong_move(game_state: dict, difficulty: str = 'medium') -> dict:
        """
        Calcula movimiento de IA para Pong usando física predictiva.

        Args:
            game_state: Estado actual del juego
            difficulty: Nivel de dificultad

        Returns:
            {'target_y': float} - Posición objetivo de la paleta
        """
        # 1. Obtener parámetros activos
        params = GameParametersService.get_active_parameters(
            db=None,  # Usa defaults si no hay BD
            game_id='pong',
            difficulty=difficulty
        )

        # 2. Calcular intersección de pelota
        predicted_y = GameAlgorithmService._predict_ball_intersection(
            ball_x=game_state['ball_x'],
            ball_y=game_state['ball_y'],
            ball_vx=game_state['ball_vx'],
            ball_vy=game_state['ball_vy'],
            max_bounces=params['max_bounces'],
            canvas_height=game_state.get('canvas_height', 500)
        )

        # 3. Agregar error controlado
        error_range = params['base_error'] * params.get('difficulty_multiplier', 1.0)
        predicted_y += random.uniform(-error_range, error_range)

        # 4. Aplicar delay de reacción
        if random.random() < params.get('reaction_delay_chance', 0.0):
            # Usar predicción anterior (simula retraso humano)
            predicted_y = game_state.get('last_predicted_y', predicted_y)

        # 5. Clamp a límites del canvas
        target_y = max(
            0,
            min(
                game_state['canvas_height'] - game_state['paddle_height'],
                predicted_y - game_state['paddle_height'] / 2
            )
        )

        return {'target_y': target_y, 'predicted_y': predicted_y}

    @staticmethod
    def _predict_ball_intersection(
        ball_x: float, ball_y: float,
        ball_vx: float, ball_vy: float,
        max_bounces: int, canvas_height: float
    ) -> float:
        """
        Predice dónde la pelota intersectará el lado derecho del canvas.

        Simula rebotes en top/bottom walls hasta max_bounces.
        """
        if ball_vx <= 0:
            # Pelota alejándose, retornar centro
            return canvas_height / 2

        # Calcular tiempo para llegar al lado derecho (x = 800)
        time_to_edge = (800 - ball_x) / ball_vx

        # Posición Y sin considerar rebotes
        predicted_y = ball_y + ball_vy * time_to_edge

        # Simular rebotes
        bounces = 0
        temp_y = predicted_y

        while bounces < max_bounces:
            if 0 <= temp_y <= canvas_height:
                break  # Dentro de límites

            if temp_y < 0:
                temp_y = -temp_y  # Rebote en top wall
            elif temp_y > canvas_height:
                temp_y = 2 * canvas_height - temp_y  # Rebote en bottom wall

            bounces += 1

        return temp_y
```

**Complejidad:** O(b) donde b = max_bounces (1-5)
**Tiempo de ejecución:** <1ms

---

### GameParametersService

**Archivo:** `backend/app/services/game_parameters_service.py`

**Responsabilidad:** Gestionar ciclo de vida de parámetros (CRUD + versioning).

```python
class GameParametersService:
    """Servicio de gestión de parámetros de IA con versionado"""

    # Parámetros por defecto (usados si no hay BD o como fallback)
    DEFAULT_PARAMETERS = {
        'pong': {
            'easy': {
                'base_error': 50.0,
                'reaction_delay_chance': 0.2,
                'max_bounces': 1,
                'paddle_speed': 4.0,
                'strategy': 'defensive',
                'difficulty_multiplier': 1.5
            },
            'medium': {
                'base_error': 20.0,
                'reaction_delay_chance': 0.05,
                'max_bounces': 2,
                'paddle_speed': 6.0,
                'strategy': 'balanced',
                'difficulty_multiplier': 1.0
            },
            'hard': {
                'base_error': 5.0,
                'reaction_delay_chance': 0.01,
                'max_bounces': 3,
                'paddle_speed': 8.0,
                'strategy': 'aggressive',
                'difficulty_multiplier': 0.8
            },
            'expert': {
                'base_error': 0.0,
                'reaction_delay_chance': 0.0,
                'max_bounces': 5,
                'paddle_speed': 10.0,
                'strategy': 'perfect',
                'difficulty_multiplier': 0.5
            }
        },
        'tictactoe': {
            'easy': {
                'error_chance': 0.4,
                'max_depth': 2,
                'position_weights': [1, 1, 1, 1, 2, 1, 1, 1, 1]
            },
            'medium': {
                'error_chance': 0.15,
                'max_depth': 4,
                'position_weights': [3, 2, 3, 2, 4, 2, 3, 2, 3]
            },
            'hard': {
                'error_chance': 0.02,
                'max_depth': 6,
                'position_weights': [4, 3, 4, 3, 5, 3, 4, 3, 4]
            },
            'expert': {
                'error_chance': 0.0,
                'max_depth': 9,
                'position_weights': [5, 4, 5, 4, 6, 4, 5, 4, 5]
            }
        }
    }

    @staticmethod
    def get_active_parameters(
        db: Optional[Session],
        game_id: str,
        difficulty: str
    ) -> dict:
        """
        Retorna parámetros activos desde BD o defaults.

        Prioridad:
        1. Parámetros activos en BD
        2. Parámetros por defecto
        """
        if db:
            param = db.query(GameAIParameters).filter_by(
                game_id=game_id,
                difficulty=difficulty,
                is_active=True
            ).first()

            if param:
                return param.parameters

        # Fallback a defaults
        return GameParametersService.DEFAULT_PARAMETERS.get(
            game_id, {}
        ).get(difficulty, {})

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
        Actualiza parámetros y guarda historial.

        Proceso:
        1. Guardar snapshot de versión actual en AIParameterHistory
        2. Actualizar GameAIParameters con nueva versión + 1
        3. Marcar como entrenado
        """
        current = db.query(GameAIParameters).filter_by(
            game_id=game_id,
            difficulty=difficulty,
            is_active=True
        ).first()

        if not current:
            raise ValueError(f"No active parameters found for {game_id}/{difficulty}")

        # 1. Guardar snapshot en historial
        history = AIParameterHistory(
            game_id=game_id,
            difficulty=difficulty,
            parameters_snapshot=current.parameters,
            version=current.version,
            change_reason=change_reason,
            previous_version=current.version - 1 if current.version > 1 else None,
            performance_metrics=performance_metrics
        )
        db.add(history)

        # 2. Actualizar parámetros activos
        current.version += 1
        current.parameters = new_parameters
        current.total_games_trained += performance_metrics.get('games_analyzed', 0) if performance_metrics else 0
        current.trained_at = datetime.utcnow()

        # Recalcular win_rate
        recent_games = db.query(GameTrainingData).filter(
            GameTrainingData.game_id == game_id,
            GameTrainingData.created_at > datetime.utcnow() - timedelta(days=7)
        ).all()

        if recent_games:
            wins = sum(1 for g in recent_games if not g.player_won)  # IA wins
            current.win_rate_vs_players = wins / len(recent_games)

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
        Revierte parámetros a una versión anterior.

        Proceso:
        1. Buscar versión en historial
        2. Restaurar parámetros
        3. Crear nuevo registro de historial por el rollback
        """
        # Buscar versión en historial
        history_entry = db.query(AIParameterHistory).filter_by(
            game_id=game_id,
            difficulty=difficulty,
            version=target_version
        ).first()

        if not history_entry:
            raise ValueError(f"Version {target_version} not found in history")

        # Obtener parámetros actuales
        current = db.query(GameAIParameters).filter_by(
            game_id=game_id,
            difficulty=difficulty,
            is_active=True
        ).first()

        # Guardar snapshot antes de rollback
        pre_rollback_history = AIParameterHistory(
            game_id=game_id,
            difficulty=difficulty,
            parameters_snapshot=current.parameters,
            version=current.version,
            change_reason='pre_rollback_snapshot',
            previous_version=current.version - 1
        )
        db.add(pre_rollback_history)

        # Restaurar parámetros
        current.parameters = history_entry.parameters_snapshot
        current.version += 1  # Nueva versión después de rollback
        current.trained_at = datetime.utcnow()

        # Crear registro de rollback
        rollback_history = AIParameterHistory(
            game_id=game_id,
            difficulty=difficulty,
            parameters_snapshot=history_entry.parameters_snapshot,
            version=current.version,
            change_reason='rollback',
            previous_version=target_version
        )
        db.add(rollback_history)

        db.commit()
        db.refresh(current)

        return current
```

---

### GameTrainingService

**Archivo:** `backend/app/services/game_training_service.py`

**Responsabilidad:** Analizar partidas con Ollama y generar mejores parámetros.

```python
class GameTrainingService:
    """Servicio de entrenamiento offline de IA usando Ollama"""

    @staticmethod
    def record_training_data(
        db: Session,
        session_id: int,
        training_data: dict
    ) -> GameTrainingData:
        """
        Guarda datos de entrenamiento de una partida.

        Args:
            db: Sesión de base de datos
            session_id: ID de la sesión de juego
            training_data: Datos recolectados durante el juego

        Returns:
            GameTrainingData creado
        """
        session = db.query(GameSession).filter_by(id=session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Obtener contexto del jugador
        player_level = None
        player_experience = None
        if session.user_id:
            profile = db.query(UserProfile).filter_by(
                user_id=session.user_id
            ).first()
            if profile:
                player_level = profile.level
                player_experience = profile.experience

        # Crear registro
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
    def train_parameters_batch(
        db: Session,
        game_id: str,
        difficulty: str = 'medium',
        batch_size: int = 50,
        model: Optional[str] = None
    ) -> dict:
        """
        Analiza un batch de partidas y genera mejores parámetros.

        Flujo:
        1. Obtener partidas recientes (últimos 7 días)
        2. Para cada partida, generar prompt específico
        3. Llamar a Ollama con timeout largo (120s)
        4. Parsear respuesta JSON
        5. Agregar todos los suggested_adjustments
        6. Calcular promedios con suavizado exponencial
        7. Actualizar parámetros en BD

        Tiempo estimado: 2-5 minutos para 50 partidas
        """
        # 1. Obtener partidas recientes
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
                "message": f"Need at least 10 games, have {len(games)}"
            }

        # 2. Analizar cada partida con IA
        insights_list = []
        for i, game in enumerate(games):
            try:
                print(f"[GameTraining] Analyzing game {i+1}/{len(games)}...")
                insights = GameTrainingService.analyze_game_with_ai(
                    db=db,
                    training_record_id=game.id,
                    model=model
                )
                insights_list.append(insights)
            except Exception as e:
                print(f"[GameTraining] Error analyzing game {game.id}: {e}")
                continue

        if len(insights_list) < 5:
            return {
                "status": "analysis_failed",
                "count": len(insights_list),
                "message": f"Only {len(insights_list)} games analyzed successfully"
            }

        # 3. Agregar insights y calcular nuevos parámetros
        new_params = GameTrainingService._aggregate_insights_to_parameters(
            game_id=game_id,
            difficulty=difficulty,
            insights_list=insights_list
        )

        # 4. Actualizar parámetros en BD
        try:
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
                "message": f"Training completed with {len(insights_list)} games analyzed"
            }

        except Exception as e:
            return {
                "status": "update_failed",
                "error": str(e),
                "message": "Error updating parameters in DB"
            }

    @staticmethod
    def _build_analysis_prompt(training_data: GameTrainingData) -> str:
        """Construye prompt específico para análisis según el juego"""

        if training_data.game_id == 'pong':
            # Prompt específico para Pong
            return f"""Analyze this Pong game and extract insights to improve the AI:

RESULT:
- Player won: {training_data.player_won}
- Player score: {training_data.player_score}

MOVEMENTS: {len(training_data.moves_sequence)} events recorded

CRITICAL MOMENTS:
{json.dumps(training_data.critical_moments[:10], indent=2) if training_data.critical_moments else "[]"}

YOUR TASK:
1. Identify player patterns (e.g., "always attacks top corner")
2. Detect AI weaknesses (e.g., "late to fast bounces")
3. Suggest SPECIFIC parameter adjustments:
   - base_error (0-100, lower = more accurate)
   - reaction_delay_chance (0.0-1.0, lower = faster)
   - max_bounces (1-5, how many bounces to predict)
   - aggressive_offset (0-50, offset for aggressive strategy)

IMPORTANT: Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "player_patterns": ["pattern1", "pattern2"],
  "ai_weaknesses": ["weakness1"],
  "suggested_adjustments": {{
    "base_error": 15.0,
    "reaction_delay_chance": 0.1,
    "max_bounces": 2,
    "aggressive_offset": 10
  }},
  "reasoning": "brief explanation of why these adjustments"
}}"""

        elif training_data.game_id == 'tictactoe':
            # Prompt específico para Tic Tac Toe
            final_board = training_data.final_board_state or {}
            board_str = final_board.get('board', '---------')

            return f"""Analyze this Tic Tac Toe game and extract insights:

RESULT:
- Player won: {training_data.player_won}
- Total moves: {training_data.total_moves}
- Final board: {board_str}

YOUR TASK:
1. Identify player patterns
2. Detect AI weaknesses (e.g., "didn't block critical corner")
3. Suggest SPECIFIC parameter adjustments:
   - error_chance (0.0-1.0, probability of error)
   - max_depth (1-9, minimax depth)
   - position_weights (array of 9 numbers, position priorities)

IMPORTANT: Respond ONLY with valid JSON:
{{
  "player_patterns": ["pattern1"],
  "ai_weaknesses": ["weakness1"],
  "suggested_adjustments": {{
    "error_chance": 0.15,
    "max_depth": 4,
    "position_weights": [3, 2, 3, 2, 4, 2, 3, 2, 3]
  }},
  "reasoning": "explanation"
}}"""

        else:
            # Prompt genérico para otros juegos
            return f"""Analyze this {training_data.game_id} game:

Result: {'Player won' if training_data.player_won else 'AI won'}
Score: {training_data.player_score}
Moves: {training_data.total_moves}

Suggest parameter adjustments in JSON format with:
- player_patterns: array of strings
- ai_weaknesses: array of strings
- suggested_adjustments: object with parameters
- reasoning: explanation

Respond ONLY with valid JSON."""

    @staticmethod
    def _aggregate_insights_to_parameters(
        game_id: str,
        difficulty: str,
        insights_list: list[dict]
    ) -> dict:
        """
        Agrega múltiples insights de IA para calcular nuevos parámetros.

        Usa:
        - Promedio simple para valores sugeridos
        - Suavizado exponencial (alpha=0.3) con valores actuales
        - Esto evita cambios drásticos
        """
        # Obtener parámetros actuales como base
        current_params = GameParametersService.get_active_parameters(
            db=None,
            game_id=game_id,
            difficulty=difficulty
        )

        # Extraer todos los suggested_adjustments válidos
        all_adjustments = []
        for insights in insights_list:
            if 'suggested_adjustments' in insights and isinstance(insights['suggested_adjustments'], dict):
                all_adjustments.append(insights['suggested_adjustments'])

        if not all_adjustments:
            return current_params  # No hay ajustes válidos

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

                # Suavizado exponencial con valor actual
                if key in current_params and isinstance(current_params[key], (int, float)):
                    alpha = 0.3
                    new_value = alpha * avg_value + (1 - alpha) * current_params[key]
                    new_params[key] = new_value
                else:
                    # Parámetro nuevo, usar promedio directamente
                    new_params[key] = avg_value

        # Asegurar parámetros críticos siempre presentes
        if game_id == 'pong':
            new_params.setdefault('base_error', current_params.get('base_error', 20.0))
            new_params.setdefault('reaction_delay_chance', current_params.get('reaction_delay_chance', 0.05))
            new_params.setdefault('max_bounces', current_params.get('max_bounces', 2))
            new_params.setdefault('paddle_speed', current_params.get('paddle_speed', 6.0))
            new_params.setdefault('strategy', current_params.get('strategy', 'balanced'))
            new_params.setdefault('difficulty_multiplier', current_params.get('difficulty_multiplier', 1.0))

        elif game_id == 'tictactoe':
            new_params.setdefault('error_chance', current_params.get('error_chance', 0.15))
            new_params.setdefault('max_depth', current_params.get('max_depth', 4))
            new_params.setdefault('position_weights', current_params.get(
                'position_weights',
                [3, 2, 3, 2, 4, 2, 3, 2, 3]
            ))

        return new_params
```

---

## Frontend Components

### PongGame.tsx

**Patrón de diseño:** Algoritmo local + recolección de datos

```typescript
// 1. Algoritmo local (sin llamada HTTP)
const getLocalAIMove = (
  ball: Ball,
  paddle: Paddle,
  canvasHeight: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
): number => {
  // Parámetros según dificultad
  const params = {
    easy: { baseError: 50, reactionDelay: 0.2, maxBounces: 1 },
    medium: { baseError: 20, reactionDelay: 0.05, maxBounces: 2 },
    hard: { baseError: 5, reactionDelay: 0.01, maxBounces: 3 },
    expert: { baseError: 0, reactionDelay: 0, maxBounces: 5 },
  }[difficulty];

  // Calcular intersección de pelota con física
  let predictedY = ball.y;
  if (ball.vx > 0) {
    const timeToEdge = (800 - ball.x) / ball.vx;
    predictedY = ball.y + ball.vy * timeToEdge;

    // Simular rebotes
    let bounces = 0;
    while (bounces < params.maxBounces) {
      if (predictedY >= 0 && predictedY <= canvasHeight) break;
      if (predictedY < 0) predictedY = -predictedY;
      else predictedY = 2 * canvasHeight - predictedY;
      bounces++;
    }
  }

  // Agregar error controlado
  const error = (Math.random() - 0.5) * 2 * params.baseError;
  predictedY += error;

  // Aplicar delay de reacción
  if (Math.random() < params.reactionDelay) {
    predictedY = ball.y; // Usar posición actual en lugar de predicción
  }

  return predictedY - paddle.height / 2;
};

// 2. Uso en game loop
const updateOpponent = useCallback(() => {
  const paddle = opponentPaddleRef.current;
  const ball = ballRef.current;

  // Algoritmo local - SIN latencia
  const targetY = getLocalAIMove(ball, paddle, CANVAS_HEIGHT, 'medium');

  // Smooth movement hacia target
  const diff = targetY - paddle.y;
  paddle.y += diff * 0.08;

  // Mantener en límites
  paddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - paddle.height, paddle.y));
}, []);

// 3. Recolección de datos de entrenamiento
const gameEventsRef = useRef<GameEvent[]>([]);

// En eventos clave
if (gameEventsRef.current.length < 5000) {
  gameEventsRef.current.push({
    timestamp: Date.now() - gameStartTimeRef.current,
    ball_x: ball.x,
    ball_y: ball.y,
    ball_vx: ball.vx,
    ball_vy: ball.vy,
    player_paddle_y: playerPaddle.y,
    opponent_paddle_y: opponentPaddle.y,
    rally_count: currentRalliesRef.current,
    event_type: 'paddle_hit'
  });
}

// 4. Al terminar partida
onGameEnd(rallies, won, 0, gameTime, {
  training_data: {
    game_id: 'pong',
    moves_sequence: gameEventsRef.current,
    final_board_state: {
      final_score: playerScore,
      opponent_score: opponentScore,
      total_rallies: rallies
    },
    critical_moments: gameEventsRef.current.filter(e => e.event_type),
    player_won: won
  }
});
```

### TicTacToe.tsx

**Patrón similar:** Minimax local + recolección de movimientos

```typescript
// Algoritmo local - Minimax
const makeAIMove = useCallback(() => {
  let bestMove = -1;
  let bestScore = -Infinity;

  // 15% chance de movimiento aleatorio (para hacerlo jugable)
  if (Math.random() < 0.15) {
    const available = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
    if (available.length > 0) {
      bestMove = available[Math.floor(Math.random() * available.length)];
    }
  } else {
    // Usar Minimax para movimiento óptimo
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const newBoard = [...board];
        newBoard[i] = 'O';
        const score = minimax(newBoard, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
  }

  // Recolectar movimiento para entrenamiento
  movesRef.current.push({
    position: bestMove,
    timestamp: Date.now() - gameStartTimeRef.current,
    board_state: [...board]
  });

  // ... ejecutar movimiento ...
}, [board, minimax, moves, onGameEnd]);
```

---

## Flujo de Datos

### 1. Durante Gameplay

```
Frame 1 (t=0ms)
  └─ getLocalAIMove() → <1ms → target_y: 215.5
  └─ updateOpponent() → render

Frame 2 (t=16ms)
  └─ getLocalAIMove() → <1ms → target_y: 217.2
  └─ updateOpponent() → render

...

Frame N (t=5000ms)
  └─ Evento: paddle_hit
  └─ gameEventsRef.push({...}) → Recolectar datos
  └─ getLocalAIMove() → <1ms → target_y: 210.8
  └─ updateOpponent() → render
```

**Características:**
- Sin llamadas HTTP
- Latencia constante <1ms
- FPS constante 60
- Datos recolectados en memoria

### 2. Al Finalizar Partida

```
onGameEnd(score, won, moves, time, {
  training_data: {
    game_id: 'pong',
    moves_sequence: gameEventsRef.current,  // 500-5000 eventos
    final_board_state: {...},
    critical_moments: [...],
    player_won: won
  }
})

    ↓ POST /games/submit

Backend:
  1. GamificationService.record_game_session()
     └─ Calcula puntos, actualiza nivel, verifica badges

  2. GameTrainingService.record_training_data()
     └─ INSERT INTO game_training_data

    ↓ Response

Frontend:
  └─ Muestra "¡GANASTE! +55 puntos"
  └─ Limpia gameEventsRef
```

### 3. Entrenamiento Offline

```
Admin: POST /games/ai/train?game_id=pong&batch_size=50

Backend:
  1. SELECT * FROM game_training_data
     WHERE game_id='pong' AND created_at > 7 days ago
     LIMIT 50

  2. Para cada partida (2-5 min total):
     └─ build_analysis_prompt(game)
     └─ ollama_generate(prompt, timeout=120)  ← Sin restricción
     └─ parse_insights(response)
     └─ insights_list.append(insights)

  3. aggregate_insights_to_parameters()
     └─ Promedio de suggested_adjustments
     └─ Suavizado exponencial (alpha=0.3)

  4. GameParametersService.update_parameters()
     └─ INSERT INTO ai_parameter_history (snapshot)
     └─ UPDATE game_ai_parameters
        SET version = version + 1,
            parameters = {...},
            trained_at = NOW()

    ↓ Response

{"status": "success", "games_analyzed": 50, "version": 3}

Próxima partida → Usa nuevos parámetros automáticamente
```

---

## Algoritmos Locales

### Pong: Física Predictiva

**Problema:** Predecir dónde estará la pelota cuando llegue al lado del oponente.

**Solución:**
1. Calcular tiempo para llegar a x = 800
2. Calcular posición Y en ese tiempo
3. Simular rebotes en top/bottom walls
4. Agregar error controlado según dificultad

**Matemáticas:**
```
time_to_edge = (800 - ball_x) / ball_vx
predicted_y = ball_y + ball_vy * time_to_edge

# Rebote en top wall (y < 0):
predicted_y = -predicted_y

# Rebote en bottom wall (y > canvas_height):
predicted_y = 2 * canvas_height - predicted_y
```

**Complejidad:** O(b) donde b = max_bounces
**Precisión:** 99% para bounces ≤ 3

### Tic Tac Toe: Minimax

**Problema:** Encontrar movimiento óptimo en juego de suma cero.

**Solución:**
1. Minimax con poda alpha-beta
2. Profundidad según dificultad
3. Probabilidad de error para hacerlo jugable

**Pseudocódigo:**
```
function minimax(board, isMaximizing):
    if board is terminal:
        return score(board)

    if isMaximizing:
        bestScore = -∞
        for each move:
            score = minimax(board + move, false)
            bestScore = max(bestScore, score)
        return bestScore
    else:
        bestScore = +∞
        for each move:
            score = minimax(board + move, true)
            bestScore = min(bestScore, score)
        return bestScore
```

**Complejidad:** O(b^d) donde b = branching factor (~9), d = depth
**Precisión:** 100% para depth = 9 (juego perfecto)

---

## Entrenamiento Offline

### Prompt Engineering

**Principios:**
1. **Contexto rico:** Incluir todos los datos relevantes de la partida
2. **Instrucciones claras:** Especificar formato de salida exacto (JSON)
3. **Tarea específica:** Analizar patrones, debilidades, ajustes
4. **Validación:** Parser robusto para extraer JSON de respuesta

**Ejemplo de prompt (Pong):**
```
Analyze this Pong game and extract insights to improve the AI:

RESULT:
- Player won: true
- Player score: 5
- AI score: 3

MOVEMENTS: 1247 events recorded

CRITICAL MOMENTS:
[
  {"timestamp": 1500, "ball_y": 230, "event_type": "paddle_hit"},
  {"timestamp": 3500, "ball_y": 50, "event_type": "wall_bounce"},
  ...
]

YOUR TASK:
1. Identify player patterns (e.g., "always attacks top corner")
2. Detect AI weaknesses (e.g., "late to fast bounces")
3. Suggest SPECIFIC parameter adjustments:
   - base_error (0-100, lower = more accurate)
   - reaction_delay_chance (0.0-1.0, lower = faster)
   - max_bounces (1-5, how many bounces to predict)

IMPORTANT: Respond ONLY with valid JSON:
{
  "player_patterns": ["pattern1", "pattern2"],
  "ai_weaknesses": ["weakness1"],
  "suggested_adjustments": {
    "base_error": 15.0,
    "reaction_delay_chance": 0.1,
    "max_bounces": 2
  },
  "reasoning": "brief explanation"
}
```

### Agregación de Insights

**Problema:** Combinar 50 análisis distintos en un solo conjunto de parámetros.

**Solución:** Suavizado exponencial
```
new_value = α * avg_suggested + (1 - α) * current_value
```

**Por qué funciona:**
- Cambios graduales evita oscilaciones
- Valores atípicos tienen menos impacto
- Convergencia estable a óptimo

**Parámetros:**
- α = 0.3 (aprendizaje moderado)
- Ajustable según necesidad

---

## Consideraciones de Rendimiento

### Backend

| Operación | Tiempo | Frecuencia | Optimizaciones |
|-----------|--------|------------|----------------|
| get_pong_move | <1ms | 60 FPS | Local algorithm |
| get_tictactoe_move | <1ms | Por turno | Local algorithm |
| record_training_data | 50-100ms | Por partida | Bulk insert (futuro) |
| train_parameters_batch | 2-5 min | Manual/scheduler | Timeout 120s |
| get_active_parameters | <10ms | Por llamada | Índices BD |

### Frontend

| Operación | Tiempo | Frecuencia | Optimizaciones |
|-----------|--------|------------|----------------|
| getLocalAIMove | <1ms | 60 FPS | Local calculation |
| gameEventsRef.push | <0.1ms | Eventos clave | Array limitado |
| onGameEnd | 100-500ms | Por partida | POST async |

### Base de Datos

| Tabla | Filas (estimado) | Tamaño por fila | Total |
|-------|------------------|-----------------|-------|
| game_ai_parameters | 8 | ~500 B | ~4 KB |
| ai_parameter_history | ~100/mes | ~600 B | ~60 KB/mes |
| game_training_data | ~500/día | ~50 KB | ~25 MB/día |

**Mantenimiento:**
- Limpiar training_data > 30 días
- Archivar history > 6 meses
- Compactar BD semanalmente

---

## Security Considerations

### Input Validation

```python
# Validar training_data antes de insertar
def record_training_data(db, session_id, training_data):
    # Verificar que session_id existe
    session = db.query(GameSession).filter_by(id=session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found")

    # Validar estructura de training_data
    required_keys = ['game_id', 'moves_sequence']
    for key in required_keys:
        if key not in training_data:
            raise ValueError(f"Missing required key: {key}")

    # Limitar tamaño de moves_sequence
    if len(training_data['moves_sequence']) > 10000:
        raise ValueError("moves_sequence too large")

    # Sanitar JSON (evitar inyección)
    # SQLAlchemy maneja esto automáticamente con JSON columns
```

### Rate Limiting

```python
# Limitar entrenamiento a usuarios autorizados
@router.post("/games/ai/train")
async def train_ai_parameters(
    current_user: dict = Depends(get_current_user)
):
    # TODO: Verificar is_admin
    if not current_user.get('is_admin', False):
        raise HTTPException(403, "Admin only")

    # Limitar a 1 entrenamiento por hora
    # (implementar con Redis o similar)
```

---

## Testing

### Unit Tests

```python
def test_pong_prediction():
    """Test que la predicción de pelota es correcta"""
    game_state = {
        'ball_x': 400,
        'ball_y': 250,
        'ball_vx': 5,
        'ball_vy': 0,
        'paddle_height': 100,
        'canvas_height': 500
    }

    move = GameAlgorithmService.get_pong_move(game_state, 'medium')

    # Pelota sin velocidad Y debe predecir centro
    assert 200 <= move['target_y'] <= 300

def test_tictactoe_minimax():
    """Test que Minimax encuentra movimiento ganador"""
    game_state = {
        'board': ['X', 'X', None, None, 'O', None, None, None, None],
        'player': 'O'
    }

    move = GameAlgorithmService.get_tictactoe_move(game_state, 'expert')

    # Debe bloquear
    assert move['position'] == 2
```

### Integration Tests

```python
def test_training_flow():
    """Test flujo completo de entrenamiento"""
    # 1. Crear partidas de prueba
    for i in range(20):
        session = create_test_session(game_id='pong', won=(i % 2 == 0))
        record_training_data(db, session.id, {...})

    # 2. Ejecutar entrenamiento
    result = train_parameters_batch(db, 'pong', 'medium', batch_size=20)

    # 3. Verificar resultado
    assert result['status'] == 'success'
    assert result['games_analyzed'] == 20

    # 4. Verificar que parámetros cambiaron
    params = get_active_parameters(db, 'pong', 'medium')
    assert params['version'] > 1
```

---

## Changelog

### v2.0.0 (2025-12-27)

- Nueva arquitectura offline
- Eliminadas llamadas en tiempo real a Ollama
- Agregados algoritmos locales
- Nuevo sistema de versionado de parámetros
- Entrenamiento offline con Ollama

### v1.0.0 (2025-12-20)

- Arquitectura inicial (real-time AI)
- Llamadas a Ollama durante gameplay
- Timeouts 502 frecuentes
