# Referencia de API - Sistema de Juegos con IA Offline

## Overview

Documentación completa de los endpoints del sistema de juegos arcade con IA offline para PixelCV.

**Base URL:** `http://localhost:8000` (local) o `https://pixelcv.alexanderoviedofadul.dev/api` (producción)

---

## Endpoints Públicos

### 1. Lista de Juegos

Retorna la lista de juegos disponibles con sus configuraciones.

```http
GET /games/list
```

**Respuesta:**
```json
{
  "games": [
    {
      "id": "pong",
      "name": "Pong",
      "description": "El clásico juego de ping pong arcade",
      "icon": "🏓",
      "category": "Arcade",
      "has_ai": true,
      "multiplayer": false
    },
    {
      "id": "tictactoe",
      "name": "Tic Tac Toe",
      "description": "El clásico juego de 3 en raya contra la IA",
      "icon": "⭕",
      "category": "Estrategia",
      "has_ai": true,
      "multiplayer": false
    }
    // ... más juegos
  ],
  "total": 8
}
```

---

### 2. Leaderboard de un Juego

Retorna el ranking de un juego específico.

```http
GET /games/leaderboard/{game_id}?limit=50
```

**Parámetros:**
- `game_id` (path): ID del juego (`pong`, `tictactoe`, etc.)
- `limit` (query, opcional): Cantidad de resultados (default: 50, max: 100)

**Respuesta:**
```json
{
  "game_id": "pong",
  "game_name": "Pong",
  "game_icon": "🏓",
  "leaderboard": [
    {
      "user_id": "user_123",
      "username": "player1",
      "full_name": "Player One",
      "avatar_url": "https://...",
      "level": 3,
      "rank_title": "Maestro",
      "score": 25,
      "won": true,
      "moves": 0,
      "time_seconds": 180,
      "created_at": "2025-12-27T14:30:00"
    }
  ],
  "total": 1
}
```

---

### 3. Estado de IA (Información)

Verifica el estado del servicio de Ollama (solo informativo).

```http
GET /games/ai/status
```

**Respuesta:**
```json
{
  "available": true,
  "message": "Ollama disponible"
}
```

**Nota:** Este endpoint es solo informativo. El juego usa algoritmos locales independientemente del estado de Ollama.

---

### 4. Obtener Parámetros Activos de IA

Retorna los parámetros activos para un juego y dificultad específicos.

```http
GET /games/ai/parameters/{game_id}/{difficulty}
```

**Parámetros:**
- `game_id` (path): ID del juego (`pong`, `tictactoe`)
- `difficulty` (path): Dificultad (`easy`, `medium`, `hard`, `expert`)

**Respuesta:**
```json
{
  "game_id": "pong",
  "difficulty": "medium",
  "parameters": {
    "base_error": 20.0,
    "reaction_delay_chance": 0.05,
    "max_bounces": 2,
    "paddle_speed": 6.0,
    "strategy": "balanced",
    "difficulty_multiplier": 1.0
  }
}
```

---

### 5. Historial de Versiones de Parámetros

Retorna el historial de versiones de parámetros para un juego.

```http
GET /games/ai/parameters/history/{game_id}?difficulty=medium&limit=20
```

**Parámetros:**
- `game_id` (path): ID del juego
- `difficulty` (query): Dificultad (default: `medium`)
- `limit` (query, opcional): Cantidad de versiones (default: 20, max: 100)

