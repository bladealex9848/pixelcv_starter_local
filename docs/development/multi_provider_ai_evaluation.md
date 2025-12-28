# Evaluación Multi-Proveedor de IA para Pixel Art

**Fecha:** 2025-12-28
**Estado:** Completado

## Resumen Ejecutivo

Se evaluaron **7 proveedores de IA** con **9 configuraciones de modelo** para determinar el mejor para generación de Pixel Art estructurado (grilla 16x16).

### Ganadores

| Ranking | Proveedor | Modelo | Score | Tiempo | Recomendación |
|---------|-----------|--------|-------|--------|---------------|
| 🥇 | **Groq** | `llama-3.1-8b-instant` | 100/100 | 0.5s | **PRODUCCIÓN** |
| 🥈 | Together | `Qwen/Qwen2.5-72B-Instruct-Turbo` | 99.8/100 | 2.6s | Backup |
| 🥉 | Mistral | `mistral-small-latest` | 99.8/100 | 2.5s | Backup |

---

## Metodología de Evaluación

### Prompt de Prueba

```
TASK: Create a 16x16 Pixel Art grid for: "Un ingeniero humano con gafas".

PALETTE (use ONLY these digits 0-7):
0=Black/Background  1=Skin  2=Blue/Clothing  3=White/Glasses
4=Brown/Hair  5=Gray/Metal  6=Orange/Accent  7=Shadow

STRUCTURE FOR HUMAN FIGURE:
- Rows 1-2: Background
- Rows 3-5: HEAD (hair=4, face=1, glasses=5/3)
- Rows 6-7: NECK (skin=1)
- Rows 8-12: TORSO (clothes=2)
- Rows 13-16: LEGS (pants=2/7)

OUTPUT: EXACTLY 16 lines of 16 digits each (only 0-7)
```

### Criterios de Puntuación (100 puntos)

| Criterio | Puntos Max | Descripción |
|----------|------------|-------------|
| Líneas válidas | 30 | 16 líneas de exactamente 16 caracteres (0-7) |
| Píxeles no-negros | 25 | Contenido visual (~400 píxeles ideal) |
| Colores únicos | 15 | Variedad de paleta (5+ colores) |
| Elementos clave | 15 | Piel, ropa, gafas presentes |
| Velocidad | 15 | <5s ideal, <10s bueno |

---

## Resultados Detallados

### Modelos Exitosos

| Proveedor | Modelo | Líneas | No-Negro | Colores | Piel | Ropa | Gafas | Tiempo | Score |
|-----------|--------|--------|----------|---------|------|------|-------|--------|-------|
| **Groq** | llama-3.1-8b-instant | 16/16 | 432 | 7 | ✓ | ✓ | ✓ | 0.5s | **100.0** |
| Together | Qwen2.5-72B-Instruct-Turbo | 16/16 | 396 | 7 | ✓ | ✓ | ✓ | 2.6s | 99.8 |
| Mistral | mistral-small-latest | 16/16 | 396 | 7 | ✓ | ✓ | ✓ | 2.5s | 99.8 |
| Groq | llama-3.3-70b-versatile | 16/16 | 364 | 7 | ✓ | ✓ | ✓ | 0.6s | 97.8 |
| DeepSeek | deepseek-chat | 16/16 | 332 | 7 | ✓ | ✓ | ✓ | 4.8s | 95.8 |
| Together | Llama-3.2-3B-Instruct-Turbo | 16/16 | 404 | 5 | ✓ | ✓ | ✗ | 2.5s | 95.0 |
| OpenRouter | llama-3.3-70b-instruct:free | 16/16 | 368 | 7 | ✓ | ✓ | ✓ | 6.6s | 93.0 |

### Modelos Fallidos

| Proveedor | Modelo | Problema |
|-----------|--------|----------|
| Ollama | phi3.5:latest | Solo 11 líneas válidas (inestable) |
| DeepInfra | Nemotron-Super-49B | 0 líneas válidas (formato incorrecto) |

---

## Análisis por Proveedor

### 🥇 Groq (GANADOR)

**Ventajas:**
- Ultra rápido (0.5-0.6s)
- 100% precisión en formato
- Excelente seguimiento de instrucciones

**Modelos Probados:**
- `llama-3.1-8b-instant` - **MEJOR** (100/100, 0.5s)
- `llama-3.3-70b-versatile` - Excelente (97.8/100, 0.6s)

