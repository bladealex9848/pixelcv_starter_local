# Pixel Race - Nuevo Juego de Carreras 3D Retro

**Fecha**: 2026-01-09
**Estado**: Completado y funcional
**Categoría**: Arcade / Racing

---

## Resumen

Se ha implementado un nuevo juego de carreras 3D pseudo-matemático llamado **Pixel Race**, inspirado en el juego clásico `race_car` de GameZone, adaptado al ecosistema PixelCV con estética retro y gamificación integrada.

---

## Características del Juego

### Mecánicas Principales
- **Renderizado 3D pseudo-matemático**: Proyección perspectiva sin usar Canvas 3D, solo matemática pura
- **3 carriles**: Izquierda, centro y derecha con cambio de carril suave
- **3 coches enemigos**: Cambian de carril aleatoriamente y actúan como obstáculos móviles
- **Sistema de colisiones**: Chocar con un enemigo reduce drásticamente la velocidad
- **Física arcade**: Aceleración, frenado y desaceleración gradual

### Controles
| Tecla | Acción |
|-------|--------|
| ↑ / W | Acelerar |
| ↓ / S | Frenar |
| ← / A | Carril izquierdo |
| → / D | Carril derecho |
| P | Pausa |
| ESC | Salir / Rendirse |

### HUD (Head-Up Display)
- **SPEED**: Velocidad actual (0-120 km/h)
- **TIME**: Tiempo transcurrido en formato MM:SS
- **POS**: Posición en la carrera (1-4)
- **Indicador de carril**: Muestra visualmente el carril actual

---

## Implementación Técnica

### Archivo: `frontend/components/games/PixelRace.tsx`

#### Constantes del Juego
```typescript
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const ROAD_WIDTH = 2000;
const SEGMENT_LENGTH = 200;
const CAMERA_DEPTH = 0.84;
const LANES = [-0.7, 0, 0.7]; // Izquierda, Centro, Derecha
const MAX_SPEED = 120;
const ACCELERATION = 30;
const BRAKING = -50;
const DECELERATION = -15;
const ENEMY_SPEED = 25;
```

#### Proyección 3D
El núcleo del renderizado es la función `project()` que transforma coordenadas 3D a 2D:

```typescript
const project = (worldX: number, worldY: number, worldZ: number) => {
  const cameraZ = playerZRef.current;
  const scale = CAMERA_DEPTH / (worldZ - cameraZ);
  const screenX = (CANVAS_WIDTH / 2) + (scale * worldX * CANVAS_WIDTH / 2);
  const screenY = (CANVAS_HEIGHT / 2) - (scale * worldY * CANVAS_HEIGHT / 2);
  const screenW = scale * ROAD_WIDTH * CANVAS_WIDTH / 2;
  return { screenX, screenY, screenW, scale };
};
```

#### Dibujo de Trapezoides
Para dibujar la carretera en perspectiva, se usa una función auxiliar:

```typescript
const drawTrapezoid = (ctx: CanvasRenderingContext2D, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) => {
  ctx.beginPath();
  ctx.moveTo(x1 - w1 / 2, y1);
  ctx.lineTo(x1 + w1 / 2, y1);
  ctx.lineTo(x2 + w2 / 2, y2);
  ctx.lineTo(x2 - w2 / 2, y2);
  ctx.closePath();
  ctx.fill();
};
```

---

## Sistema de Puntuación

### Cálculo de Puntos
```typescript
const score = 5 + (won ? 50 : 10) + Math.floor(distance / 100);
```

- **Base**: 5 puntos por jugar
- **Participación**: 10 puntos adicionales
- **Distancia**: 1 punto por cada 100 metros recorridos
- **Victoria**: 50 puntos bonus (cuando se implemente)

### Training Data
El juego recolecta datos para entrenamiento de IA:

```typescript
interface TrainingMove {
  timestamp: number;
  player_x: number;
  player_speed: number;
  player_lane: number;
  event_type?: 'lane_change' | 'accelerate' | 'decelerate' | 'collision' | 'checkpoint' | 'lap_complete';
}
```

