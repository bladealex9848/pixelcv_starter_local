# Arquitectura del Sistema PixelArt - PixelCV

**Fecha**: 08/01/2026
**Versión**: 1.0
**Estado**: Producción activa

---

## Resumen Ejecutivo

PixelArt es un sistema de creación y galería de pixel art con generación por IA. Los usuarios pueden crear pixel art manualmente en un editor de 32x32 píxeles o generar imágenes usando IA multi-proveedor con prompts en lenguaje natural.

**Características principales:**
- Editor manual de 32x32 píxeles con paleta de color personalizada
- Generación por IA con prompts en español/inglés
- Galería comunitaria con likes, comentarios y avatares
- Sistema de gamificación integrado (puntos por creaciones)
- Multi-proveedor IA con fallback automático

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                               │
│  ┌──────────────────────┐         ┌──────────────────────┐                  │
│  │ /community/pixelart  │────────▶│  PixelartGallery     │                  │
│  │   (Galería Pública)  │         │  (Componente)        │                  │
│  └──────────────────────┘         └──────────────────────┘                  │
│         │                                    │                                │
│         │ GET /pixelart/                     │ POST /pixelart/               │
│         ▼                                    ▼                                │
│  ┌──────────────────────┐         ┌──────────────────────┐                  │
│  │ /community/pixelart/ │────────▶│  PixelartEditor      │                  │
│  │      create          │         │  (32x32 Canvas)      │                  │
│  └──────────────────────┘         └──────────────────────┘                  │
│         │                                                                    │
│         │ POST /pixelart/generate (IA)                                       │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│                         API REST (FastAPI)                                │
└──┼──────────────────────────────────────────────────────────────────────┼───┘
   │                                                                      │
   │    ┌─────────────────────────────────────────────────────────────┐   │
   │    │                  routes_pixelart.py                         │   │
   │    │  POST /pixelart/              → Crear pixelart              │   │
   │    │  GET  /pixelart/              → Listar galería              │   │
   │    │  POST /pixelart/generate      → Generar con IA              │   │
   │    │  POST /pixelart/{id}/like     → Dar like                    │   │
   │    │  POST /pixelart/{id}/comment  → Comentar                    │   │
   │    │  PUT  /pixelart/{id}          → Editar                      │   │
   │    │  DELETE /pixelart/{id}        → Eliminar                    │   │
   │    └─────────────────────────────────────────────────────────────┘   │
   │                                                                          │
   │    ┌─────────────────────────────────────────────────────────────┐   │
   │    │               pixelart_service.py (Lógica)                   │   │
   │    │  - create_piece()          → Crear en DB                     │   │
   │    │  - generate_with_ai()      → Generar 16x16 → 32x32           │   │
   │    │  - toggle_like()           → Like/unlike + puntos            │   │
   │    │  - add_comment()           → Comentario + puntos             │   │
   │    │  - update_piece()          → Editar título/píxeles           │   │
   │    │  - delete_piece()          → Eliminar + relaciones          │   │
   │    └─────────────────────────────────────────────────────────────┘   │
   │                                                                          │
   │    ┌─────────────────────────────────────────────────────────────┐   │
   │    │                 multi_ai_service.py (IA)                    │   │
   │    │  - ZAI/MiniMax (primario)                                    │   │
   │    │  - Gemini (fallback 1)                                       │   │
   │    │  - Claude (fallback 2)                                       │   │
   │    │  - Ollama (último fallback)                                  │   │
   │    └─────────────────────────────────────────────────────────────┘   │
   │                                                                          │
   │    ┌─────────────────────────────────────────────────────────────┐   │
   │    │              gamification_service.py                        │   │
   │    │  - add_points(user_id, action, reason)                      │   │
   │    │    • pixelart_created → +10 puntos                          │   │
   │    │    • pixelart_ai_generated → +20 puntos                     │   │
   │    │    • pixelart_like_received → +5 puntos                     │   │
   │    │    • pixelart_comment_received → +10 puntos                 │   │
   │    └─────────────────────────────────────────────────────────────┘   │
   │                                                                          │
   └──┼──────────────────────────────────────────────────────────────────┼──┘
      │                                                                      │
      ▼                                                                      ▼
   ┌─────────────────────────────┐    ┌──────────────────────────────────┐  │
   │   Base de Datos SQLite      │    │   Cache Redis (opcional)         │  │
   │  - PixelArt                  │    │  - Imágenes generadas            │  │
   │  - PixelArtLike              │    │  - Galerías cacheadas            │  │
   │  - PixelArtComment           │    └──────────────────────────────────┘  │
   │  - User, UserProfile         │                                        │
   └─────────────────────────────┘                                        │
                                                                             │
                 Flujo de Generación IA                                      │
                 ====================                                      │
                                                                             │
    Usuario prompt → Traducción ES→EN → Optimización → IA Multi-Proveedor   │
                           ↓                                                   │
              Prompt estructurado (16x16 grid, 0-7)                          │
                           ↓                                                   │
                      Respuesta IA                                            │
                           ↓                                                   │
                 Parse (extraer 16 líneas)                                   │
                           ↓                                                   │
              Upscaling 16x16 → 32x32 (2x)                                   │
                           ↓                                                   │
              Mapeo de colores (0-7 → hex)                                   │
                           ↓                                                   │
              Array de 1024 colores hex                                      │
                           ↓                                                   ┘
                    Editor / Galería
