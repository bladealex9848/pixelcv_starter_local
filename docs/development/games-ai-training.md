# Guía de Entrenamiento Offline con Ollama

## Overview

Esta guía explica cómo funciona el sistema de entrenamiento offline que usa Ollama para analizar partidas completadas y mejorar los algoritmos de IA locales de forma continua.

## Tabla de Contenidos

1. [Concepto General](#concepto-general)
2. [Flujo de Entrenamiento](#flujo-de-entrenamiento)
3. [Prompt Engineering](#prompt-engineering)
4. [Análisis de Partidas](#análisis-de-partidas)
5. [Agregación de Insights](#agregación-de-insights)
6. [Actualización de Parámetros](#actualización-de-parámetros)
7. [Validación y Rollback](#validación-y-rollback)
8. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Concepto General

### El Problema: IA en Tiempo Real

**Arquitectura anterior (v1.0):**
```
Gameplay → Frame update → Llamada HTTP a Ollama (5-10s) → Timeout 502 → Fallback local
```

**Problemas:**
- Timeout de 5 segundos insuficiente (Ollama tarda 5-10s)
- Errores 502 Bad Gateway frecuentes
- Lag en gameplay (FPS variable)
- Sin aprendizaje continuo

### La Solución: IA Offline

**Nueva arquitectura (v2.0):**
```
Gameplay → Algoritmo local (<1ms) → Sin latencia
              ↓
      Datos recolectados
              ↓
    Partida completada → Guardar training_data
              ↓
    Job offline → Analizar con Ollama (sin límite de tiempo)
              ↓
    Nuevos parámetros → Siguiente partida usa IA mejorada
```

**Ventajas:**
- Sin timeouts 502
- Gameplay fluido (60 FPS constantes)
- Aprendizaje continuo
- Análisis profundo con Ollama (120s de timeout)

---

## Flujo de Entrenamiento

### Diagrama Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    1. RECOLECCIÓN                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PongGame.tsx / TicTacToe.tsx                              │
│    │                                                        │
│    ├─► gameEventsRef.push(event)  // Cada frame/evento     │
│    │                                                        │
│    └─► onGameEnd({                                         │
│           training_data: {                                 │
│             game_id: 'pong',                               │
│             moves_sequence: [...],  // 500-5000 eventos    │
│             final_board_state: {...},                      │
│             critical_moments: [...],                       │
│             player_won: true                               │
│           }                                                 │
│         })                                                  │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ POST /games/submit
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  2. ALMACENAMIENTO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  routes_games.py → GameTrainingService.record_training_data │
│    │                                                        │
│    └─► INSERT INTO game_training_data                       │
│         {                                                   │
│           session_id: 123,                                 │
│           game_id: 'pong',                                 │
│           moves_sequence: [...],                           │
│           player_won: true,                                │
│           player_score: 5,                                 │
│           total_moves: 1247                                │
│         }                                                   │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              3. ENTRENAMIENTO OFFLINE (Manual/Scheduler)    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /games/ai/train?game_id=pong&batch_size=50          │
│    │                                                        │
│    ▼                                                        │
│  GameTrainingService.train_parameters_batch()              │
│    │                                                        │
│    ├─► 3.1. Obtener partidas recientes                     │
│    │   SELECT * FROM game_training_data                    │
│    │   WHERE game_id='pong' AND created_at > 7 días ago    │
│    │   LIMIT 50                                            │
│    │                                                        │
│    ├─► 3.2. Analizar cada partida con Ollama               │
│    │   Para cada partida (2-5 min total):                  │
│    │     ├─► build_analysis_prompt(game)                   │
│    │     ├─► ollama_generate(prompt, timeout=120)          │
│    │     └─► parse_insights(response)                      │
│    │                                                        │
│    ├─► 3.3. Agregar insights                               │
│    │   aggregate_insights_to_parameters()                  │
│    │     ├─► Promedio de suggested_adjustments             │
│    │     └─► Suavizado exponencial (α=0.3)                 │
│    │                                                        │
│    └─► 3.4. Actualizar parámetros                          │
│        GameParametersService.update_parameters()            │
│          ├─► INSERT INTO ai_parameter_history             │
│          │   {                                             │
│          │     version: 2,                                  │
│          │     parameters_snapshot: {...},                 │
│          │     change_reason: 'ai_trained'                 │
│          │   }                                             │
│          │                                                  │
│          └─► UPDATE game_ai_parameters                     │
│              SET                                           │
│                version = 3,                                │
│                parameters = {...},                         │
│                trained_at = NOW()                          │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                4. PRÓXIMA PARTIDA                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  get_active_parameters('pong', 'medium')                   │
│    └─► Retorna nueva versión (v3)                          │
│         {                                                  │
│           base_error: 15.5,  // Mejorado de 20.0          │
│           reaction_delay_chance: 0.04,  // Mejorado de 0.05│
│           max_bounces: 3                                   │
│         }                                                  │
│                                                             │
│  GameAlgorithmService.get_pong_move()                      │
│    └─► Usa nuevos parámetros automáticamente              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Prompt Engineering

### Estrategia de Prompts

Los prompts están diseñados para extraer **insights accionables** de partidas completadas:

**Componentes clave:**
1. **Contexto rico:** Todos los datos relevantes de la partida
2. **Tarea específica:** Analizar patrones, detectar debilidades, sugerir ajustes
3. **Formato estructurado:** JSON válido con campos específicos
4. **Validación robusta:** Parser tolerante a respuestas mal formateadas

### Prompt para Pong

```python
def _build_analysis_prompt(training_data: GameTrainingData) -> str:
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
```

**Ejemplo de respuesta de Ollama:**
```json
{
  "player_patterns": [
    "El jugador ataca consistentemente a la esquina superior derecha",
    "El jugador reacciona lento a cambios rápidos de dirección"
  ],
  "ai_weaknesses": [
    "La IA no anticipa suficientes rebotes en paredes",
    "La IA tiene un error base demasiado alto para este nivel de jugador"
  ],
  "suggested_adjustments": {
    "base_error": 18.5,
    "reaction_delay_chance": 0.04,
    "max_bounces": 3,
    "aggressive_offset": 15
  },
  "reasoning": "El jugador es de nivel intermedio, puede predecir 2-3 rebotes. Reducir error base y aumentar rebotes predichos mejorará el desafío sin hacerlo imposible."
}
```

### Prompt para Tic Tac Toe

```python
def _build_analysis_prompt(training_data: GameTrainingData) -> str:
    final_board = training_data.final_board_state or {}
    board_str = final_board.get('board', '---------')

    return f"""Analiza esta partida de Tic Tac Toe y extrae insights:

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
```

---

## Análisis de Partidas

### Proceso de Análisis

Cada partida se analiza individualmente con Ollama:

```python
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
        raise ValueError(f"Training data {training_record_id} not found")

    # 1. Construir prompt específico para el juego
    prompt = GameTrainingService._build_analysis_prompt(training_data)

    try:
        # 2. Llamar a Ollama sin restricciones de tiempo
        insights_text = generate_text(
            prompt,
            model=model,
            max_tokens=500  # Limitar longitud de respuesta
        )

        # 3. Parsear respuesta
        insights = GameTrainingService._parse_insights(insights_text)

        return insights

    except Exception as e:
        print(f"[GameTraining] Error analyzing game {training_record_id}: {e}")
        # Retornar insights vacíos en caso de error
        return {
            'player_patterns': [],
            'ai_weaknesses': [],
            'suggested_adjustments': {},
            'reasoning': f'Error: {str(e)}'
        }
```

### Parser Robusto

El parser maneja respuestas mal formateadas de Ollama:

```python
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
            'reasoning': 'Error parsing JSON'
        }
```

---

## Agregación de Insights

### Combinando Múltiples Análisis

Después de analizar N partidas (ej: 50), necesitamos combinar todos los insights en un solo conjunto de parámetros:

```python
def _aggregate_insights_to_parameters(
    game_id: str,
    difficulty: str,
    insights_list: list[dict]
) -> dict:
    """
    Agrega múltiples insights de IA para calcular nuevos parámetros.

    Usa promedio ponderado y suavizado exponencial para evitar cambios drásticos.
    """
    # 1. Obtener parámetros actuales como base
    current_params = GameParametersService.get_active_parameters(
        db=None,
        game_id=game_id,
        difficulty=difficulty
    )

    # 2. Extraer todos los suggested_adjustments válidos
    all_adjustments = []
    for insights in insights_list:
        if 'suggested_adjustments' in insights and isinstance(insights['suggested_adjustments'], dict):
            all_adjustments.append(insights['suggested_adjustments'])

    if not all_adjustments:
        return current_params  # No hay ajustes válidos

    # 3. Calcular promedios de cada parámetro
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

            # 4. Suavizado exponencial con valor actual
            if key in current_params and isinstance(current_params[key], (int, float)):
                alpha = 0.3
                new_value = alpha * avg_value + (1 - alpha) * current_params[key]
                new_params[key] = new_value
            else:
                # Parámetro nuevo, usar el promedio directamente
                new_params[key] = avg_value

    # 5. Asegurar que los parámetros críticos siempre estén presentes
    if game_id == 'pong':
        new_params.setdefault('base_error', current_params.get('base_error', 20.0))
        new_params.setdefault('reaction_delay_chance', current_params.get('reaction_delay_chance', 0.05))
        new_params.setdefault('max_bounces', current_params.get('max_bounces', 2))
        new_params.setdefault('paddle_speed', current_params.get('paddle_speed', 6.0))
        new_params.setdefault('strategy', current_params.get('strategy', 'balanced'))

    return new_params
```

### Suavizado Exponencial

**Fórmula:**
```
new_value = α × avg_suggested + (1 - α) × current_value
```

**Por qué funciona:**
- Cambios graduales evita oscilaciones
- Valores atípicos tienen menos impacto
- Convergencia estable a óptimo

**Parámetros:**
- α = 0.3 (aprendizaje moderado)
- Ajustable según necesidad

**Ejemplo:**
```
current_params['base_error'] = 20.0
avg_suggested_from_50_games = 15.0

new_base_error = 0.3 × 15.0 + 0.7 × 20.0
               = 4.5 + 14.0
               = 18.5
```

**Resultado:** Cambio gradual de 20.0 → 18.5 (en lugar de 20.0 → 15.0)

---

## Actualización de Parámetros

### Proceso de Actualización

```python
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
        raise ValueError(f"No active parameters for {game_id}/{difficulty}")

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
        ai_wins = sum(1 for g in recent_games if not g.player_won)
        current.win_rate_vs_players = ai_wins / len(recent_games)

    db.commit()
    db.refresh(current)

    return current
```

---

## Validación y Rollback

### Validación de Resultados

```python
def validate_parameters(new_params: dict, game_id: str) -> bool:
    """Valida que los nuevos parámetros estén en rangos aceptables"""

    # Validar rangos para Pong
    if game_id == 'pong':
        if 'base_error' in new_params:
            if not (0 <= new_params['base_error'] <= 100):
                return False
        if 'reaction_delay_chance' in new_params:
            if not (0.0 <= new_params['reaction_delay_chance'] <= 1.0):
                return False
        if 'max_bounces' in new_params:
            if not (1 <= new_params['max_bounces'] <= 5):
                return False

    # Validar rangos para Tic Tac Toe
    if game_id == 'tictactoe':
        if 'error_chance' in new_params:
            if not (0.0 <= new_params['error_chance'] <= 1.0):
                return False
        if 'max_depth' in new_params:
            if not (1 <= new_params['max_depth'] <= 9):
                return False

    return True
```

### Rollback si Empieza a Peorar

Si después del entrenamiento la IA desempeña peor, hacer rollback:

```python
from app.services.game_parameters_service import GameParametersService
from app.models.database import get_db

db = next(get_db())

# Revertir a versión anterior
GameParametersService.rollback_parameters(
    db=db,
    game_id='pong',
    difficulty='medium',
    target_version=2  # Volver a versión 2
)
```

---

## Ejemplos Prácticos

### Ejemplo 1: Entrenamiento Inicial de Pong

```bash
# 1. Verificar datos disponibles
curl http://localhost:8000/games/ai/training/stats

# Respuesta:
{
  "total_games": 100,
  "by_game": {
    "pong": 80,
    "tictactoe": 20
  }
}

# 2. Entrenar Pong con 50 partidas
curl -X POST "http://localhost:8000/games/ai/train?game_id=pong&difficulty=medium&batch_size=50" \
  -H "Authorization: Bearer <token>"

# Respuesta (después de 2-5 minutos):
{
  "status": "success",
  "games_analyzed": 50,
  "new_parameters": {
    "base_error": 18.5,
    "reaction_delay_chance": 0.04,
    "max_bounces": 3,
    "paddle_speed": 6.0,
    "strategy": "balanced"
  },
  "version": 2,
  "message": "Training completed with 50 games analyzed"
}

# 3. Verificar nuevo historial
curl "http://localhost:8000/games/ai/parameters/history/pong?difficulty=medium"

# 4. Jugar una partida para probar nuevos parámetros
```

### Ejemplo 2: Rollback después de Mal Entrenamiento

```python
# Después del entrenamiento, la IA ahora gana el 95% de las veces
# (demasiado difícil para los jugadores)

# Ver win_rate actual
curl "http://localhost:8000/games/ai/parameters/pong/medium"

# Respuesta:
{
  "parameters": {...},
  "version": 5,
  "win_rate_vs_players": 0.95  # Muy alto
}

# Hacer rollback a versión anterior
from app.services.game_parameters_service import GameParametersService
from app.models.database import get_db

db = next(get_db())
GameParametersService.rollback_parameters(
    db=db,
    game_id='pong',
    difficulty='medium',
    target_version=4
)

# Verificar que se restauró
curl "http://localhost:8000/games/ai/parameters/pong/medium"

# Respuesta:
{
  "parameters": {...},
  "version": 6,  # Nueva versión después de rollback
  "win_rate_vs_players": 0.65  # Mejor
}
```

### Ejemplo 3: Ajuste Manual de Parámetros

```python
# Los insights de IA no son perfectos, a veces se necesita ajuste manual

from app.services.game_parameters_service import GameParametersService
from app.models.database import get_db

db = next(get_db())

# Obtener parámetros actuales
current = GameParametersService.get_active_parameters(
    db=db,
    game_id='pong',
    difficulty='medium'
)

# Ajustar manualmente
current['base_error'] = 22.0  # Un poco más de error
current['reaction_delay_chance'] = 0.08  # Más retraso

# Actualizar
GameParametersService.update_parameters(
    db=db,
    game_id='pong',
    difficulty='medium',
    new_parameters=current,
    change_reason='manual_adjustment'
)
```

---

## Best Practices

### 1. Cantidad de Partidas

- **Mínimo:** 10 partidas para entrenamiento inicial
- **Óptimo:** 50 partidas por batch
- **Máximo:** 100 partidas (más allá no mejora significativamente)

### 2. Frecuencia de Entrenamiento

- **Desarrollo:** Manual cuando se tenga suficientes datos
- **Producción:** Cada 6-12 horas (automatizado con scheduler)
- **No entrenar:** Mientras haya <10 partidas nuevas

### 3. Monitoreo

- Verificar `win_rate_vs_players` después de cada entrenamiento
- Si win_rate > 0.8: IA demasiado difícil, considerar rollback
- Si win_rate < 0.3: IA demasiado fácil, entrenar más
- Objetivo: win_rate ~0.5-0.6 (equilibrado)

### 4. Validación

- Siempre validar que parámetros estén en rangos aceptables
- Verificar que JSON de Ollama se parseó correctamente
- Revisar `reasoning` de insights para entender cambios

### 5. Rollback

- No tener miedo de hacer rollback si empeora
- Mantener historial por al menos 6 meses
- Documentar razón de rollback en metadata

---

## Troubleshooting

### Problema: Entrenamiento falla

**Síntoma:** `{"status": "analysis_failed", "count": 3}`

**Causa:** Ollama no está disponible o responde con JSON inválido

**Solución:**
```bash
# Verificar Ollama
curl https://ollama.alexanderoviedofadul.dev/api/tags

# Verificar logs del backend
tail -f backend/logs/app.log | grep GameTraining
```

### Problema: Parámetros no cambian

**Síntema:** Versión incrementada pero parámetros idénticos

**Causa:** Suavizado exponencial demasiado fuerte (α muy bajo)

**Solución:** Aumentar α en `game_training_service.py:410`
```python
alpha = 0.5  # En lugar de 0.3
```

### Problema: IA gana siempre

**Síntoma:** `win_rate_vs_players: 0.95`

**Causa:** Entrenamiento sobreajustó a jugadores expertos

**Solución:**
1. Rollback a versión anterior
2. Aumentar `base_error` manualmente
3. Entrenar con partidas de jugadores de todos los niveles

---

## Changelog

### v2.0.0 (2025-12-27)

- Nuevo sistema de entrenamiento offline
- Integración con Ollama para análisis profundo
- Suavizado exponencial para cambios graduales
- Sistema de versionado y rollback
- Documentación completa de prompts y parsers
