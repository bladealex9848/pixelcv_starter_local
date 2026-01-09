# Pixel Race - Juego de Carreras 3D Retro (Réplica race_car)

**Fecha**: 2026-01-09
**Estado**: Completado y funcional
**Categoría**: Arcade / Racing
**Basado en**: `docs/game-repositories/gamezone/Games/race_car`

---

## Resumen

Se ha implementado **Pixel Race**, una réplica exacta del juego clásico `race_car` de GameZone, adaptado al ecosistema PixelCV. El juego utiliza renderizado pseudo-3D basado en DOM con elementos HTML y CSS clip-path para crear trapezoides que simulan profundidad.

---

## Características del Juego

### Mecánicas Principales
- **Renderizado 3D pseudo-matemático**: Proyección perspectiva usando elementos DOM con clip-path
- **Carretera infinita**: Generación procedimental de mapas con curvas y colinas
- **7 coches enemigos**: Cambian de carril aleatoriamente (LANE.A=-2.3, LANE.B=-0.5, LANE.C=1.2)
- **Sistema de colisiones**: Chocar con un enemigo reduce drásticamente la velocidad a 20
- **Física arcade**: Aceleración, frenado y desaceleración gradual
- **Meta de llegada**: Línea de meta con "FINISH" al completar el mapa

### Controles
| Tecla | Acción |
|-------|--------|
| C | Iniciar juego (con cuenta regresiva 3-2-1) |
| ↑ | Acelerar |
| ↓ | Frenar |
| ← → | Girar izquierda/derecha |
| ESC | Resetear juego |

### HUD (Head-Up Display)
- **Tiempo superior izquierdo**: Cuenta regresiva para llegar a la meta
- **Puntuación superior central**: Distancia recorrida
- **Tiempo de vuelta**: Formato MM'SS"mmm (minutos, segundos, milisegundos)
- **Velocímetro**: Esquina inferior derecha
- **Highscore**: Mejores tiempos registrados

---

## Implementación Técnica

### Archivo: `frontend/components/games/PixelRace.tsx`

#### Constantes del Juego
```typescript
const width = 800;
const halfWidth = width / 2;
const height = 500;
const roadW = 4000;
const segL = 200;
const H = 1500;
const N = 70;
const maxSpeed = 200;
const accel = 38;
const breaking = -80;
const decel = -40;
const enemy_speed = 8;
const hitSpeed = 20;
```

#### Clases: Line y Car

**Line Class** - Representa un segmento de la carretera:
```typescript
class Line {
  x = 0; y = 0; z = 0;      // Coordenadas 3D del mundo
  X = 0; Y = 0; W = 0;      // Coordenadas 2D proyectadas
  curve = 0; scale = 0;     // Curvatura y escala
  elements: HTMLElement[] = []; // Elementos DOM para renderizar
  special: any = null;       // Sprite especial (meta, árbol, etc.)

  project(camX, camY, camZ, halfWidth, height, roadW) {
    this.scale = 0.2 / (this.z - camZ);
    this.X = (1 + this.scale * (this.x - camX)) * halfWidth;
    this.Y = Math.ceil(((1 - this.scale * (this.y - camY)) * height) / 2);
    this.W = this.scale * roadW * halfWidth;
  }
}
```

**Car Class** - Representa un coche enemigo:
```typescript
class Car {
  pos: number;       // Posición en la carretera
  type: any;         // Tipo de sprite
  lane: number;      // Carril actual (LANE.A, LANE.B, LANE.C)
  element: HTMLElement; // Elemento DOM
}
```

#### Generación Procedimental de Mapas
```typescript
const genMap = () => {
  let map: any[] = [];
  let i = 0;

  // Generar secciones aleatorias hasta mapLength
  for (; i < mapLength; i += getRand(0, 50)) {
    let section = { from: i, to: (i = i + getRand(300, 600)) };
    let randHeight = getRand(-5, 5);
    let randCurve = getRand(5, 30) * (Math.random() >= 0.5 ? 1 : -1);

    // Asignar curva y altura según probabilidad
    if (Math.random() > 0.9)
      Object.assign(section, { curve: () => randCurve, height: () => randHeight });
    else if (Math.random() > 0.8)
      Object.assign(section, { curve: () => 0, height: (i) => Math.sin(i / randInterval) * 1000 });
    // ... más variaciones

    map.push(section);
  }

  // Sección final con meta
  map.push({ from: i, to: i + N, curve: () => 0, height: () => 0, special: ASSETS.IMAGE.FINISH });
  return map;
};
```