```

---

## Especificaciones Técnicas

### Formato de Pixel Art

| Propiedad | Valor | Descripción |
|-----------|-------|-------------|
| Resolución interna | 16x16 | Lo que genera la IA |
| Resolución final | 32x32 | Upscaling 2x para mejor visibilidad |
| Formato de almacenamiento | Array[1024] strings hex | `["#ffffff", "#000000", ...]` |
| Paleta de colores IA | 8 colores (0-7) | Mapeados a hex |
| Paleta de usuario | RGB completo | Color picker nativo |

### Paleta de Colores IA (0-7)

```python
palette_map = {
    "0": "#000000",  # Fondo / Negro
    "1": "#FFDAB9",  # Piel (tono humano)
    "2": "#4682B4",  # Ropa / Azul Acero
    "3": "#FFFFFF",  # Brillo / Gafas / Blanco
    "4": "#8B4513",  # Cabello / Marrón
    "5": "#708090",  # Metal / Marco Gafas / Gris
    "6": "#FF4500",  # Detalle vibrante / Naranja
    "7": "#2F4F4F"   # Sombra / Gris oscuro
}
```

---

## Backend - Detalle

### Estructura de Archivos

```
backend/app/
├── api/
│   └── routes_pixelart.py         # Endpoints REST
├── services/
│   ├── pixelart_service.py        # Lógica de negocio
│   ├── multi_ai_service.py        # Cliente IA multi-proveedor
│   ├── ollama_service.py          # Cliente Ollama (fallback)
│   └── gamification_service.py    # Sistema de puntos
└── models/
    └── database.py                # Modelos SQLAlchemy
```

### Endpoints API

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/pixelart/` | ✅ | Crear pixelart nuevo |
| GET | `/api/pixelart/` | ❌ | Listar galería pública |
| POST | `/api/pixelart/generate` | ❌ | Generar con IA |
| POST | `/api/pixelart/{id}/like` | ✅ | Dar/quitar like |
| POST | `/api/pixelart/{id}/comment` | ✅ | Comentar obra |
| PUT | `/api/pixelart/{id}` | ✅ | Editar obra (solo dueño) |
| DELETE | `/api/pixelart/{id}` | ✅ | Borrar obra (solo dueño) |

### Modelo de Datos (SQLAlchemy)

```python
class PixelArt(Base):
    __tablename__ = "pixel_art"

    id = Column(String, primary_key=True)        # UUID
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    pixels_json = Column(JSON, nullable=False)   # { "pixels": ["#fff", ...] }
    width = Column(Integer, default=32)
    height = Column(Integer, default=32)
    prompt = Column(String, nullable=True)       # Prompt de IA si aplica
    is_ai_generated = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    total_likes = Column(Integer, default=0)
    total_comments = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    user = relationship("User", back_populates="pixel_art")
    likes = relationship("PixelArtLike", cascade="all, delete-orphan")
    comments = relationship("PixelArtComment", cascade="all, delete-orphan")
```

---

## Frontend - Detalle

### Estructura de Archivos

