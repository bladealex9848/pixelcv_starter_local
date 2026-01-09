# Pixel Race - Rediseño de Sprites de Árboles

**Fecha**: 2026-01-09
**Estado**: Completado
**Basado en**: `pixel-race-pixelart-visual-improvements-2026-01-09.md`

---

## Resumen

Se ha rediseñado completamente los sprites de árboles para Pixel Race utilizando **pygame**, creando sprites más realistas y naturales en lugar de círculos simples. Los árboles ahora tienen formas distintivas (pino y roble) y están correctamente posicionados fuera de la carretera.

---

## Problema Identificado

### Árboles Anteriores
- **Forma**: Círculos simples con `border-radius: 50%`
- **Posición**: Dentro de la carretera (offsets -2 y 1.3)
- **Aspecto**: Poco naturales, se ve como blobs verdes
- **Variedad**: Un solo tipo de árbol

### Causa
El renderizado anterior usaba CSS `border-radius` para simular árboles, lo cual generaba formas circulares artificiales. Además, los offsets de posicionamiento los colocaba demasiado cerca del centro de la carretera.

---

## Solución Implementada

### 1. Generación de Sprites con Pygame

Se creó un script Python (`create_tree_sprites.py`) para diseñar sprites de 32x32 píxeles con formas naturales:

#### Tipos de Árboles Generados

