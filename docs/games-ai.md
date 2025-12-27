# Sistema de IA Offline para Juegos Arcade

## Overview

PixelCV incluye una sección de **Games** con juegos arcade retro que utilizan **IA predictiva local mejorada por aprendizaje offline**. El sistema aprende de las partidas jugadas usando Ollama para análisis offline, sin afectar la fluidez del juego.

## Arquitectura (v2.0 - Offline AI)

### Principio de Diseño

```
Gameplay (60 FPS) → Algoritmos Locales (<1ms) → Sin latencia
                      ↓
              Datos recolectados
                      ↓
        Partida completada → Guardar training_data
                      ↓
        Job offline → Analizar con Ollama (sin límite de tiempo)
                      ↓
        Nuevos parámetros → Siguiente partida usa IA mejorada
```

### Backend

#### 1. Servicio de Algoritmos Locales (`game_algorithms_service.py`)

**NUEVO - Reemplaza llamadas en tiempo real a Ollama**

Servicio unificado que contiene algoritmos determinísticos para cada juego:

```python
from app.services.game_algorithms_service import GameAlgorithmService

# Pong: Predicción con física de pelota
move = GameAlgorithmService.get_pong_move(
    game_state={
        'ball_x': 400, 'ball_y': 250,
        'ball_vx': 5, 'ball_vy': 3,
        'paddle_y': 200, 'paddle_height': 100,
        'canvas_height': 500
    },
    difficulty='medium'
)
# Retorna: {'target_y': 215.5} en <1ms

# Tic Tac Toe: Minimax con profundidad dinámica
move = GameAlgorithmService.get_tictactoe_move(
    game_state={'board': [0, 'X', 0, 0, 'O', 0, 0, 0, 0], 'player': 'O'},
    difficulty='medium'
)
# Retorna: {'position': 4} en <1ms
```

#### 2. Gestión de Parámetros (`game_parameters_service.py`)

**NUEVO - Controla dificultad y aprendizaje**

Parámetros configurables por juego y dificultad:

| Juego | Parámetros | Descripción |
|-------|-----------|-------------|
| Pong | `base_error` | Margen de error (0-100) |
| Pong | `reaction_delay_chance` | Probabilidad de retraso (0.0-1.0) |
| Pong | `max_bounces` | Rebotes a predecir (1-5) |
| Pong | `paddle_speed` | Velocidad de paleta (1-10) |
| Pong | `strategy` | Estrategia ('balanced', 'aggressive', 'defensive') |
| Tic Tac Toe | `error_chance` | Probabilidad de error (0.0-1.0) |
| Tic Tac Toe | `max_depth` | Profundidad Minimax (1-9) |
| Tic Tac Toe | `position_weights` | Pesos por posición [array de 9] |

#### 3. Servicio de Entrenamiento Offline (`game_training_service.py`)

**NUEVO - Analiza partidas con Ollama**

Analiza partidas completadas (sin restricciones de tiempo) para mejorar parámetros:

```python
from app.services.game_training_service import GameTrainingService

# Analizar 50 partidas y mejorar parámetros
result = GameTrainingService.train_parameters_batch(
    db=db,
    game_id='pong',
    difficulty='medium',
    batch_size=50
)

# Retorna:
# {
#   "status": "success",
#   "games_analyzed": 50,
#   "new_parameters": {...},
#   "version": 3,
#   "message": "Entrenamiento completado con 50 partidas"
# }
```

#### 4. Modelo de Datos (`database.py`)

**NUEVAS TABLAS**

```python
# Parámetros de IA (versionados)
class GameAIParameters:
    game_id: str              # 'pong', 'tictactoe'
    difficulty: str           # 'easy', 'medium', 'hard', 'expert'
    parameters: JSON          # Configuración actual
    version: int              # Para rollback
    is_active: bool
    total_games_trained: int
    win_rate_vs_players: float
    trained_at: datetime

# Datos de entrenamiento recolectados
class GameTrainingData:
    session_id: int
    game_id: str
    moves_sequence: JSON      # [{ball_x, ball_y, timestamp}, ...]
    final_board_state: JSON
    player_won: bool
    player_score: int
    total_moves: int
    critical_moments: JSON    # Momentos clave

# Historial de versiones (para rollback)
class AIParameterHistory:
    game_id: str
    difficulty: str
    parameters_snapshot: JSON
    version: int
    change_reason: str        # 'ai_trained', 'manual', 'rollback'
    created_at: datetime
```

