# Deployment y Webhook de PixelCV

## Configuración del Servidor

### URLs de Producción
- **Frontend**: https://pixelcv.alexanderoviedofadul.dev/
- **Backend API**: https://pixelcv.alexanderoviedofadul.dev/api/
- **Documentación API**: https://pixelcv.alexanderoviedofadul.dev/docs

### Puertos Locales
| Servicio | Puerto |
|----------|--------|
| Frontend (Next.js) | 5180 |
| Backend (FastAPI) | 8000 |
| Webhook | 9010 |

## Webhook de GitHub

### Configuración
El webhook recibe notificaciones de GitHub y despliega automáticamente los cambios.

- **Archivo**: `/root/docs/17-scripts-backend/webhook-pixelcv.js`
- **Puerto**: 9010
- **Endpoint**: `POST /webhook`
- **Log**: `/root/logs/webhook-pixelcv.log`

### Flujo de Deploy Automático
1. Push a `main` en GitHub
2. GitHub envía webhook al servidor
3. El webhook verifica la firma (seguridad)
4. Ejecuta `git pull origin main`
5. **Si hay cambios en frontend**: ejecuta `npm run build` automáticamente
6. Reinicia servicios con `manage-pixelcv.sh restart`

### Modo de Ejecución
El frontend corre en **modo producción** (pre-compilado) para:
- Respuestas instantáneas sin compilación on-demand
- Evitar errores 500 temporales durante el deploy
- Mejor rendimiento general

### Verificar Estado del Webhook
```bash
# Ver proceso
ps aux | grep webhook-pixelcv

# Ver logs
tail -f /root/logs/webhook-pixelcv.log

# Verificar puerto
netstat -tlnp | grep 9010
```

## Scripts de Gestión

### Ubicación
`/root/docs/16-scripts-servicios-ai/manage-pixelcv.sh`

### Comandos
```bash
# Iniciar todo
./manage-pixelcv.sh start

# Detener todo
./manage-pixelcv.sh stop

# Reiniciar todo
./manage-pixelcv.sh restart

# Solo backend
./manage-pixelcv.sh restart backend

# Solo frontend
./manage-pixelcv.sh restart frontend

# Ver estado
./manage-pixelcv.sh status
```

## Logs

### Ubicación
- Backend: `/root/logs/pixelcv-backend.log`
- Frontend: `/root/logs/pixelcv-frontend.log`
- Webhook: `/root/logs/webhook-pixelcv.log`

### Monitorear en tiempo real
```bash
tail -f /root/logs/pixelcv-backend.log
tail -f /root/logs/pixelcv-frontend.log
tail -f /root/logs/webhook-pixelcv.log
```

## Troubleshooting

### Error: Puerto en uso
```bash
# Liberar puerto 5180
lsof -ti:5180 | xargs -r kill -9

# Liberar puerto 8000
lsof -ti:8000 | xargs -r kill -9
```

### Error: ImportError en Backend
Verificar que los imports sean correctos. Ejemplo de fix común:
```python
# Incorrecto
from app.services.auth_service import get_current_user

# Correcto
from app.api.routes_auth import get_current_user
```

### Error: Turbopack en Next.js 16
Next.js 16 tiene un bug conocido con Turbopack. Solución aplicada:
- Se hizo downgrade a Next.js 15.5.9 (estable)
- El build de producción funciona correctamente

Si necesitas actualizar Next.js, verifica primero que el build funcione:
```bash
cd frontend && npm run build
```

### Webhook no recibe notificaciones
1. Verificar configuración en GitHub (Settings > Webhooks)
2. Verificar que el secret coincida
3. Revisar logs: `tail -f /root/logs/webhook-pixelcv.log`

## Historial de Cambios

### 2025-12-27 (Actualización)
- Downgrade de Next.js 16.1.1 a 15.5.9 por bug de Turbopack
- Configurado frontend para modo producción (pre-compilado)
- Webhook actualizado para hacer build automático en cambios de frontend
- Corregidos errores TypeScript en PongGame.tsx y SnakeGame.tsx
- Script de gestión mejorado para usar build de producción

### 2025-12-27 (Inicial)
- Corregido import de `get_current_user` en `routes_games.py`
- Agregada sección Games arcade retro con IA de Ollama
- Documentado proceso de deployment y webhook
