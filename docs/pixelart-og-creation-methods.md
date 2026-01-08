# Métodos de Creación de Imágenes OG - PixelCV

**Fecha**: 08/01/2026
**Propósito**: Documentar diferentes métodos para crear imágenes Open Graph (1200x630px) para PixelCV, incluyendo imágenes dinámicas de pixelart.

---

## Especificaciones Técnicas para Images OG

| Propiedad | Valor | Notas |
|-----------|-------|-------|
| Dimensiones | 1200x630 px | Estándar Facebook/LinkedIn/Twitter |
| Formato | PNG | Calidad óptima |
| Tamaño máximo | ~8MB | Límite recomendado |
| Colors | RGB | No usar CMYK |

---

## Método 1: ImageMagick (CLI)

**Usado en producción**: Este método se usó para crear `og-image.png` original.

### Comando Básico

```bash
convert -size 1200x630 gradient:#14b8a6-#059669 \
  -gravity center \
  -pointsize 80 \
  -fill white \
  -font DejaVu-Sans-Bold \
  -annotate +0-0 "PixelCV" \
  -pointsize 40 \
  -annotate +0+80 "Crea CVs Profesionales con IA" \
  og-image.png
```

### Con Pixelart Incrustado

```bash
#!/bin/bash
# Crear OG image con pixelart centrado

PIXELART_URL="https://pixelcv.alexanderoviedofadul.dev/api/pixelart/image/${ID}"
OUTPUT="og-pixelart-${ID}.png"

# Descargar pixelart temporal
wget -O /tmp/pixelart.png "$PIXELART_URL"

# Crear imagen OG con pixelart centrado
convert -size 1200x630 gradient:#14b8a6-#059669 \
  -gravity center \
  /tmp/pixelart.png \
  -geometry 400x400 \
  -compose over \
  -composite \
  -pointsize 40 \
  -fill white \
  -font DejaVu-Sans-Bold \
  -annotate +0+280 "PixelCV Pixelart" \
  "$OUTPUT"

# Limpiar temporal
rm /tmp/pixelart.png
```

### Ventajas/Desventajas

| ✅ Ventajas | ❌ Desventajas |
|-------------|----------------|
| Rápido para imágenes estáticas | Requiere procesos externos |
| No requiere dependencias Python/Node | Difícil de integrar con lógica de negocio |
| Bueno para scripts batch | No dinámico (requiere regeneración) |

---

## Método 2: Python Pillow (PIL)

**Recomendado para backend**: Integración nativa con FastAPI.

### Instalación

```bash
pip install pillow
```

### Imagen Estática Básica

```python
from PIL import Image, ImageDraw, ImageFont

def create_og_image(
    title: str = "PixelCV",
    subtitle: str = "Crea CVs Profesionales con IA",
    output_path: str = "og-image.png"
):
    """Crear imagen OG estática."""

    # Crear canvas con gradiente
    img = Image.new('RGB', (1200, 630), color='#14b8a6')

    # Crear gradiente manual
    draw = ImageDraw.Draw(img)
    for y in range(630):
        r = int(20 + (5 - 20) * y / 630)
        g = int(186 + (150 - 186) * y / 630)
        b = int(166 + (105 - 166) * y / 630)
        draw.line([(0, y), (1200, y)], fill=(r, g, b))

    # Añadir texto
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()

    # Centrar texto
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (1200 - title_width) // 2

    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (1200 - subtitle_width) // 2

    draw.text((title_x, 200), title, fill='white', font=title_font)
    draw.text((subtitle_x, 300), subtitle, fill='white', font=subtitle_font)

    img.save(output_path, 'PNG', optimize=True)
    return output_path
```

### Imagen Dinámica con Pixelart