**Respuesta:**
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
      "parameters": {
        "base_error": 20.0,
        "reaction_delay_chance": 0.05,
        "max_bounces": 2
      },
      "change_reason": "ai_trained",
      "created_at": "2025-12-27T10:15:00"
    }
  ],
  "total": 2
}
```

---

### 6. Estadísticas de Entrenamiento

Retorna estadísticas de datos de entrenamiento recolectados.

```http
GET /games/ai/training/stats?game_id=pong
```

**Parámetros:**
- `game_id` (query, opcional): Filtrar por juego específico. Si se omite, retorna stats de todos los juegos.

**Respuesta:**
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

---

## Endpoints Requieren Autenticación

### 7. Enviar Resultado de Juego

Registra el resultado de un juego y calcula puntos.

```http
POST /games/submit
Authorization: Bearer <token>
```

**Body:**
```json
{
  "game_id": "pong",
  "score": 25,
  "won": true,
  "moves": 0,
  "time_seconds": 180,
  "game_data": {
    "opponent_score": 3,
    "training_data": {
      "game_id": "pong",
      "moves_sequence": [
        {
          "timestamp": 1500,
          "ball_x": 450.5,
          "ball_y": 230.2,
          "ball_vx": 5.8,
          "ball_vy": -2.1,
          "player_paddle_y": 180.0,
          "opponent_paddle_y": 200.5,
          "rally_count": 3,
          "event_type": "paddle_hit"
        }
      ],
      "final_board_state": {
        "final_score": 5,
        "opponent_score": 3,
        "total_rallies": 25
      },
      "critical_moments": [...],
      "player_won": true
    }
  }
}
```

**Respuesta (Éxito):**
```json
{
  "success": true,
  "points_earned": 80,
  "session_id": 123,
  "message": "¡Juego registrado! Ganaste 80 puntos",
  "achievements": []
}
```

**Respuesta (Demo Mode - sin autenticación):**
```json
{
  "success": true,
  "points_earned": 0,
  "session_id": 124,
  "message": "Demo mode: Juego registrado sin puntos. ¡Regístrate para competir!",
  "achievements": []
}
```

**Cálculo de Puntos:**
| Componente | Puntos | Descripción |
|-----------|--------|-------------|
| game_completed | 5 | Por jugar una partida |
| game_won | 50 | Por ganar (si aplica) |
| game_lost | 10 | Por perder (consolación) |
| game_score_pong | 1 × rallies | Por rendimiento (Pong) |
| game_score_tictactoe | 0 | Sin puntos por rendimiento |
| game_score_snake | 1 × manzanas | Por rendimiento (Snake) |
| Achievements | Variable | Por logros especiales |

**Ejemplo Pong (ganar con 20 rallies):**
- game_completed: 5
- game_won: 50
- game_score_pong: 20 × 1 = 20
- **Total: 75 puntos**

---

### 8. Puntuaciones del Usuario Actual

Retorna las mejores puntuaciones del usuario autenticado en cada juego.

```http
GET /games/my-scores
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "scores": [
    {
      "game_id": "pong",
      "game_name": "Pong",
      "game_icon": "🏓",
      "best_score": 25,
      "won": true,
      "moves": 0,
      "time_seconds": 180,
      "points_earned": 75,
      "played_at": "2025-12-27T14:30:00"
    },
    {
      "game_id": "tictactoe",
      "game_name": "Tic Tac Toe",
      "game_icon": "⭕",
      "best_score": 0,
      "won": true,
      "moves": 7,
      "time_seconds": 45,
      "points_earned": 55,
      "played_at": "2025-12-27T12:15:00"
    }
  ],
  "total": 2
}
```

---

### 9. Entrenar IA (Admin)

Ejecuta entrenamiento offline de parámetros de IA.

```http
POST /games/ai/train?game_id=pong&difficulty=medium&batch_size=50
Authorization: Bearer <token>
```

**Parámetros Query:**
- `game_id` (requerido): ID del juego a entrenar
- `difficulty` (opcional): Dificultad a entrenar (default: `medium`)
- `batch_size` (opcional): Cantidad de partidas a analizar (default: 50, max: 100)

**Respuesta (Éxito):**
```json
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
  "version": 3,
  "message": "Entrenamiento completado con 50 partidas analizadas"
}
```

**Respuesta (Datos insuficientes):**
```json
{
  "status": "insufficient_data",
  "count": 5,
  "message": "Se necesitan al menos 10 partidas, hay 5"
}
```

**Tiempo de respuesta:** 2-5 minutos (proceso offline)

---

### 10. Inicializar Parámetros (Admin)

Inicializa parámetros por defecto para todos los juegos.

```http
POST /games/ai/parameters/initialize
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Parámetros inicializados: 8 totales (8 nuevos, 0 actualizados)",
  "total": 8,
  "created": 8,
  "updated": 0
}
```

**Nota:** Debe ejecutarse al iniciar el sistema o cuando se agregan nuevos juegos.

---

## Endpoints Deprecated

### 11. Obtener Movimiento de IA (Deprecated)

⚠️ **DEPRECATED:** Este endpoint será removido en futuras versiones. Usa `GameAlgorithmService` directamente en el frontend para latencia cero.

```http
POST /games/ai/move
```

**Body:**
```json
{
  "game_type": "pong",
  "game_state": {
    "ball_x": 400,
    "ball_y": 250,
    "ball_vx": 5,
    "ball_vy": 3,
    "paddle_y": 200,
    "paddle_height": 100,
    "canvas_height": 500
  }
}
```

**Respuesta:**
```json
{
  "move": {
    "target_y": 215.5
  },
  "using_fallback": false,
  "message": "⚠️ DEPRECATED: Movimiento calculado con IA",
  "deprecated_warning": "Este endpoint será removido. Usa algoritmos locales en el frontend."
}
```

**Migración:**
- **Frontend:** Usar `GameAlgorithmService.get_<game>_move()` localmente
- **Latencia:** <1ms (local) vs 5-10s (HTTP + Ollama)

---

## Códigos de Error

| Código HTTP | Descripción |
|-------------|-------------|
| 200 | Éxito |
| 400 | Juego inválido o parámetros incorrectos |
| 401 | No autenticado |
| 403 | Solo admin (para endpoints de entrenamiento) |
| 500 | Error interno del servidor |

---

## Ejemplos de Uso

### cURL

#### Lista de juegos:
```bash
curl http://localhost:8000/games/list
```

#### Enviar resultado:
```bash
curl -X POST http://localhost:8000/games/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "game_id": "pong",
    "score": 25,
    "won": true,
    "moves": 0,
    "time_seconds": 180,
    "game_data": {"opponent_score": 3}
  }'