#### Función drawQuad - Renderizado de Trapezoides
```typescript
const drawQuad = (element: HTMLElement, layer: number, color: string,
  x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) => {

  element.style.zIndex = layer.toString();
  element.style.background = color;
  element.style.position = "absolute";
  element.style.top = y2 + "px";
  element.style.left = (x1 - w1 / 2 - w1) + "px";
  element.style.width = (w1 * 3) + "px";
  element.style.height = (y1 - y2) + "px";

  let leftOffset = w1 + x2 - x1 + Math.abs(w2 / 2 - w1 / 2);
  element.style.clipPath = `polygon(${leftOffset}px 0, ${leftOffset + w2}px 0, 66.66% 100%, 33.33% 100%)`;
};
```

**Insight**: El `clip-path` es clave para crear el efecto 3D. El polígono define 4 puntos que forman un trapecio, simularndo la perspectiva de la carretera.

---

## Sistema de Puntuación

### Cálculo de Puntos
```typescript
onGameEnd(
  Math.floor(scoreValRef.current / 100),  // Puntos basados en distancia
  countDownRef.current > 0,                // Victoria si llegó antes del tiempo
  0,                                       // Moves (no usado en este juego)
  Math.floor((timestamp() - startRef.current) / 1000), // Tiempo en segundos
  { distance: scoreValRef.current, time: lap.innerText, highscores: highscoresRef.current }
);
```

### Training Data
Aunque el juego original no recolectaba datos, la integración con PixelCV permite:
```typescript
// Datos enviados al backend
gameData: {
  distance: number,
  time: string,
  highscores: string[]
}
```

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

pixel_race: {
  name: 'Pixel Race',
  icon: '🏎️',
  component: PixelRace
}
```

---

## Comparación con Juego Original

### race_car (GameZone) vs Pixel Race (PixelCV)

| Característica | race_car | Pixel Race |
|----------------|----------|------------|
| Tecnología | JS vanilla + DOM | React + DOM (refs) |
| Renderizado | Proyección matemática + clip-path | Proyección matemática + clip-path |
| Controles | Flechas + C | Flechas + C + ESC |
| Enemigos | 7 coches que cambian de carril | 7 coches que cambian de carril |
| Gráficos | PNG externos | CSS (colores sólidos) |
| Paleta | Original | Estilo PixelCV (naranja) |
| Gamificación | No | Sí (puntos, training data) |
| Highscore | Sí | Sí (integrado con sistema) |

---

## Diferencias con Offroad4x4

| Característica | Offroad4x4 | Pixel Race |
|----------------|------------|------------|
| Estado | Under Construction | Funcional |
| Perspectiva | Top-down 2D | Pseudo-3D |
| Terreno | Cuadrícula con tipos | Carretera infinita procedimental |
| Objetivo | Checkpoints | Llegar a la meta |
| Enemigos | No | 7 oponentes |
| Colisiones | Terreno (rocas) | Coches enemigos |

---

## Rutas y URLs

- **Listado**: https://pixelcv.fundetec.cloud/games
- **Juego**: https://pixelcv.fundetec.cloud/games/pixel_race
- **API**: https://pixelcv.fundetec.cloud/api/games/list

---

## Archivos Modificados

### Frontend
- `frontend/components/games/PixelRace.tsx` (REESCRITO COMPLETAMENTE)
  - Réplica exacta del juego race_car
  - Adaptado a React con hooks y refs
  - Renderizado DOM-based con clip-path

### Backend
- `backend/app/services/gamification_service.py` (previamente modificado)
  - Registro del juego pixel_race

---

## Notas de Desarrollo

### Problemas Resueltos TypeScript

1. **Number.prototype.clamp**: TypeScript no permite extender prototypes nativos
   - **Solución**: Crear función helper `clamp(value, min, max)`

2. **Number.prototype.pad**: Mismo problema con prototype
   - **Solución**: Crear función helper `pad(value, numZeros, char)`

3. **setTimeout().then()**: setTimeout retorna Timeout, no Promise
   - **Solución**: Usar async/await con `new Promise(resolve => setTimeout(resolve, 1000))`

4. **KEYS undefined**: Referencia a variable no declarada
   - **Solución**: Usar `(window as any).KEYS`

5. **drawQuad tipo HTMLDivElement**: Los elementos son HTMLElement
   - **Solución**: Cambiar tipo a `HTMLElement`

6. **tacho.innerText**: Espera string, se asignaba number
   - **Solución**: Convertir a string con `.toString()`

### Lecciones Aprendidas
- React requiere que las funciones auxiliares sean definidas como funciones standalone, no como extensiones de prototype
- Para adaptar JS vanilla a React: usar refs para variables globales y elementos DOM
- El clip-path CSS es poderoso para crear formas trapezoidales sin Canvas
- async/await es más limpio que encadenar promises para secuencias temporales

---

## Referencias

- **Juego original**: `docs/game-repositories/gamezone/Games/race_car/`
  - `script.js`: Lógica del juego original
  - `index.html`: Estructura HTML original
- **Proyección 3D**: Técnicas de rendering pseudo-3D usadas en juegos retro como OutRun
- **CSS clip-path**: https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path