```python
from PIL import Image, ImageDraw, ImageFont
import io
import requests
from typing import Optional

def create_pixelart_og_image(
    pixelart_url: str,
    title: str = "PixelCV Pixelart",
    author: Optional[str] = None,
    output_path: Optional[str] = None
) -> bytes:
    """
    Crear imagen OG dinámica con pixelart incrustado.

    Args:
        pixelart_url: URL del pixelart (escalado)
        title: Título para la imagen
        author: Nombre del autor (opcional)
        output_path: Si se proporciona, guarda también en disco

    Returns:
        bytes: Imagen PNG en memoria
    """

    # Crear canvas base con gradiente
    img = Image.new('RGB', (1200, 630), color='#14b8a6')
    draw = ImageDraw.Draw(img)

    # Gradiente teal
    for y in range(630):
        r = int(20 + (5 - 20) * y / 630)
        g = int(186 + (150 - 186) * y / 630)
        b = int(166 + (105 - 166) * y / 630)
        draw.line([(0, y), (1200, y)], fill=(r, g, b))

    # Descargar pixelart
    response = requests.get(pixelart_url)
    pixelart = Image.open(io.BytesIO(response.content))

    # Escalar pixelart (efecto pixelado)
    pixelart_scaled = pixelart.resize((400, 400), resample=Image.NEAREST)

    # Centrar pixelart
    x_offset = (1200 - 400) // 2
    y_offset = 80
    img.paste(pixelart_scaled, (x_offset, y_offset))

    # Añadir título
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 50)
        author_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 35)
    except:
        title_font = ImageFont.load_default()
        author_font = ImageFont.load_default()

    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (1200 - title_width) // 2
    draw.text((title_x, 500), title, fill='white', font=title_font)

    # Añadir autor si existe
    if author:
        author_text = f"por {author}"
        author_bbox = draw.textbbox((0, 0), author_text, font=author_font)
        author_width = author_bbox[2] - author_bbox[0]
        author_x = (1200 - author_width) // 2
        draw.text((author_x, 560), author_text, fill='rgba(255,255,255,0.8)', font=author_font)

    # Convertir a bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG', optimize=True)
    img_bytes.seek(0)

    # Guardar en disco si se solicita
    if output_path:
        img.save(output_path, 'PNG', optimize=True)

    return img_bytes.read()
```

### Uso en FastAPI

```python
from fastapi import Response
from fastapi.responses import StreamingResponse

@app.get("/api/pixelart/og/{pixelart_id}")
async def get_pixelart_og_image(pixelart_id: int):
    """Endpoint para generar OG image dinámica."""

    # Obtener datos del pixelart
    pixelart = await db.get_pixelart(pixelart_id)

    # URL del pixelart escalado
    pixelart_url = f"{settings.BASE_URL}/api/pixelart/image/{pixelart_id}"

    # Generar imagen
    img_bytes = create_pixelart_og_image(
        pixelart_url=pixelart_url,
        title=pixelart.title or "Pixelart",
        author=pixelart.author.username
    )

    return Response(
        content=img_bytes,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f"inline; filename=pixelart-{pixelart_id}-og.png"
        }
    )
```

### Ventajas/Desventajas

| ✅ Ventajas | ❌ Desventajas |
|-------------|----------------|
| Integración nativa con FastAPI | Requiere dependencia Pillow |
| Generación dinámica en tiempo real | |
| Cacheable con headers HTTP | |
| Sin procesos externos | |

---

## Método 3: Node.js Canvas (Next.js API Route)

**Recomendado para frontend**: API route `/api/og/pixelart/[id]` en Next.js.

### Instalación

```bash
npm install canvas
```

### API Route para OG Image

