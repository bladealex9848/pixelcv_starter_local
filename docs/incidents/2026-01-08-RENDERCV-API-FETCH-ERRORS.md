# Incidente: Errores RenderCV y API Fetch

**Fecha**: 2026-01-08
**Estado**: Resuelto
**Severidad**: Alta
**Dominios afectados**: Todos (4 dominios)

---

## Resumen

Se reportaron dos errores en producción en `https://pixelcv.fundetec.cloud`:

1. **RenderCV**: `[Errno 2] No such file or directory: 'rendercv'` al crear CV en `/editor`
2. **API Fetch**: `Failed to fetch` al registrarse en `/register`

---

## Dominios del Proyecto

- pixelcv.alexanderoviedofadul.dev
- pixelcv.marduk.pro
- pixelcv.funde.tech
- pixelcv.fundetec.cloud

---

## Problema 1: RenderCV No Encontrado

### Síntomas
- Error al intentar generar PDF de CV en el editor
- Mensaje: `[Errno 2] No such file or directory: 'rendercv'`

### Causa Raíz
- El paquete `rendercv` no estaba declarado en `backend/pyproject.toml`
- Solo se instalaba manualmente a través de `run.sh` (no reproducible)
- El binario `rendercv` no estaba disponible en el PATH del servicio systemd

### Solución
1. Agregar `"rendercv[full]>=1.0.0"` a las dependencias en `backend/pyproject.toml`
2. Ejecutar `uv sync` para instalar la dependencia
3. Agregar validación en `render_service.py` con mensaje de error claro

### Archivos Modificados
- `backend/pyproject.toml` - Línea 19: agregada dependencia
- `backend/app/services/render_service.py` - Líneas 8-14: validación de binario

---

## Problema 2: Failed to Fetch en Registro

### Síntomas
- Error "Failed to fetch" al enviar formulario de registro
- La API respondía correctamente a curl (no era problema de backend)

### Causa Raíz
- El frontend estaba usando un build desactualizado
- El servicio Next.js no se había reiniciado después de cambios previos

### Solución
1. Limpiar cache de Next.js: `rm -rf .next`
2. Rebuild con Webpack (Turbopack tiene bugs en Next.js 16.x): `npx next build --webpack`
3. Reiniciar servicio: `systemctl restart pixelcv`

### Nota sobre Turbopack
Next.js 16.x tiene un bug conocido con Turbopack en producción:
```
TurbopackInternalError: Dependency tracking is disabled so invalidation is not allowed
```

**Solución**: Siempre usar `--webpack` para builds en producción.

---

## Problema 3: Error 404/500 en Páginas Dinámicas (SSR)

### Síntomas
- Error 404 al acceder a `/community/pixelart/[id]`
- Error 500 después de primera corrección (contenido se renderizaba pero con código de error)
- Las páginas de CVs públicos también afectadas

### Causa Raíz

**Problema A - URL Relativa en SSR**:
- `process.env.NEXT_PUBLIC_API_URL` estaba configurado como `/api` (relativo)
- En Server-Side Rendering, las URLs relativas no tienen host base
- El fetch a `/api/pixelart/` fallaba silenciosamente → `null` → `notFound()` → 404

**Problema B - onClick en Server Component**:
- El botón "Compartir" tenía un `onClick` handler en un Server Component
- Los event handlers no son serializables en RSC
- Next.js lanzaba error interno → 500 (aunque renderizaba el contenido)

### Solución

1. **URLs absolutas en SSR**:
   ```typescript
   // En Server Components, usar URL interna directa
   const isServer = typeof window === 'undefined'
   const baseUrl = isServer
     ? 'http://localhost:8000'
     : (process.env.NEXT_PUBLIC_API_URL || '/api')
   ```

2. **Extraer interactividad a Client Component**:
   ```typescript
   // ShareButton.tsx - Nuevo archivo con "use client"
   'use client'
   export default function ShareButton({ title, author, id }) {
     const handleShare = () => { /* ... */ }
     return <button onClick={handleShare}>Compartir</button>
   }
   ```

### Archivos Modificados
- `frontend/app/community/pixelart/[id]/page.tsx` - Usar URL absoluta en SSR
- `frontend/app/community/pixelart/[id]/ShareButton.tsx` - Nuevo Client Component
- `frontend/app/cv/[slug]/page.tsx` - Usar URL absoluta en SSR

### Lección Clave
**En Next.js App Router**:
- Server Components NO pueden tener event handlers (`onClick`, `onChange`, etc.)
- Las URLs relativas NO funcionan en SSR (no hay host de referencia)
- Usar `"use client"` solo para la interactividad mínima necesaria

---

## Verificación Post-Resolución

### Backend
```bash
# Verificar RenderCV instalado
cd /root/pixelcv/backend
which rendercv
# Resultado: /root/pixelcv/backend/.venv/bin/rendercv

# Health check
curl http://localhost:8000/health
# Resultado: {"status":"healthy"}
```

### Frontend
```bash
# Verificar servicio
systemctl status pixelcv
# Resultado: active (running)

# Verificar respuesta
curl -s -o /dev/null -w "%{http_code}" http://localhost:5180/
# Resultado: 200
```

### Pruebas Funcionales
1. Registro: https://pixelcv.fundetec.cloud/register
2. Editor: https://pixelcv.fundetec.cloud/editor
3. Verificar en todos los dominios

---

## Lecciones Aprendidas

1. **Dependencias explícitas**: Todas las dependencias deben estar en `pyproject.toml`, no solo en scripts de instalación manual
2. **Validación temprana**: Agregar verificaciones al inicio de funciones críticas con mensajes de error claros
3. **Turbopack**: Evitar en producción hasta que Next.js 16.x sea más estable
4. **Multi-dominio**: La URL relativa `/api` funciona en cliente pero NO en SSR
5. **SSR y URLs**: Usar URLs absolutas (`http://localhost:8000`) en Server Components
6. **RSC y Eventos**: Nunca poner `onClick`/`onChange` en Server Components - extraer a Client Components

---

## Comandos de Referencia

```bash
# Reinstalar dependencias backend
cd /root/pixelcv/backend && uv sync

# Rebuild frontend (usar --webpack)
cd /root/pixelcv/frontend && rm -rf .next && npx next build --webpack

# Reiniciar servicios
systemctl restart pixelcv-backend
systemctl restart pixelcv

# Ver logs
tail -f /root/logs/pixelcv-backend.log
journalctl -u pixelcv -f
```

---

## Timeline

| Hora (UTC) | Evento |
|------------|--------|
| ~23:00 | Usuario reporta error RenderCV en pixelcv.fundetec.cloud |
| 23:25 | Investigación completada, causa raíz identificada |
| 23:30 | Dependencia RenderCV agregada, backend reiniciado |
| 23:31 | Frontend rebuildeado con Webpack y reiniciado |
| 23:32 | Verificación inicial exitosa |
| 23:45 | Usuario reporta error 404 en página de pixelart |
| 23:48 | Identificado problema de URL relativa en SSR |
| 23:50 | Primera corrección (URL absoluta en SSR) - Error cambia a 500 |
| 23:52 | Identificado onClick en Server Component como causa del 500 |
| 23:55 | Creado ShareButton Client Component |
| 23:57 | Rebuild y verificación final - 200 OK |
| 23:58 | Incidente cerrado, documentación actualizada