```
frontend/app/
├── community/
│   └── pixelart/
│       ├── page.tsx              # Galería pública
│       └── create/
│           └── page.tsx          # Editor de creación
└── components/
    ├── PixelartGallery.tsx       # Componente galería
    ├── PixelartEditor.tsx        # Componente editor
    ├── ConfirmModal.tsx          # Modal genérico
    └── EditPixelartModal.tsx     # Modal edición
```

### Componentes

#### PixelartGallery

**Props:** Ninguno (manejo interno de estado)

**Estado:**
```typescript
interface Piece {
  id: string;
  title: string;
  author: string;
  author_id: string;
  pixels: { pixels: string[] };  // Array de 1024 colores hex
  likes: number;
  comments: number;
}
```

**Funcionalidades:**
- Listar todas las obras públicas
- Dar like (con animación)
- Ver comentarios
- Editar título (solo dueño)
- Usar como avatar (solo dueño)
- Borrar obra (solo dueño)

#### PixelartEditor

**Estado:**
```typescript
const [pixels, setPixels] = useState<string[]>(Array(1024).fill('#ffffff'));
const [selectedColor, setSelectedColor] = useState('#000000');
const [title, setTitle] = useState('');
const [isGenerating, setIsGenerating] = useState(false);
const [prompt, setPrompt] = useState('');
```

**Funcionalidades:**
- Editor 32x32 con click para pintar
- Color picker RGB completo
- Generación por IA con prompt
- Guardar en galería
- Vista previa en tiempo real

---

## Flujo de Generación IA

### Paso 1: Optimización del Prompt

```python
# pixelart_service.py:_optimize_prompt()

# 1. Traducción ES → EN usando IA
prompt_en = translate_with_ai(user_prompt)

# 2. Extracción de elementos clave
colors = extract_colors(prompt_en)    # ["red", "blue", ...]
objects = extract_objects(prompt_en)  # ["cat", "house", ...]
position = extract_position(prompt_en) # "next to", "on", ...

# 3. Construcción del prompt optimizado
optimized = f"A {color} {object} {position} {object2}. Centered in 16x16 grid."
```

### Paso 2: Prompt para la IA

```
You are a pixel artist. Create a 16x16 pixel art image of: {optimized_prompt}

IMPORTANT: Draw the actual object described in the prompt. For example:
- If the prompt says "cat", draw a cat shape
- If it says "house", draw a house shape
- If it says "river", draw flowing water

Color rules:
- Use digit 0 for empty/black background
- Use digits 1-7 to draw the object with different shades
- Example: for a black cat on black background, use digits 1-7 for the cat's features
- Use white (3) for highlights, dark gray (7) for shadows

Output format: 16 lines of 16 digits each (only 0-7), no other text

Draw this: {optimized_prompt}
```

### Paso 3: Parse de Respuesta

```python
# pixelart_service.py:_parse_grid_response()

def _parse_grid_response(response: str) -> list:
    # Extraer bloque de código ```
    code_block = re.search(r'```\n?([\s\S]*?)\n?```', response)
    if code_block:
        response = code_block.group(1)

    # Solo líneas que sean exactamente 16 caracteres de 0-7
    valid_pattern = re.compile(r'^[0-7]{16}$')
    lines = [line.strip() for line in response.split('\n')
             if valid_pattern.match(line.strip())]

    return lines[:16]  # Exactamente 16 líneas
