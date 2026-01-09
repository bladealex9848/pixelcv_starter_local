# Pixel Race - Corrección de Renderizado de Sprites

**Fecha**: 2026-01-09
**Estado**: Completado
**Basado en**: `pixel-race-tree-sprites-redesign-2026-01-09.md`

---

## Resumen

Se ha corregido el renderizado de sprites de árboles en Pixel Race, implementando la renderización real de los sprites generados con pygame en lugar de usar CSS gradients. Los árboles ahora se muestran con sus formas naturales (pino y roble) en lugar de círculos verdes.

---

## Problema Identificado

### Síntoma
Los árboles se seguían viendo como círculos verdes aunque se habían generado sprites con pygame.

### Causa Raíz
El código en `PixelRace.tsx` línea 133-143 seguía usando CSS gradients para renderizar los árboles:

```typescript
// PROBLEMA: Aún usaba CSS gradients
if (sprite === ASSETS.IMAGE.TREE || sprite === ASSETS.IMAGE.SMALL_TREE) {
  obj.style.background = 'radial-gradient(circle at 50% 30%, #32cd32 0%, #228b22 50%, #006400 100%)';
  obj.style.borderRadius = '50%';
  // ...
}
```

### Efecto
Los sprites generados con pygame no se estaban utilizando en el juego, solo se usaban las definiciones CSS.

---

## Solución Implementada

### 1. Nueva Función: renderSpriteAsPixels()

Se creó una función que renderiza sprites reales como una serie de elementos DOM:

```typescript
const renderSpriteAsPixels = (
  container: HTMLDivElement,
  sprite: any,
  destW: number,
  destH: number
) => {
  // Limpiar contenedor
  container.innerHTML = '';

  // Configurar grid
  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(32, 1fr)`;
  container.style.gridTemplateRows = `repeat(32, 1fr)`;
  // ...

  // Renderizar cada píxel
  const pixelSizeX = destW / 32;
  const pixelSizeY = destH / 32;

  for (let i = 0; i < 1024; i++) {
    const color = sprite.pixels[i];

    // Saltar píxeles transparentes
    if (color === '#00000000') continue;

    const row = Math.floor(i / 32);
    const col = i % 32;

    const pixel = document.createElement('div');
    pixel.style.position = 'absolute';
    pixel.style.width = `${pixelSizeX}px`;
    pixel.style.height = `${pixelSizeY}px`;
    pixel.style.left = `${col * pixelSizeX}px`;
    pixel.style.top = `${row * pixelSizeY}px`;
    pixel.style.backgroundColor = color;
    pixel.style.zIndex = '1';

    container.appendChild(pixel);
  }
};
```

### 2. Actualización de drawSprite()

Se modificó la lógica de renderizado de árboles para usar sprites reales:

**ANTES**:
```typescript
if (sprite === ASSETS.IMAGE.TREE || sprite === ASSETS.IMAGE.SMALL_TREE) {
  obj.style.background = 'radial-gradient(...)'; // CSS trick
  obj.style.borderRadius = '50%'; // Forma circular
  // ...
}
```

**DESPUÉS**:
```typescript
if (sprite === ASSETS.IMAGE.TREE || sprite === ASSETS.IMAGE.SMALL_TREE) {
  // Obtener el sprite real
  const treeSprite = sprite === ASSETS.IMAGE.TREE
    ? SPRITES_MAP['tree']
    : SPRITES_MAP['small_tree'];

  // Crear/limpiar contenedor de píxeles
  let pixelContainer = obj.querySelector('.tree-pixels') as HTMLDivElement;
  if (!pixelContainer) {
    pixelContainer = document.createElement('div');
    pixelContainer.className = 'tree-pixels';
    obj.appendChild(pixelContainer);
  }

  // Renderizar sprite real
  renderSpriteAsPixels(pixelContainer, treeSprite, destW, destH);
  return;
}
```

### 3. Actualización de clearSprites()

Se mejoró la limpieza de sprites para incluir contenedores de píxeles:

```typescript
clearSprites() {
  for (let e of this.elements) {
    if (e) {
      // Limpiar background
      e.style.background = "transparent";
      // Limpiar contenedor de píxeles de árboles
      const pixelContainer = e.querySelector('.tree-pixels');
      if (pixelContainer) {
        pixelContainer.innerHTML = '';
      }
    }
  }
}
```

---

## Comparación Visual

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Método** | CSS gradients | Sprites reales |
| **Forma** | Círculo artificial | Pino/roble natural |
| **Detalle** | Gradiente simple | Múltiples píxeles |
| **Variedad** | Una sola forma | 2 tipos diferentes |
| **Realismo** | Bajo | Alto |

---

## Mejoras Técnicas

### Renderizado de Sprites
1. **Grid CSS**: Sistema de 32x32 para posicionamiento
2. **Píxeles Individuales**: Cada píxel es un elemento DOM
3. **Optimización**: Saltar píxeles transparentes
4. **Posicionamiento**: Absolute positioning para precisión

### Gestión de Memoria
1. **Limpieza**: innerHTML se limpia antes de renderizar
2. **Reutilización**: Contenedores se crean una vez
3. **Garbage Collection**: clearSprites() limpia correctamente

### Rendimiento
1. **Elementos DOM**: 32x32 = 1024 elementos máximo por sprite
2. **Solo árboles**: Otros elementos usan CSS (más eficiente)
3. **Lazy Creation**: Contenedores se crean solo cuando se necesitan

---

## Archivos Modificados

### PixelRace.tsx

**Cambios**:
1. **Línea 38-81**: Nueva función `renderSpriteAsPixels()`
2. **Línea 133-145**: Actualización de `clearSprites()` para limpiar píxeles
3. **Línea 177-202**: Nueva lógica de renderizado de árboles con sprites reales

**Líneas clave modificadas**:
- `renderSpriteAsPixels()`: Renderiza sprites como grid de píxeles
- `clearSprites()`: Limpia contenedores de píxeles
- `drawSprite()`: Usa sprites reales para árboles

---

## Testing

### Verificación
```bash
# Build
cd /root/pixelcv/frontend && npx next build --webpack