```typescript
// frontend/app/api/og/pixelart/[id]/route.ts
import { createCanvas, loadImage, registerFont } from 'canvas'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PixelartData {
  id: number
  title: string
  author: string
  image_url: string
}

async function createOGImage(pixelart: PixelartData): Promise<Buffer> {
  // Crear canvas
  const canvas = createCanvas(1200, 630)
  const ctx = canvas.getContext('2d')

  // Gradiente de fondo
  const gradient = ctx.createLinearGradient(0, 0, 0, 630)
  gradient.addColorStop(0, '#14b8a6')
  gradient.addColorStop(1, '#059669')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)

  // Cargar y dibujar pixelart
  const pixelartImage = await loadImage(pixelart.image_url)

  // Escalar con nearest-neighbor para efecto pixelado
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    pixelartImage,
    400,  // x (centrado)
    80,   // y
    400,  // width
    400   // height
  )

  // Registrar fuente (si está disponible)
  try {
    registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', { family: 'DejaVu' })
    ctx.font = '50px DejaVu'
  } catch {
    ctx.font = 'bold 50px Arial'
  }

  // Dibujar título
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(pixelart.title || 'Pixelart', 600, 500)

  // Dibujar autor
  if (pixelart.author) {
    ctx.font = '35px DejaVu'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(`por ${pixelart.author}`, 600, 560)
  }

  // Convertir a buffer
  return canvas.toBuffer('image/png')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Obtener datos del pixelart desde backend
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/${id}`)
  const pixelart: PixelartData = await res.json()

  // Generar imagen OG
  const buffer = await createOGImage({
    id: pixelart.id,
    title: pixelart.title,
    author: pixelart.author,
    image_url: `${process.env.NEXT_PUBLIC_API_URL}/pixelart/image/${id}`
  })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Disposition': `inline; filename=pixelart-${id}-og.png`
    }
  })
}
```

### Ventajas/Desventajas

| ✅ Ventajas | ❌ Desventajas |
|-------------|----------------|
| Integración nativa con Next.js | Requiere `canvas` (dependencia nativa) |
| Edge Runtime compatible | Build más lento |
| Cache automático ISR | |
| Sin dependencias backend adicionales | |

---

## Comparativa de Métodos

| Método | Velocidad | Calidad | Flexibilidad | Complejidad | Recomendado Para |
|--------|-----------|---------|--------------|-------------|------------------|
| ImageMagick | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | Baja | Imágenes estáticas |
| Pillow (Python) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Media | Backend FastAPI |
| Canvas (Node.js) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Media | Frontend Next.js |

---

## Recomendación para PixelCV

### Para PixelArt OG Images: **Método 3 (Node.js Canvas)**

**Razones:**
1. Integración nativa con Next.js (frontend)
2. Generación dinámica por cada pixelart
3. Cache automático con ISR
4. Sin dependencias backend adicionales
5. Edge Runtime compatible

### Para OG Images Estáticas: **Método 1 (ImageMagick)**

**Razones:**
1. Ya está instalado en el sistema
2. Comando único para generar
3. Ideal para imágenes base del proyecto

---

## Implementación Recomendada

```typescript
// frontend/app/cv/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const cv = await getCV(params.slug)

  return {
    openGraph: {
      images: [
        {
          url: `/api/og/pixelart/${cv.id}`,  // Dinámico
          width: 1200,
          height: 630,
          alt: cv.title
        }
      ]
    }
  }
}
```

```html
<!-- Resultado en HTML -->
<meta property="og:image" content="https://pixelcv.alexanderoviedofadul.dev/api/og/pixelart/123" />
```

---

## Troubleshooting

### Error: "Canvas is not defined"

**Solución**: Asegúrate de usar `export const runtime = 'nodejs'` en la API route.

### Error: Font not found

**Solución**:
```typescript
// Font fallback
try {
  registerFont('/path/to/font.ttf', { family: 'CustomFont' })
  ctx.font = '50px CustomFont'
} catch {
  ctx.font = 'bold 50px Arial'  // Fallback
}
```

### Imagen pixelada al escalar

**Solución**:
```typescript
ctx.imageSmoothingEnabled = false  // Mantener efecto pixelado
```

---

## Recursos

- [Canvas API (Node.js)](https://www.npmjs.com/package/canvas)
- [Pillow Documentation](https://pillow.readthedocs.io/)
- [ImageMagick Commands](https://imagemagick.org/index.php)
- [Open Graph Protocol](https://ogp.me/)