### Endpoints de API

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/games/submit` | POST | Opcional | Registra resultado + training_data |
| `/games/ai/train` | POST | Sí | Ejecuta entrenamiento offline (admin) |
| `/games/ai/parameters/{game_id}/{difficulty}` | GET | No | Obtiene parámetros activos |
| `/games/ai/parameters/history/{game_id}` | GET | No | Historial de versiones |
| `/games/ai/parameters/initialize` | POST | Sí | Inicializa parámetros por defecto |
| `/games/ai/training/stats` | GET | No | Estadísticas de datos recolectados |
| `/games/ai/move` | POST | No | ⚠️ DEPRECATED - Usar algoritmos locales |
| `/games/ai/status` | GET | No | Estado de Ollama (solo info) |

## Flujo Completo

### Durante Gameplay

```typescript
// Frontend (PongGame.tsx, TicTacToe.tsx)

// 1. Algoritmo local - SIN llamada HTTP
const move = getLocalAIMove(gameState); // <1ms

// 2. Recolectar datos para entrenamiento
gameEventsRef.push({
  timestamp: Date.now(),
  ball_x: ball.x,
  ball_y: ball.y,
  ball_vx: ball.vx,
  ball_vy: ball.vy,
  player_paddle_y: playerPaddle.y,
  opponent_paddle_y: opponentPaddle.y,
  rally_count: rallies,
  event_type: 'paddle_hit'
});

// 3. Al terminar partida → enviar todo al backend
onGameEnd(score, won, moves, time, {
  training_data: {
    game_id: 'pong',
    moves_sequence: gameEventsRef.current, // 500-5000 eventos
    final_board_state: {...},
    critical_moments: [...],
    player_won: won
  }
});
```

### Al Finalizar Partida

```python
# Backend (routes_games.py)

@router.post("/games/submit")
async def submit_game_result(request: GameSubmitRequest, ...):
    # 1. Registrar sesión y puntos
    session = GamificationService.record_game_session(...)

    # 2. Guardar training_data para análisis offline
    if request.game_data and 'training_data' in request.game_data:
        GameTrainingService.record_training_data(
            db=db,
            session_id=session.id,
            training_data=request.game_data['training_data']
        )

    return {"success": True, "points_earned": session.points_earned}
```

### Entrenamiento Offline

```python
# Manual (Admin) o Automático (Scheduler)

@router.post("/games/ai/train")
async def train_ai_parameters(game_id: str, batch_size: int = 50, ...):
    # 1. Obtener partidas recientes
    games = db.query(GameTrainingData).filter(
        GameTrainingData.game_id == game_id,
        GameTrainingData.created_at > datetime.utcnow() - timedelta(days=7)
    ).limit(batch_size).all()

    # 2. Analizar cada partida con Ollama (SIN timeout de 5s)
    insights_list = []
    for game in games:
        prompt = GameTrainingService._build_analysis_prompt(game)
        # 120 segundos de timeout - es offline
        insights_text = ollama_generate(prompt, timeout=120)
        insights = parse_insights(insights_text)
        insights_list.append(insights)

    # 3. Agregar insights y calcular nuevos parámetros
    new_params = aggregate_insights_to_parameters(
        game_id, difficulty, insights_list
    )

    # 4. Actualizar parámetros + guardar historial
    GameParametersService.update_parameters(
        db, game_id, difficulty, new_params, "ai_trained"
    )

    return {"status": "success", "games_analyzed": len(insights_list)}
```

## Configuración

### Variables de Entorno

**Backend (`.env`):**
```bash
# Base de datos
PIXELCV_DB_URL=sqlite:///./pixelcv.db

# Ollama (para análisis offline SOLAMENTE)
OLLAMA_BASE_URL=https://ollama.alexanderoviedofadul.dev/api
OLLAMA_DEFAULT_MODEL=granite3.3:2b
OLLAMA_TIMEOUT=120  # 2 minutos para análisis offline (sin restricción)
```

**Frontend (`.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # local
# NEXT_PUBLIC_API_URL=https://pixelcv.alexanderoviedofadul.dev/api  # producción
```

## Inicialización

### 1. Crear Tablas (automático)

Las tablas se crean automáticamente al iniciar el backend por primera vez.

### 2. Inicializar Parámetros

```bash
# Requiere autenticación
curl -X POST http://localhost:8000/games/ai/parameters/initialize \
  -H "Authorization: Bearer <token>"
```

Respuesta:
```json
{
  "status": "success",
  "message": "Parámetros inicializados: 8 totales (8 nuevos, 0 actualizados)",
  "total": 8,
  "created": 8,
  "updated": 0
}
```

### 3. Verificar Parámetros

```bash
curl http://localhost:8000/games/ai/parameters/pong/medium
```

```json
{
  "game_id": "pong",
  "difficulty": "medium",
  "parameters": {
    "base_error": 20.0,
    "reaction_delay_chance": 0.05,
    "max_bounces": 2,
    "paddle_speed": 6.0,
    "strategy": "balanced"
  }
}
```

## Uso del Sistema

### Ver Estadísticas de Entrenamiento

```bash
curl http://localhost:8000/games/ai/training/stats
```

```json
{
  "total_games": 150,
  "player_wins": 90,
  "ai_wins": 60,
  "win_rate": 0.6,
  "recent_games_7d": 45,
  "by_game": {
    "pong": 100,
    "tictactoe": 50
  }
}
```

### Entrenar IA Manualmente

```bash
# Analiza las últimas 50 partidas de Pong
curl -X POST "http://localhost:8000/games/ai/train?game_id=pong&difficulty=medium&batch_size=50" \
  -H "Authorization: Bearer <token>"