```

### Paso 4: Upscaling 16x16 → 32x32

```python
# Convertir 16x16 grid a 32x32 (upscaling)
pixels_32x32 = []
for r in range(32):
    row_16 = lines[r // 2]  # Duplicar cada fila 2x
    for c in range(32):
        char = row_16[c // 2]  # Duplicar cada píxel 2x
        pixels_32x32.append(palette_map.get(char, "#000000"))
# Resultado: array de 1024 colores hex
```

---

## Proveedores IA (Multi-Proveedor)

### Orden de Preferencia

1. **ZAI/MiniMax** (primario)
   - Configurado en `.env`: `PIXELART_AI_PROVIDER=zai`
   - Modelo: `gpt-4.1-nano`
   - Ventaja: Rápido y económico

2. **Gemini** (fallback 1)
   - Automático si ZAI falla
   - Modelo: `gemini-2.0-flash`

3. **Claude** (fallback 2)
   - Automático si Gemini falla
   - Modelo: `claude-3.5-sonnet`

4. **Ollama** (último fallback)
   - Local: `ollama run gemma3:latest`
   - Automático si todos fallan

### Configuración

```bash
# backend/.env
PIXELART_AI_PROVIDER=zai  # o gemini, claude, ollama
ZAI_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Sistema de Gamificación

### Puntos por Acción

| Acción | Puntos | Código |
|--------|--------|--------|
| Crear pixelart manual | +10 | `pixelart_created` |
| Generar con IA | +20 | `pixelart_ai_generated` |
| Recibir like | +5 | `pixelart_like_received` |
| Recibir comentario | +10 | `pixelart_comment_received` |

### Implementación

```python
# Al crear pixelart
GamificationService.add_points(
    db,
    user_id,
    'pixelart_ai_generated',  # or 'pixelart_created'
    f"Creaste una obra de Pixel Art: {title}"
)

# Al recibir like
GamificationService.add_points(
    db,
    piece.user_id,  # Autor recibe puntos
    'pixelart_like_received',
    "Tu Pixel Art recibió un like"
)
```

---

## Problemas Conocidos y Limitaciones

### Problema 1: IA no genera lo que se pide

**Síntoma:**
- Usuario escribe: "Paisaje con casa y rio, y el sol iluminando y cielo azul"
- IA genera: Algo completamente diferente o genérico

**Causas:**
1. Prompt optimizado es demasiado simplificado
2. IA genera formas básicas en lugar de objetos específicos
3. Falta de "few-shot examples" en el prompt
4. Traducción pierde matices del prompt original

**Solución (pendiente):**
- Mejorar prompt engineering con ejemplos visuales
- Sistema de reintentos con variaciones de prompt
- Validación post-generación para verificar coincidencia
- Feedback loop con usuario para regenerar

### Problema 2: Sin vista previa antes de guardar

**Síntoma:**
- Usuario genera con IA y debe guardar o perder
- No puede regenerar sin borrar todo

**Solución (pendiente):**
- Sistema de preview temporal
- Botón "Regenerar" con variaciones
- Historial de generaciones en la sesión

### Problema 3: Editor manual limitado

**Síntoma:**
- Sin undo/redo
- Sin herramientas (fill, picker, eraser)
- Sin exportar PNG

**Solución (pendiente):**
- Implementar historial de estados para undo/redo
- Agregar herramientas: fill bucket, color picker, eraser
- Botón exportar a PNG con tamaño escalado

---

## Métricas de Uso (Actuales)

| Métrica | Valor | Fecha |
|---------|-------|-------|
| Obras creadas | ~50+ | 08/01/2026 |
| Generaciones IA | ~40% | 08/01/2026 |
| Creaciones manuales | ~60% | 08/01/2026 |
| Promedio likes/obra | 3.5 | 08/01/2026 |

---

## Mejoras Pendientes (Priorizadas)

### Alta Prioridad

1. **Mejorar generación IA** 🚨
   - Prompt engineering mejorado
   - Sistema de reintentos
   - Validación de resultado

2. **OG images dinámicas** 🔥
   - Cada pixelart con su propia imagen OG
   - Mostrar pixelart en share de redes sociales

### Media Prioridad

3. **Herramientas de editor**
   - Undo/redo
   - Fill bucket
   - Color picker
   - Exportar PNG

4. **Preview antes de guardar**
   - Regenerar sin perder
   - Variaciones del mismo prompt

### Baja Prioridad

5. **Animaciones**
   - Frames para sprites animados
   - Exportar GIF

6. **Colaboración**
   - Remix de obras
   - Créditos compartidos

---

## Referencias

- **Código Backend**: `/root/pixelcv/backend/app/services/pixelart_service.py`
- **Código Frontend**: `/root/pixelcv/frontend/components/PixelartEditor.tsx`
- **API Routes**: `/root/pixelcv/backend/app/api/routes_pixelart.py`
- **Documentación IA**: `/root/docs/04-servicios-ai/TERMINALFORGE-IMPLEMENTACION-COMPLETA-2026-01-08.md`