```

#### Entrenar IA:
```bash
curl -X POST "http://localhost:8000/games/ai/train?game_id=pong&batch_size=50" \
  -H "Authorization: Bearer <token>"
```

### JavaScript/TypeScript

```typescript
// Enviar resultado
const response = await fetch(`${API_URL}/games/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    game_id: 'pong',
    score: 25,
    won: true,
    moves: 0,
    time_seconds: 180,
    game_data: {
      opponent_score: 3,
      training_data: {...}
    },
  }),
});

const data = await response.json();
console.log(`+${data.points_earned} puntos ganados!`);
```

### Python

```python
import requests

# Enviar resultado
response = requests.post(
    f"{API_URL}/games/submit",
    json={
        "game_id": "pong",
        "score": 25,
        "won": True,
        "moves": 0,
        "time_seconds": 180,
        "game_data": {"opponent_score": 3}
    },
    headers={"Authorization": f"Bearer {token}"}
)

data = response.json()
print(f"+{data['points_earned']} puntos ganados!")
```

---

## Changelog

### v2.0.0 (2025-12-27)

- **Agregado:** `POST /games/ai/train` - Entrenamiento offline
- **Agregado:** `GET /games/ai/parameters/{game_id}/{difficulty}` - Obtener parámetros activos
- **Agregado:** `GET /games/ai/parameters/history/{game_id}` - Historial de versiones
- **Agregado:** `GET /games/ai/training/stats` - Estadísticas de entrenamiento
- **Agregado:** `POST /games/ai/parameters/initialize` - Inicializar parámetros
- **Modificado:** `POST /games/submit` - Ahora acepta `training_data`
- **Deprecated:** `POST /games/ai/move` - Usar algoritmos locales en su lugar
- **Fix:** `session.points_earned` ahora incluye puntos por rendimiento

### v1.0.0 (2025-12-20)

- Endpoints iniciales
- Sistema de puntos básico
- Leaderboards