```

Tiempo estimado: **2-5 minutos** (proceso offline, no bloquea gameplay)

### Ver Historial de Parámetros

```bash
curl http://localhost:8000/games/ai/parameters/history/pong?difficulty=medium
```

```json
{
  "game_id": "pong",
  "difficulty": "medium",
  "history": [
    {
      "version": 3,
      "parameters": {
        "base_error": 15.5,
        "reaction_delay_chance": 0.04,
        "max_bounces": 3
      },
      "change_reason": "ai_trained",
      "created_at": "2025-12-27T14:30:00"
    },
    {
      "version": 2,
      "parameters": {...},
      "change_reason": "ai_trained",
      "created_at": "2025-12-27T10:15:00"
    }
  ]
}
```

### Rollback a Versión Anterior

```python
from app.services.game_parameters_service import GameParametersService

# Revertir parámetros de Pong medium a versión 2
GameParametersService.rollback_parameters(
    db=db,
    game_id='pong',
    difficulty='medium',
    target_version=2
)
```

## Algoritmos Implementados

### Pong

**Algoritmo:** Física predictiva con rebotes

1. **Predicción de trayectoria:**
   - Calcula intersección de pelota con lado del oponente
   - Simula rebotes en top/bottom walls
   - Usa física realista (velocidad constante)

2. **Error controlado:**
   - `base_error`: Margen de error en píxeles
   - Más error en dificultades bajas
   - Distribución aleatoria uniforme

3. **Reacción simulada:**
   - `reaction_delay_chance`: Probabilidad de usar predicción anterior
   - Simula tiempo de reacción humano

4. **Estrategia:**
   - `balanced`: Equilibrio entre defensa y ataque
   - `aggressive`: Anticipa rebotes agresivos
   - `defensive`: Prioriza defender el centro

**Complejidad:** O(bounces) donde bounces = 1-5
**Tiempo de ejecución:** <1ms

### Tic Tac Toe

**Algoritmo:** Minimax con poda alpha-beta

1. **Minimax estándar:**
   - Explora árbol de juego completo
   - Maximiza ganancias de IA, minimiza del jugador

2. **Profundidad dinámica:**
   - `max_depth`: 1 (fácil) a 9 (imposible)
   - Mayores profundidades = más cálculo

3. **Probabilidad de error:**
   - `error_chance`: Probabilidad de movimiento aleatorio
   - Permite que el jugador gane ocasionalmente

4. **Pesos de posición:**
   - `position_weights`: Array de 9 valores
   - Prioriza posiciones estratégicas (centro, esquinas)

**Complejidad:** O(b^d) donde b = branching factor, d = depth
**Tiempo de ejecución:** <1ms (para depth ≤ 6)

## Juegos Implementados

| Juego | Algoritmo Local | Entrenamiento Offline |
|-------|----------------|----------------------|
| Pong | Física predictiva | ✅ Sí |
| Tic Tac Toe | Minimax | ✅ Sí |
| Memory Match | Sin IA | ❌ No |
| Snake | Patrón simple | ❌ No |
| Breakout | Patrón simple | ❌ No |
| 2048 | Sin IA | ❌ No |
| Tetris | Sin IA | ❌ No |
| Space Invaders | Patrón simple | ❌ No |

## Indicadores Visuales

Los juegos muestran el estado de IA:

- **🤖 Predictive AI** (púrpura): Algoritmo local activo (siempre)
- **🤖 Minimax AI** (púrpura): Minimax local activo (siempre)

**Nota:** Ya no hay indicador de "AI Active" vs "Local AI" porque siempre usamos algoritmos locales.

## Performance

### Arquitectura v2.0 (Actual)

- **Latencia de movimiento:** <1ms (algoritmo local)
- **Llamadas HTTP durante gameplay:** 0
- **Errores 502:** Eliminados
- **FPS:** Constante 60 FPS
- **Entrenamiento offline:** 2-5 minutos por batch de 50 partidas
- **Mejora continua:** Sí, parámetros se actualizan con cada entrenamiento

### Comparativa v1.0 vs v2.0

| Métrica | v1.0 (Real-time) | v2.0 (Offline) |
|---------|-----------------|----------------|
| Latencia de movimiento | 5-10s (Ollama) | <1ms (local) |
| Errores 502 | Frecuentes | Eliminados |
| FPS durante gameplay | Variable (lag) | Constante 60 |
| Mejora con el tiempo | No | Sí |
| Uso de Ollama | Durante gameplay | Offline only |
| Escalabilidad | Limitada | Alta |

## Troubleshooting

### La IA no mejora después del entrenamiento

Verificar:
1. Que se hayan recolectado suficientes partidas:
   ```bash
   curl http://localhost:8000/games/ai/training/stats
   ```
2. Que el entrenamiento se haya completado exitosamente:
   ```bash
   curl http://localhost:8000/games/ai/parameters/history/pong
   ```
3. Que los nuevos parámetros estén activos:
   ```bash
   curl http://localhost:8000/games/ai/parameters/pong/medium
   ```

### Los parámetros no cambian

Los parámetros usan **suavizado exponencial** (alpha=0.3) para evitar cambios drásticos:

```python
new_value = 0.3 * avg_suggested + 0.7 * current_value
```

Esto significa que los cambios son graduales. Si se desea un cambio más agresivo, modificar `alpha` en `game_training_service.py:410`.

### Rollback si empeora rendimiento

```python
from app.services.game_parameters_service import GameParametersService
from app.models.database import get_db