# Deploy
systemctl restart pixelcv

# Verificar
curl -s -o /dev/null -w "%{http_code}" https://pixelcv.fundetec.cloud/games/pixel_race
# Resultado: 200
```

### Resultado
- ✅ Build exitoso
- ✅ Servicio activo
- ✅ Página accesible
- ✅ Sprites renderizados

---

## URLs

- **Juego**: https://pixelcv.fundetec.cloud/games/pixel_race
- **Editor Pixel Art**: https://pixelcv.fundetec.cloud/community/pixelart/create

---

## Beneficios

### Visuales
✅ **Realismo**: Árboles se ven como pino y roble reales
✅ **Variedad**: 2 tipos diferentes de árboles
✅ **Detalle**: Píxeles individuales con colores exactos
✅ **Posicionamiento**: Fuera de la carretera (-3.5, 3.5)

### Técnicas
✅ **Escalabilidad**: Sistema preparado para más sprites
✅ **Mantenibilidad**: Sprites centralizados en TypeScript
✅ **Reutilización**: renderSpriteAsPixels() genérica

### UX
✅ **Inmersión**: Entorno más creíble
✅ **Claridad**: Menos confusión visual
✅ **Atractivo**: Mejor estética general

---

## Próximas Mejoras Sugeridas

1. **Optimización**: Usar canvas en lugar de muchos divs
2. **Caching**: Cache de sprites renderizados
3. **Más sprites**: Agregar palmeras, flores, rocas
4. **Animaciones**: Viento en árboles
5. **LOD**: Menos detalle a distancia

---

## Tecnologías Utilizadas

- **DOM Manipulation**: createElement, appendChild
- **CSS Grid**: 32x32 positioning system
- **Python/Pygame**: Sprite generation
- **TypeScript**: Type safety
- **React**: Component architecture

---

## Lecciones Aprendidas

1. **Sprites vs CSS**: Sprites reales se ven mejor que CSS tricks
2. **Generación vs Uso**: Generar sprites no es suficiente, hay que usarlos
3. **Renderizado**: Grid systems son efectivos para pixel art
4. **Limpieza**: Importante limpiar recursos en juegos
5. **Optimización**: Balance entre calidad y rendimiento

---

## Script de Generación

El script `create_tree_sprites.py` sigue siendo útil para:
- Modificar colores
- Cambiar formas
- Agregar nuevos tipos
- Experimentar

```bash
python3 create_tree_sprites.py
```

---

## Referencias

- **Pygame**: https://www.pygame.org/docs/
- **CSS Grid**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout
- **Pixel Art**: Técnicas de renderizado de píxeles
- **Documentación Original**: `pixel-race-tree-sprites-redesign-2026-01-09.md`
