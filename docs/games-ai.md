# Juegos Arcade con IA

## Overview

PixelCV incluye una sección de **Games** con 8 juegos arcade retro gamificados que utilizan modelos de Ollama para mejorar la experiencia de juego.

## Arquitectura

### Backend

#### Servicio de IA para Juegos (`game_ai_service.py`)

Servicio que integra Ollama para generar movimientos de IA en tiempo real con fallback a algoritmos locales.

**Modelos utilizados (ordenados por velocidad):**
- `qwen3:0.6b` - Modelo más rápido (preferido para juegos)
- `qwen3:1.7b` - Modelo rápido
- `gemma3:1b` - Modelo compacto
- `granite3.3:2b` - Modelo por defecto del proyecto

**Configuración:**
```python
FAST_MODELS = ["qwen3:0.6b", "qwen3:1.7b", "gemma3:1b", "granite3.3:2b"]
GAME_AI_TIMEOUT = 2  # segundos para mantener el juego fluido
```

#### Endpoints de API (`routes_games.py`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/games/ai/move` | POST | Obtiene movimiento de IA para un juego |
| `/games/ai/status` | GET | Verifica disponibilidad de Ollama |

### Frontend

Los juegos que usan IA:
- **Pong** - IA controla la paleta del oponente
- **Tic Tac Toe** - IA juega como 'O' contra el jugador

#### Fallback Local

Si Ollama no está disponible o el timeout excede, los juegos usan algoritmos locales:
- **Pong**: Predicción de posición de pelota + aleatoriedad
- **Tic Tac Toe**: Algoritmo Minimax con 20% de aleatoriedad para hacerlo jugable

## Flujo de Datos

```
Frontend Game Component
    ↓ fetch
Backend API (/games/ai/move)
    ↓
game_ai_service.get_ollama_move()
    ↓
Ollama API (VPS)
    ↓ (timeout 2s)
Respuesta con movimiento
    ↓ (si falla)
Fallback local (algoritmo sin Ollama)
    ↓
Frontend renderiza movimiento
```

## Configuración

### Variables de Entorno

**Backend (`.env`):**
```bash
OLLAMA_BASE_URL=https://ollama.alexanderoviedofadul.dev/api
OLLAMA_DEFAULT_MODEL=granite3.3:2b
OLLAMA_TIMEOUT=60
```

**Frontend (`.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # local
# NEXT_PUBLIC_API_URL=https://pixelcv.alexanderoviedofadul.dev/api  # producción
```

## Uso

### Verificar estado de IA

```bash
curl https://pixelcv.alexanderoviedofadul.dev/api/games/ai/status
```

Respuesta:
```json
{
  "available": true,
  "message": "Ollama disponible"
}
```

### Obtener movimiento de IA

```bash
curl -X POST https://pixelcv.alexanderoviedofadul.dev/api/games/ai/move \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## Juegos Implementados

| Juego | Tipo de IA | Endpoint |
|-------|------------|----------|
| Pong | Predicción + ajuste | `game_type: "pong"` |
| Tic Tac Toe | Minimax mejorado | `game_type: "tictactoe"` |
| Memory Match | - (sin IA) | - |
| Snake | - (sin IA) | - |
| Breakout | - (sin IA) | - |
| 2048 | - (sin IA) | - |
| Tetris | - (sin IA) | - |
| Space Invaders | Patrón (sin IA) | - |

## Indicadores Visuales

Los juegos muestran el estado de IA:

- **🤖 AI Active** (verde): Ollama disponible y funcionando
- **🤖 Local AI** (gris): Usando algoritmo local (Ollama no disponible)

## Performance

- **Timeout**: 2 segundos por llamada a IA
- **Frecuencia de llamadas**: ~10% de los frames (Pong), por turno (Tic Tac Toe)
- **Prioridad**: Juego fluido > IA perfecta
- **Si Ollama es lento**: El juego usa automáticamente el fallback local sin interrupciones

## Troubleshooting

### Ollama no responde

Verificar:
```bash
curl https://ollama.alexanderoviedofadul.dev/api/tags
```

### Juegos usan solo IA local

Verificar el endpoint de estado:
```bash
curl https://pixelcv.alexanderoviedofadul.dev/api/games/ai/status
```

Si `available: false`, verificar que Ollama esté corriendo en el VPS.

## Archivos Modificados/Creados

### Backend
- `backend/app/services/game_ai_service.py` (NUEVO)
- `backend/app/api/routes_games.py` (ACTUALIZADO)

### Frontend
- `frontend/components/games/PongGame.tsx` (ACTUALIZADO)
- `frontend/components/games/TicTacToe.tsx` (ACTUALIZADO)