db = next(get_db())
GameParametersService.rollback_parameters(
    db=db,
    game_id='pong',
    difficulty='medium',
    target_version=2  # Versión anterior
)
```

## Archivos del Sistema

### Backend

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `app/models/database.py` | Modificado | GameAIParameters, GameTrainingData, AIParameterHistory |
| `app/services/game_algorithms_service.py` | NUEVO | Algoritmos locales (Pong, TTT) |
| `app/services/game_parameters_service.py` | NUEVO | CRUD de parámetros con versionado |
| `app/services/game_training_service.py` | NUEVO | Entrenamiento offline con Ollama |
| `app/services/game_ai_service.py` | Deprecado | Warnings para migrar a nuevos servicios |
| `app/api/routes_games.py` | Modificado | Endpoints de entrenamiento y parámetros |

### Frontend

| Archivo | Cambios |
|---------|---------|
| `components/games/PongGame.tsx` | Eliminadas llamadas `/ai/move`, agregado `training_data` |
| `components/games/TicTacToe.tsx` | Eliminadas llamadas `/ai/move`, agregado `training_data` |

## Ventajas de la Arquitectura Offline

1. **Sin timeouts 502:** Gameplay no depende de Ollama en tiempo real
2. **Sin lag:** Algoritmos locales son determinísticos (<1ms)
3. **Mejora continua:** IA aprende de partidas reales
4. **Escalable:** Entrenamiento offline no bloquea gameplay
5. **Versionado:** Rollback posible si empeora rendimiento
6. **Observable:** Historial completo de cambios y métricas
7. **Análisis profundo:** Ollama puede analizar partidas con 120s de timeout

## Próximos Pasos

### Automatización (Opcional)

Crear un scheduler automático para entrenamiento periódico:

```python
# backend/app/services/game_scheduler.py (Futuro)
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

# Entrenar Pong cada 6 horas (si hay +50 partidas nuevas)
scheduler.add_job(
    train_pong_job,
    'interval',
    hours=6,
    id='pong_training'
)

# Entrenar Tic Tac Toe cada 12 horas
scheduler.add_job(
    train_tictactoe_job,
    'interval',
    hours=12,
    id='tictactoe_training'
)

scheduler.start()
```

### Más Juegos

Extender el sistema a otros juegos:
- **Breakout:** Predicción de rebote similar a Pong
- **Space Invaders:** Predicción de movimiento de enemigos
- **Snake:** Planificación de ruta (pathfinding)

## Documentación Adicional

- **[Arquitectura Técnica](development/games-ai-architecture.md)** - Detalles internos de implementación
- **[Guía de Entrenamiento](development/games-ai-training.md)** - Cómo funciona el aprendizaje offline
- **[API Reference](development/games-ai-api.md)** - Documentación completa de endpoints

## Changelog

### v2.0 (2025-12-27) - Arquitectura Offline

- **Eliminadas** llamadas en tiempo real a Ollama durante gameplay
- **Agregados** algoritmos locales para Pong y Tic Tac Toe
- **Nuevas** tablas: GameAIParameters, GameTrainingData, AIParameterHistory
- **Nuevos** servicios: game_algorithms_service, game_parameters_service, game_training_service
- **Nuevos** endpoints: `/ai/train`, `/ai/parameters/*`, `/ai/training/stats`
- **Resuelto** problema de errores 502 Bad Gateway
- **Mejorado** rendimiento: 60 FPS constantes, <1ms de latencia

### v1.0 (2025-12-20) - IA en Tiempo Real

- Llamadas a Ollama durante gameplay
- Timeout de 2-5 segundos
- Errores 502 frecuentes
- Sin aprendizaje continuo