**Uso recomendado:** Producción, tiempo real

---

### 🥈 Together AI

**Ventajas:**
- Alta calidad de razonamiento
- Modelos grandes disponibles
- Buen balance calidad/velocidad

**Modelos Probados:**
- `Qwen/Qwen2.5-72B-Instruct-Turbo` - Excelente (99.8/100, 2.6s)
- `meta-llama/Llama-3.2-3B-Instruct-Turbo` - Bueno (95.0/100, 2.5s)

**Uso recomendado:** Backup, tareas complejas

---

### 🥉 Mistral

**Ventajas:**
- Muy buena calidad
- Consistente

**Modelos Probados:**
- `mistral-small-latest` - Excelente (99.8/100, 2.5s)

**Uso recomendado:** Backup europeo

---

### DeepSeek

**Ventajas:**
- Buen razonamiento
- Precio competitivo

**Modelos Probados:**
- `deepseek-chat` - Bueno (95.8/100, 4.8s)

**Uso recomendado:** Tareas de razonamiento complejo

---

### OpenRouter

**Ventajas:**
- Modelos gratuitos disponibles
- Variedad de opciones

**Desventajas:**
- Más lento (6.6s)

**Modelos Probados:**
- `meta-llama/llama-3.3-70b-instruct:free` - Aceptable (93.0/100, 6.6s)

**Uso recomendado:** Desarrollo, pruebas sin costo

---

### Ollama (Local)

**Estado:** Inestable para esta tarea

**Problema:** El modelo phi3.5 solo genera 11 líneas válidas consistentemente.

**Nota:** Según pruebas anteriores, a veces funciona (16 líneas) pero es estocástico.

**Recomendación:** No usar para producción de pixel art. Usar para otras tareas.

---

## Configuración Recomendada

### .env del Backend

```bash
# GANADOR: Groq llama-3.1-8b-instant (100/100, 0.5s)
PIXELART_AI_PROVIDER=groq
PIXELART_AI_MODEL=llama-3.1-8b-instant

# Alternativa 1: Together (backup)
# PIXELART_AI_PROVIDER=together
# PIXELART_AI_MODEL=Qwen/Qwen2.5-72B-Instruct-Turbo

# Alternativa 2: Mistral (backup europeo)
# PIXELART_AI_PROVIDER=mistral
# PIXELART_AI_MODEL=mistral-small-latest
```

---

## Implementación Multi-Proveedor

### Servicio Creado

**Archivo:** `backend/app/services/multi_ai_service.py`

Proporciona:
- Abstracción unificada para 7 proveedores
- Fallback automático entre proveedores
- Configuración desde variables de entorno

### Uso

```python
from app.services.multi_ai_service import get_multi_ai_service, AIProvider

service = get_multi_ai_service()

# Usar proveedor específico
result = service.generate_text(prompt, AIProvider.GROQ, "llama-3.1-8b-instant")

# Usar con fallback automático
result = service.generate_with_fallback(prompt)
```

---

## Visualización del Resultado Ganador

```
  ----------------
  |                |
  |                |
  |       @@@@     |
  |    **OOOOOO*   |
  |   *OOOOOOOOO   |
  |   OOOOOOOOO    |
  |   OOOOOOOO     |
  |   OOOOOOO      |
  |  ############  |
  |  ############  |
  |  ############  |
  |  #...####...   |
  |  ##.....#...   |
  |  ##.....#...   |
  |    ..... ...   |
  |    ..... ...   |
  ----------------

Leyenda:
@ = Cabello (marrón)
O = Piel (tono humano)
* = Gafas (blanco/gris)
# = Ropa (azul)
. = Sombra/Pantalones
```

---

## Próximos Pasos

1. ✅ Configurar Groq como proveedor por defecto
2. ⏳ Integrar multi-proveedor en pixelart_service.py
3. ⏳ Usar multi-proveedor para otras rutas (CV review, bullet improvement)
4. ⏳ Agregar endpoint para selección de proveedor en UI

---

## Scripts de Prueba

```bash
# Ejecutar evaluación completa
cd /Volumes/NVMe1TB/GitHub/pixelcv_starter_local/backend
python tests/test_multi_provider_pixelart.py

# Ejecutar test de parsing (sin API)
python tests/test_pixelart_generation.py
```
