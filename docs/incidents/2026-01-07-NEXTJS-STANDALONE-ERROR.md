# Incidente: Internal Server Error en Rutas Dinámicas

**Fecha**: 2026-01-07
**Severidad**: Crítica
**Estado**: Resuelto
**Tiempo de resolución**: ~15 minutos

## Resumen

Todas las rutas dinámicas del frontend (`/cv/[slug]`, `/games/[game]`, etc.) devolvían "Internal Server Error" (HTTP 500).

## Síntomas

- La URL `https://pixelcv.alexanderoviedofadul.dev/cv/alexander-oviedo-fadul-89477244` devolvía "Internal Server Error"
- La URL `https://pixelcv.alexanderoviedofadul.dev/games/pong` devolvía "Internal Server Error"
- Todas las rutas dinámicas del frontend fallaban
- El backend API funcionaba correctamente (verificado con curl)

## Diagnóstico

### Logs del Frontend
```
⚠ "next start" does not work with "output: standalone" configuration.
Use "node .next/standalone/server.js" instead.

⨯ Error [InvariantError]: Invariant: The manifests singleton was not initialized.
This is a bug in Next.js.

⨯ TypeError: Cannot read properties of undefined (reading 'canonicalBase')
```

### Causa Raíz

Incompatibilidad entre la configuración de Next.js y el modo de ejecución:

1. **`next.config.js`** tenía `output: 'standalone'`
2. **El script de inicio** (`manage-pixelcv.sh`) ejecutaba `npm run start` → `next start`
3. **Next.js 16.1.1** no permite usar `next start` con `output: standalone`

El modo `standalone` genera un servidor independiente en `.next/standalone/server.js` que debe ejecutarse con `node` directamente, no con `next start`.

## Solución Aplicada

### Opción elegida: Quitar `output: standalone`

Se eliminó la configuración `output: 'standalone'` del archivo `next.config.js`.

**Antes:**
```js
const nextConfig = {
  output: 'standalone'
}
```

**Después:**
```js
const nextConfig = {}
```

### Pasos ejecutados

1. Detener el servicio:
   ```bash
   systemctl stop pixelcv-backend
   ```

2. Modificar `frontend/next.config.js` (quitar `output: 'standalone'`)

3. Limpiar y reconstruir con Webpack:
   ```bash
   cd /root/pixelcv/frontend
   rm -rf .next
   npx next build --webpack
   ```

   **Nota**: Se usó `--webpack` porque Turbopack tenía un bug que causaba panic.

4. Reiniciar el servicio:
   ```bash
   systemctl start pixelcv-backend
   ```

## Verificación

```bash
# Prueba local
curl -s -o /dev/null -w "%{http_code}" http://localhost:5180/cv/alexander-oviedo-fadul-89477244
# Resultado: 200

# Prueba a través de Caddy
curl -s -o /dev/null -w "%{http_code}" "https://pixelcv.alexanderoviedofadul.dev/cv/alexander-oviedo-fadul-89477244"
# Resultado: 200
```

## Lecciones Aprendidas

1. **Verificar compatibilidad de configuración**: Al usar `output: standalone` en Next.js, el servidor debe iniciarse con `node .next/standalone/server.js`, no con `next start`.

2. **Turbopack inestable**: Next.js 16.1.1 tiene bugs en Turbopack que causan panics. Usar `--webpack` para builds de producción hasta que sea estable.

3. **Logs son clave**: El mensaje de advertencia en los logs del frontend indicaba claramente el problema.

## Alternativa No Aplicada

Si se hubiera querido mantener `output: standalone`, se habría necesitado:

1. Cambiar el script `start` en `package.json`:
   ```json
   "start": "node .next/standalone/server.js"
   ```

2. Copiar archivos estáticos al directorio standalone:
   ```bash
   cp -r public .next/standalone/
   cp -r .next/static .next/standalone/.next/
   ```

3. Modificar `manage-pixelcv.sh` para manejar correctamente el modo standalone.

## Archivos Modificados

- `frontend/next.config.js` - Eliminada configuración `output: 'standalone'`

## Referencias

- [Next.js Standalone Mode](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Turbopack Issues](https://github.com/vercel/next.js/issues)
