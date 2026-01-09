# Offroad4x4 - Under Construction

**Fecha**: 2026-01-09
**Estado**: Under Construction 🚧
**Categoría**: Racing / Off-Road

---

## Resumen

El juego **4x4 Off-Road** ha sido marcado como "Under Construction" mientras se trabaja en una reescritura completa para ofrecer una experiencia de conducción off-road más realista y divertida.

---

## Razón del Estado Under Construction

El juego original tenía varios problemas críticos que afectaban la experiencia del usuario:

1. **Terreno regenerado cada frame**: El terreno se generaba en cada frame del game loop, causando colisiones inconsistentes y una experiencia frustrante
2. **Física poco realista**: La física del vehículo no respondía de manera intuitiva
3. **Falta de objetivos claros**: No había un sistema de progresión claro
4. **Problemas de rendimiento**: El juego consumía muchos recursos

Por estas razones, se tomó la decisión de reconstruir el juego desde cero en lugar de aplicar parches.

---

## Pantalla de Under Construction

Cuando el usuario accede al juego, ve una pantalla informativa que muestra:

### Mensaje Principal
> "Este juego de conducción off-road está siendo mejorado para ofrecerte una experiencia más realista y divertida."

### Mejoras en Desarrollo

| Estado | Característica | Descripción |
|--------|----------------|-------------|
| ⏳ Pendiente | **Física realista** | Sistema de suspensión y transmisión 4x4 auténtica |
| ⏳ Pendiente | **Terreno procedimental** | Generación infinita de paisajes variados |
| ⏳ Pendiente | **Clima dinámico** | Lluvia, barro, niebla que afectan la conducción |
| ⏳ Pendiente | **Múltiples vehículos** | Camionetas, buggies y ATVs con características únicas |
| ⏳ Pendiente | **Modos de juego** | Carrera contrarreloj, libre y desafíos |
| ✓ En progreso | **Mejores gráficos** | Efectos de partículas, sombras dinámicas y lighting |
| ✓ En progreso | **Controles mejorados** | Soporte para gamepad y controles táctiles optimizados |

### Call to Action
La pantalla incluye un enlace directo a **Pixel Race**, el juego de carreras 3D retro que SÍ está funcional:

```
🏎️ Jugar Pixel Race
```

### Fecha Estimada
```
Estimado: Q1 2026
```

---

## Implementación

### Cambios en el Componente

**Archivo**: `frontend/components/games/OffRoad4x4.tsx`

```typescript
// Estado agregado
const [gameStatus, setGameStatus] = useState<'construction' | 'menu' | 'playing' | 'paused' | 'ended'>('construction');
```

### Pantalla de Construcción

```tsx
{gameStatus === 'construction' && (
  <div className="text-center space-y-6 p-8 bg-orange-900/10 border-2 border-orange-500/30 rounded-lg max-w-2xl">
    {/* Icono y título */}
    <div className="flex items-center justify-center gap-4 mb-4">
      <div className="text-6xl">🚙</div>
      <div className="text-5xl animate-pulse">🚧</div>
    </div>

    <h2 className="text-3xl font-black text-orange-400 uppercase tracking-widest italic">
      4x4 Off-Road
    </h2>

    {/* Badge de construcción */}
    <div className="flex items-center justify-center gap-2 bg-yellow-900/30 border border-yellow-500/50 px-4 py-2 rounded-sm">
      <span className="text-2xl animate-pulse">🚧</span>
      <span className="text-yellow-400 font-bold uppercase text-sm">Under Construction</span>
    </div>

    {/* ... lista de mejoras ... */}

    {/* Link a Pixel Race */}
    <a href="/games/pixel_race" className="...">
      <span>🏎️</span>
      <span>Jugar Pixel Race</span>
    </a>
  </div>
)}
```

---

## Backend

### Configuración del Juego

**Archivo**: `backend/app/services/gamification_service.py`

```python
{
    'id': 'offroad4x4',
    'name': '4x4 Off-Road',
    'description': 'Completa el circuito evitando obstáculos',
    'icon': '🚙',
    'category': 'Racing',
    'has_ai': True,
    'multiplayer': False,
    'under_construction': True  # ← Marca el juego como en construcción
}
```

---

## Frontend

### Configuración de Rutas

**Archivo**: `frontend/app/games/[game]/page.tsx`

```typescript
offroad4x4: {
  name: '4x4 Off-Road',
  icon: '🚙',
  underConstruction: true,  // ← Muestra badge en la página
  component: OffRoad4x4
}
```

### Badge en la Página del Juego

```tsx
{gameConfig.underConstruction && (
  <div className="flex items-center gap-1 bg-yellow-900/30 border border-yellow-500/50 px-2 py-1 rounded-sm animate-pulse">
    <span className="text-yellow-400 text-xs font-bold">🚧 UNDER CONSTRUCTION</span>
  </div>
)}
```

### Badge en la Tarjeta del Listado

**Archivo**: `frontend/app/games/page.tsx`

```tsx
{game.under_construction && (
  <div className="absolute -top-2 -right-2 z-20">
    <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 border-2 border-yellow-400 rounded-sm shadow-[0_0_15px_rgba(250,204,21,0.6)] transform rotate-3 animate-pulse">
      🚧 UNDER CONSTRUCTION
    </div>
  </div>
)}
```

---

## URL y Accesos

- **Página del juego**: https://pixelcv.fundetec.cloud/games/offroad4x4
- **Listado de juegos**: https://pixelcv.fundetec.cloud/games
- **API**: https://pixelcv.fundetec.cloud/api/games/list

---

## Alternativa Mientras Tanto

Mientras Offroad4x4 está en reconstrucción, los usuarios pueden disfrutar de:

### Pixel Race 🏎️
- **URL**: https://pixelcv.fundetec.cloud/games/pixel_race
- **Estado**: Funcional
- **Características**:
  - Carreras 3D retro
  - 3 carriles con cambios suaves
  - 3 oponentes con IA
  - Sistema de colisiones
  - HUD completo con velocidad, tiempo y posición

---

## Archivos Modificados

### Frontend
- `frontend/components/games/OffRoad4x4.tsx` (modificado - pantalla de construcción)
- `frontend/app/games/[game]/page.tsx` (modificado - soporte underConstruction)
- `frontend/app/games/page.tsx` (modificado - badge under_construction)

### Backend
- `backend/app/services/gamification_service.py` (modificado - under_construction flag)

### Documentación
- `docs/development/offroad4x4-under-construction-2026-01-09.md` (este archivo)

---

## Próximos Pasos

1. **Diseñar nueva arquitectura**: Definir cómo será el nuevo Offroad4x4
2. **Implementar física realista**: Sistema de suspensión, fricción, tracción
3. **Generación de terreno**: Algoritmos procedimentales para terrenos variados
4. **Sistema de clima**: Lluvia, barro, niebla con efectos en la conducción
5. **Múltiples vehículos**: Diferentes tipos con características únicas
6. **Modos de juego**: Carrera, libre, desafíos

---

## Referencias

- **Plan original**: `/root/.claude/plans/playful-roaming-pretzel.md`
- **Documentación Pixel Race**: `docs/development/pixel-race-implementation-2026-01-09.md`
