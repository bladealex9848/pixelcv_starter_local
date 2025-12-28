# 🚀 Instrucciones Corregidas para VPS PixelCV

## ✅ Estado Actual del Sistema

**Servicios Configurados:**
- `pixelcv.service` - Servicio principal (frontend + backend)
- `pixelcv-backend.service` - Solo backend FastAPI
- `pixelcv-webhook.service` - Webhook auto-deploy
- Script de gestión: `/root/docs/16-scripts-servicios-ai/manage-pixelcv.sh`

---

## 🔄 Actualizar Código (2 opciones)

### Opción A: Webhook Automático (RECOMENDADO)
```bash
# 1. Subir cambios a GitHub
git add .
git commit -m "tu mensaje"
git push origin main

# 2. El webhook actualizará automáticamente:
#    - Hace git pull
#    - Build frontend si es necesario
#    - Reinicia servicios
#    - Todo sin intervención manual

# 3. Monitorear el deploy
tail -f /root/logs/webhook-pixelcv.log
```

### Opción B: Manual
```bash
# 1. Conectarse al VPS
ssh root@tu_vps_ip

# 2. Navegar al proyecto
cd /root/pixelcv

# 3. Actualizar código
git pull origin main

# 4. Reiniciar servicios
/root/docs/16-scripts-servicios-ai/manage-pixelcv.sh restart
```

---

## 🔧 Reiniciar Servicios

### Opción A: Servicio Completo (RECOMENDADO)
```bash
# Reiniciar frontend + backend
sudo systemctl restart pixelcv.service

# Verificar estado
sudo systemctl status pixelcv.service
```

### Opción B: Solo Backend
```bash
# Reiniciar solo FastAPI
sudo systemctl restart pixelcv-backend.service

# Verificar estado
sudo systemctl status pixelcv-backend.service
```

### Opción C: Script de Gestión (MÁS FLEXIBLE)
```bash
# Reiniciar todo
/root/docs/16-scripts-servicios-ai/manage-pixelcv.sh restart

# Solo backend
/root/docs/16-scripts-servicios-ai/manage-pixelcv.sh restart backend

# Solo frontend
/root/docs/16-scripts-servicios-ai/manage-pixelcv.sh restart frontend

# Ver estado
/root/docs/16-scripts-servicios-ai/manage-pixelcv.sh status
```

---

## ✅ Verificar que Funciona

### 1. Verificar Backend
```bash
# Endpoint correcto
curl http://localhost:8000/health

# Respuesta esperada: {"status": "healthy"}
```

### 2. Verificar Frontend
```bash
curl -I http://localhost:5180/

# Respuesta esperada: HTTP/1.1 200 OK
```

### 3. Verificar API Pública
```bash
curl https://pixelcv.alexanderoviedofadul.dev/api/games/list

# Respuesta esperada: JSON con lista de juegos
```

---

## 🗄️ Inicializar Base de Datos (SI ES NECESARIO)

**Nota:** La base de datos se inicializa automáticamente al iniciar el backend.

Si por alguna razón necesitas forzar la inicialización:
```bash
curl -X POST http://localhost:8000/admin/init-db

# Respuesta esperada: {"message": "Database initialized"}
```

---

## 📊 Ver Logs

### Webhook (auto-deploy)
```bash
tail -f /root/logs/webhook-pixelcv.log
```

### Backend
```bash
tail -f /root/logs/pixelcv-backend.log

# O con journalctl
sudo journalctl -u pixelcv-backend.service -f
```

### Frontend
```bash
tail -f /root/logs/pixelcv-frontend.log

# O con journalctl
sudo journalctl -u pixelcv.service -f
```

---

## 🎯 ¿Qué Pasa al Reiniciar?

1. ✅ `init_db()` se ejecuta automáticamente
2. ✅ Se crean/actualizan todas las tablas necesarias
3. ✅ Se aplican migraciones si las hay
4. ✅ Los servicios quedan disponibles en puertos 5180 (frontend) y 8000 (backend)

---

## 🔍 Troubleshooting

### Backend no responde
```bash
# Verificar proceso
ps aux | grep uvicorn

# Ver logs
sudo journalctl -u pixelcv-backend.service -n 50
```

### Frontend no carga
```bash
# Verificar proceso Next.js
ps aux | grep next

# Reiniciar
sudo systemctl restart pixelcv.service
```

### Webhook no funciona
```bash
# Verificar estado
systemctl status pixelcv-webhook.service

# Ver logs
tail -f /root/logs/webhook-pixelcv.log
```

---

## 📝 Resumen de Comandos Útiles

```bash
# Estado de servicios
systemctl status pixelcv.service
systemctl status pixelcv-backend.service
systemctl status pixelcv-webhook.service

# Reiniciar
systemctl restart pixelcv.service

# Ver logs
journalctl -u pixelcv-backend.service -f

# Verificar endpoints
curl http://localhost:8000/health
curl http://localhost:5180/

# Actualizar código (manual)
cd /root/pixelcv && git pull origin main && /root/docs/16-scripts-servicios-ai/manage-pixelcv.sh restart
```

---

## ✅ Notas Importantes

1. **El webhook hace todo automáticamente** - No necesitas reiniciar manualmente después de git push
2. **El endpoint es `/health`, no `/api/health`**
3. **Usa `manage-pixelcv.sh` para reinicios completos** - Es más confiable
4. **Los logs están en `/root/logs/`** - Úsalos para diagnosticar problemas
5. **Puerto 8000 = Backend, Puerto 5180 = Frontend**
