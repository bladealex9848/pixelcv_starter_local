# Implementación de Metadata Social y Soporte Multi-Dominio

**Fecha**: 08/01/2026
**Estado**: ✅ Completado
**Commit**: `8739fcd`

## Resumen

Se implementó metadata completa para redes sociales (Open Graph, Twitter Cards, JSON-LD) y soporte multi-dominio para PixelCV.

## Cambios Implementados

### 1. Metadata para Redes Sociales

#### Open Graph / Facebook / LinkedIn / WhatsApp
- Título dinámico por página
- Descripción detallada
- Imagen OG (1200x630px)
- URL canonical
- Tipo de contenido (website/article)

#### Twitter Cards
- `summary_large_image`
- Título y descripción personalizados
- Imagen de previsualización

#### JSON-LD Structured Data
- Schema.org WebApplication
- Información de la aplicación
- Autor y precio (gratis)

### 2. Archivos Creados/Modificados

#### Archivos Nuevos
```
frontend/app/cv/[slug]/CVClientWrapper.tsx  # Componente cliente para interactividad
frontend/app/robots.ts                       # Robots.txt dinámico
frontend/app/sitemap.ts                      # Sitemap con CVs públicos
frontend/public/og-image.png                # Imagen para compartir (1200x630px)
frontend/public/site.webmanifest            # Manifest PWA
frontend/public/apple-touch-icon.png        # Icono iOS
```

#### Archivos Modificados
```
frontend/app/layout.tsx          # Metadata base completa
frontend/app/cv/[slug]/page.tsx  # Metadata dinámica por CV + Server Component
frontend/styles/globals.css      # Animaciones (twinkle, float)
```

### 3. Metadata Dinámica por CV

Cada CV público ahora tiene su propia metadata personalizada:
- Título: `{nombre_cv} - CV de {autor}`
- Descripción: `CV profesional de {autor}. {likes} likes, {vistas} vistas.`
- Open Graph type: `article`
- URL canonical específica del CV

### 4. Configuración Multi-Dominio

#### Cambio en `.env.local`
```bash
# ANTES
NEXT_PUBLIC_API_URL=https://pixelcv.alexanderoviedofadul.dev/api

# DESPUÉS
NEXT_PUBLIC_API_URL=/api
```

**Razón**: URL relativa permite que el frontend funcione desde cualquier dominio sin problemas de CORS.

#### Dominios Configurados en Caddy
```caddy
pixelcv.alexanderoviedofadul.dev,
pixelcv.marduk.pro,
pixelcv.funde.tech,
pixelcv.fundetec.cloud
```

Ubicación: `/etc/caddy/Caddyfile` (línea 2453)

### 5. Sitemap Dinámico

El sitemap incluye:
- Páginas estáticas (home, community, leaderboard, register)
- Todos los CVs públicos (revalida cada 1 hora)
- Priority y changeFrequency apropiados

URL: `https://pixelcv.alexanderoviedofadul.dev/sitemap.xml`

### 6. Robots.txt

Configuración:
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /editor/

Sitemap: https://pixelcv.alexanderoviedofadul.dev/sitemap.xml
```

## Verificación

### Herramientas de Debug
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

### Verificación en Producción

#### Dominios
```bash
curl -I https://pixelcv.funde.tech
curl -I https://pixelcv.fundetec.cloud
```

#### APIs
```bash
curl https://pixelcv.funde.tech/api/community/browse
curl https://pixelcv.fundetec.cloud/api/gamification/leaderboard
```

#### Metadata
```bash
curl -s https://pixelcv.alexanderoviedofadul.dev/ | grep "og:title"
curl -s https://pixelcv.alexanderoviedofadul.dev/sitemap.xml
curl -s https://pixelcv.alexanderoviedofadul.dev/robots.txt
```

## Resultados Esperados al Compartir

### Homepage
- **Título**: PixelCV - Crea CVs Profesionales con IA
- **Descripción**: Crea CVs profesionales con IA, comparte con la comunidad y sube de nivel...
- **Imagen**: Logo PixelCV con gradiente teal/emerald

### CV Individual
- **Título**: [Nombre CV] - CV de [Usuario]
- **Descripción**: CV profesional de [Usuario]. X likes, Y vistas...
- **Imagen**: Logo PixelCV

## Notas Técnicas

### Server Components vs Client Components
- `page.tsx`: Server Component con `generateMetadata`
- `CVClientWrapper.tsx`: Client Component para interactividad (likes, comentarios)

### Next.js 15+ Async Params
Los parámetros en Next.js 15+ son asíncronos:
```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> })
```

### Build
Usar siempre webpack para evitar bugs de Turbopack:
```bash
npx next build --webpack
```

## Problemas Resueltos

### 1. Failed to fetch / ERR_CONNECTION_CLOSED
**Problema**: API URL hardcodeada causaba errores de CORS al acceder desde dominios diferentes.

**Solución**: Cambiar a URL relativa `/api` en `.env.local`.

### 2. Styled-jsx en Server Component
**Problema**: Build fallaba con error de styled-jsx en Server Component.

**Solución**: Mover animaciones a `globals.css`.

## Archivos de Configuración

### Caddyfile
```bash
/etc/caddy/Caddyfile
```

### Environment Variables
```bash
/root/pixelcv/frontend/.env.local
```

## URLs de Producción

| Dominio | Estado |
|---------|--------|
| https://pixelcv.alexanderoviedofadul.dev | ✅ Activo |
| https://pixelcv.marduk.pro | ✅ Activo |
| https://pixelcv.funde.tech | ✅ Activo |
| https://pixelcv.fundetec.cloud | ✅ Activo |

Todos los dominios comparten el mismo backend (puerto 8000) y frontend (puerto 5180) con SSL automático gestionado por Caddy.
