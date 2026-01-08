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
4. **Multi-dominio**: La URL relativa `/api` funciona correctamente para todos los dominios gracias al proxy de Caddy

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
| ~23:00 | Usuario reporta errores en pixelcv.fundetec.cloud |
| 23:25 | Investigación completada, causa raíz identificada |
| 23:30 | Dependencia RenderCV agregada, backend reiniciado |
| 23:31 | Frontend rebuildeado con Webpack y reiniciado |
| 23:32 | Verificación exitosa, incidente cerrado |