Eventos registrados:
- Cambios de carril (manual y enemigos)
- Colisiones
- Timestamps para análisis de patrones

---

## Integración con PixelCV

### Backend
**Archivo**: `backend/app/services/gamification_service.py`

```python
{
    'id': 'pixel_race',
    'name': 'Pixel Race',
    'description': 'Carreras 3D retro - ¡Supera a tus oponentes!',
    'icon': '🏎️',
    'category': 'Racing',
    'has_ai': True,
    'multiplayer': False
}
```

### Frontend
**Archivo**: `frontend/app/games/[game]/page.tsx`

```typescript
const PixelRace = dynamic(() => import('../../../components/games/PixelRace'), { ssr: false });

// GAMES_CONFIG
pixel_race: {
  name: 'Pixel Race',
  icon: '🏎️',
  component: PixelRace
}
```

---

## Comparación con Juego de Referencia

### race_car (GameZone) vs Pixel Race (PixelCV)

| Característica | race_car | Pixel Race |
|----------------|----------|------------|
| Tecnología | JS vanilla + DOM | React + Canvas |
| Renderizado | Proyección matemática | Proyección matemática |
| Controles | Flechas | Flechas + WASD + Mobile (futuro) |
| Enemigos | Cambian de carril aleatorio | Cambian de carril aleatorio |
| Gráficos | PNG externos | Canvas dibujado programáticamente |
| Paleta | Original | Estilo PixelCV (naranja/teal) |
| Gamificación | No | Sí (puntos, training data) |

---

## Diferencias con Offroad4x4

| Característica | Offroad4x4 | Pixel Race |
|----------------|------------|------------|
| Estado | Under Construction | Funcional |
| Perspectiva | Top-down 2D | Pseudo-3D |
| Terreno | Cuadrícula con tipos | Carretera infinita |
| Objetivo | Checkpoints | Distancia / Carrera |
| Enemigos | No | 3 oponentes |
| Colisiones | Terreno (rocas) | Coches enemigos |

---

## Rutas y URLs

- **Listado**: https://pixelcv.fundetec.cloud/games
- **Juego**: https://pixelcv.fundetec.cloud/games/pixel_race
- **API**: https://pixelcv.fundetec.cloud/api/games/list

---

## Próximas Mejoras Planeadas

1. **Sistema de vueltas**: Meta de vuelta y vuelta completa
2. **Carrera completa**: 3 vueltas para ganar
3. **Poderes temporales**: Turbo, escudo, misiles
4. **Más enemigos**: Aumentar dificultad progresivamente
5. **Controles táctiles**: Joystick virtual para móvil
6. **Multijugador**: Carreras contra otros jugadores
7. **Leaderboard**: Ranking de mejores tiempos

---

## Archivos Modificados

### Frontend
- `frontend/components/games/PixelRace.tsx` (CREADO)
- `frontend/app/games/[game]/page.tsx` (modificado)
- `frontend/app/games/page.tsx` (modificado - soporte under_construction, categorías Racing/Platformer)

### Backend
- `backend/app/services/gamification_service.py` (modificado)

---

## Notas de Desarrollo

### Problemas Resueltos
1. **Error `this.drawTrapezoid`**: Las funciones auxiliares deben definirse DENTRO del callback, no como métodos de clase
2. **Duplicación de código**: La función `drawTrapezoid` estaba duplicada, se eliminó la redundancia
3. **Orden de definición**: `drawTrapezoid` debe definirse ANTES de `drawSegment` que lo usa

### Lecciones Aprendidas
- En React functional components, NO usar `this` para funciones auxiliares
- Las funciones dentro de `useCallback` pueden acceder a variables del scope
- El orden de definición de funciones importa en JavaScript

---

## Referencias

- **Juego original**: `docs/game-repositories/gamezone/Games/race_car/`
- **Documentación Canvas 2D**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Proyección 3D**: Técnicas de rendering pseudo-3D usadas en juegos retro como OutRun