**Pine Tree (Árbol de Pino)**:
- Copa en capas (3 niveles) para efecto 3D
- Forma triangular característica
- Colores: Verde bosque (#228b22) con highlight lime (#32cd32)
- Tronco marrón (#654321)

**Oak Tree (Roble)**:
- Copa redondeada y densa
- Forma más wide (ancha)
- Colores: Olive drab (#6b8e23) con highlight sea green (#8fbc8f)
- Tronco más grueso

**Dead Tree (Árbol Muerto)**:
- Tronco con ramas
- Color marrón (#5c4b34)
- Para variedad en el entorno

#### Script de Generación
```python
def create_tree_sprite(tree_type):
    if tree_type == "pine":
        # Árbol de pino (conífero)
        base_color = (34, 139, 34)  # Forest Green
        highlight = (50, 205, 50)   # Lime Green
        # ... crear capas para efecto 3D
    elif tree_type == "oak":
        # Roble (árbol de hoja caduca)
        base_color = (107, 142, 35)   # Olive Drab
        highlight = (143, 188, 143)   # Dark Sea Green
        # ... crear copa redondeada
```

### 2. Integración en TypeScript

**Archivos Creados**:
- `tree_sprites_generated.ts`: Sprites en formato TypeScript
- `PixelRaceSprites.tsx`: Importa y usa los nuevos sprites

```typescript
// Importar sprites generados con pygame
import { TREE_SPRITES_DETAILED } from './tree_sprites_generated';

// Sprite: Árbol grande (Pine) - generado con pygame
export const createTreeSprite = (): Sprite => {
  return TREE_SPRITES_DETAILED.pine;
};

// Sprite: Árbol pequeño (Oak) - generado con pygame
export const createSmallTreeSprite = (): Sprite => {
  return TREE_SPRITES_DETAILED.oak;
};
```

### 3. Corrección de Posicionamiento

**Antes**:
```typescript
if (n % 10 === 0) l.drawSprite(level, 0, ASSETS.IMAGE.TREE, -2, width);
if ((n + 5) % 10 === 0) l.drawSprite(level, 0, ASSETS.IMAGE.TREE, 1.3, width);
```
- Offset -2 y 1.3: muy cerca del centro
- Mismo tipo de árbol (sin variedad)

**Después**:
```typescript
if (n % 10 === 0) l.drawSprite(level, 0, ASSETS.IMAGE.TREE, -3.5, width);
if ((n + 5) % 10 === 0) l.drawSprite(level, 0, ASSETS.IMAGE.SMALL_TREE, 3.5, width);
```
- Offset -3.5 y 3.5: fuera de la carretera
- Diferentes tipos de árboles para variedad visual

---

## Comparación Visual

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Forma** | Círculos CSS | Sprites pygame 32x32 |
| **Naturalidad** | Artificial (blob) | Natural (pino/roble) |
| **Variedad** | Un solo tipo | 2 tipos (pino, roble) |
| **Posición** | Dentro carretera | Fuera carretera |
| **Detalle** | Sin detalle | Capas, texturas, tronco |
| **Colores** | Verde simple | Gradientes naturales |

---

## Mejoras Técnicas

### Formato de Sprites
```typescript
{
  pine: {
    id: "pine_tree",
    name: "Pine Tree",
    pixels: ["#00000000", "#228b22", "#32cd32", ...], // 1024 elementos
    width: 32,
    height: 32
  },
  oak: { ... },
  dead: { ... }
}
```

### Renderizado CSS Mejorado
Los árboles ahora usan los sprites reales en lugar de CSS gradients:

```typescript
// ANTES: Gradiente CSS
obj.style.background = 'radial-gradient(circle at 50% 30%, #32cd32 0%, #228b22 50%, #006400 100%)';

// DESPUÉS: Sprite real de pygame
// Los sprites se renderizan usando PixelArtSprite component
```

---

## Proceso de Desarrollo

### 1. Instalación de Herramientas
```bash
pip install --break-system-packages pygame pillow numpy
```

### 2. Diseño de Sprites
- Creador Python con pygame
- Algoritmos para formas naturales
- Generación de 3 tipos de árboles
- Export a JSON/TypeScript

### 3. Integración
- Import en TypeScript
- Reemplazo en PixelRaceSprites.tsx
- Corrección de offsets en PixelRace.tsx

### 4. Testing
- Build exitoso
- Deploy en producción
- Verificación de posicionamiento

---

## Archivos Modificados

### Nuevos Archivos
1. **`create_tree_sprites.py`**: Script generador de sprites
2. **`tree_sprites_generated.ts`**: Sprites en TypeScript

### Archivos Modificados
1. **`PixelRaceSprites.tsx`**:
   - Import de TREE_SPRITES_DETAILED
   - Reemplazo de createTreeSprite() y createSmallTreeSprite()

2. **`PixelRace.tsx`**:
   - Corrección de offsets: -3.5 y 3.5
   - Variedad de tipos: TREE y SMALL_TREE

---

## Beneficios Logrados

### Visuales
✅ **Realismo**: Árboles naturales en lugar de círculos
✅ **Variedad**: 2 tipos diferentes (pino y roble)
✅ **Posicionamiento**: Fuera de la carretera
✅ **Detalle**: Capas, texturas, troncos visibles

### Técnicas
✅ **Escalabilidad**: Sistema preparado para más sprites
✅ **Eficiencia**: Sprites reutilizables
✅ **Mantenimiento**: Script Python para futuras modificaciones

### Experiencia de Usuario
✅ **Inmersión**: Entorno más creíble
✅ **Claridad**: Menos confusión visual
✅ **Atractivo**: Mejor estética general

---

## URLs

- **Juego**: https://pixelcv.fundetec.cloud/games/pixel_race
- **Editor Pixel Art**: https://pixelcv.fundetec.cloud/community/pixelart/create

---

## Próximas Mejoras Sugeridas

1. **Más Variedad**: Agregar más tipos de árboles (palma, sauces, etc.)
2. **Animaciones**: Animar movimiento de árboles con el viento
3. **Estaciones**: Diferentes sprites según época del año
4. **Collider**: Hacer que los árboles sean obstáculos reales
5. **Sonidos**: Efectos de audio para el bosque

---

## Tecnologías Utilizadas

- **Pygame**: Diseño de sprites 32x32
- **Python**: Generación algorítmica
- **TypeScript**: Integración en React
- **CSS**: Renderizado optimizado
- **Math.random()**: Variación natural en formas

---

## Lecciones Aprendidas

1. **Herramientas Especializadas**: Pygame es excelente para diseño pixel art
2. **CSS vs Sprites**: Sprites reales se ven más naturales que CSS tricks
3. **Posicionamiento Importante**: Los offsets afectan significativamente la jugabilidad
4. **Variedad Visual**: Diferentes tipos mejoran la experiencia
5. **Exportación**: JSON es fácil de convertir a TypeScript

---

## Script de Generación

El script `create_tree_sprites.py` puede reutilizarse para:
- Modificar colores existentes
- Agregar nuevos tipos de árboles
- Cambiar tamaños de sprite
- Experimentar con formas

**Uso**:
```bash
python3 create_tree_sprites.py
```

**Vista Previa** (con input()):
```bash
# Modificar el script para habilitar preview
# O usar: pygame.displaypreview_sprites(sprites)
```

---

## Referencias

- **Pygame Documentation**: https://www.pygame.org/docs/
- **Pixel Art Tutorial**: https://www.pygame.org/wiki/PixelArt
- **Sprites Base**: Generados desde cero para PixelCV
- **Documentación Original**: `pixel-race-pixelart-visual-improvements-2026-01-09.md`
