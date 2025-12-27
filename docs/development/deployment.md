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
5. Reinicia servicios con `manage-pixelcv.sh restart`

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
Si el build falla con error de Turbopack, ejecutar en modo desarrollo:
```bash
npm run dev -- -p 5180
```

### Webhook no recibe notificaciones
1. Verificar configuración en GitHub (Settings > Webhooks)
2. Verificar que el secret coincida
3. Revisar logs: `tail -f /root/logs/webhook-pixelcv.log`

## Historial de Cambios

### 2025-12-27
- Corregido import de `get_current_user` en `routes_games.py`
- Agregada sección Games arcade retro con IA de Ollama
- Documentado proceso de deployment y webhook
