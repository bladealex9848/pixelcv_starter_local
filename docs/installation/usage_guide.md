# 🚀 Guía Rápida de Uso - PixelCV v2.0

## ✅ Estado Actual

**Sistema**: ✅ INSTALADO Y FUNCIONANDO LOCALMENTE  
**Backend**: http://localhost:8000  
**Frontend**: http://localhost:3000  
**Fecha**: 23 de Diciembre de 2024

---

## 🎯 Cómo Empezar

### Opción 1: Abrir en Navegador
```bash
# Frontend
open http://localhost:3000

# API Docs (Swagger)
open http://localhost:8000/docs
```

### Opción 2: Probar con curl

```bash
# Verificar backend
curl http://localhost:8000/

# Registrar usuario
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pixelcv.com",
    "username": "testuser",
    "password": "testpass123"
  }'
```

---

## 📱 Primeros Pasos en la Web

### 1. Registro
1. Ve a http://localhost:3000
2. Clic en **"Registrarse"**
3. Completa:
   - Nombre de usuario
   - Email
   - Contraseña
4. ¡Empiezas como **Nivel 1: Novato**!

### 2. Crear tu Primer CV
1. Ve al **Dashboard**
2. Clic en **"Crear nuevo CV"**
3. Llena información:
   - Datos personales
   - Experiencia
   - Educación
   - Habilidades
4. **Ganas +10 puntos** 🎉

### 3. Publicar tu CV
1. Ve a tus CVs
2. Clic en **"Publicar"**
3. Elige un URL (slug)
4. **Ganas +50 puntos** 🎉
5. ¡Ahora eres **Nivel 2: Aprendiz**!

### 4. Compartir tu Landing Page
```
Tu CV público: http://localhost:3000/cv/tu-nombre-abc123
```

---

## 🎮 Sistema de Gamificación

### Cómo Ganar Puntos

| Acción | Puntos | Cómo |
|--------|--------|------|
| Crear CV | +10 | Editor → Crear |
| Publicar CV | +50 | CVs → Publicar |
| Visita | +5 | Otro visitante ve tu CV |
| Like | +2/+20 | Da like / Recibe like |
| Comentar | +15/+10 | Comenta / Recibe comentario |

### Niveles

- 🌱 **Novato** (0+ pts) - Empiezas aquí
- 🌿 **Aprendiz** (100+ pts) - 2 CVs publicados
- 🌳 **Maestro** (500+ pts) - 10 CVs publicados
- 🏔️ **Experto** (1,500+ pts) - Popular en comunidad
- 👑 **Leyenda** (5,000+ pts) - Top del ranking

### Badges

- 🚀 **Pionero** - Primeros 100 usuarios
- 🏆 **Top Creador** - 10+ CVs publicados
- 💬 **Mariposa Social** - 50+ comentarios
- ⭐ **Popular** - 100+ likes
- 🔥 **Viral** - 1000+ visitas
- 👑 **Leyenda** - Nivel 5
- 🤝 **Ayudante** - 20+ likes en comentarios

---

## 🛠️ Comandos Útiles

### Verificar Sistema
```bash
./VERIFICACION_INSTALACION.sh
```

### Ver Logs
```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

### Reiniciar Servicios
```bash
# Matar procesos
kill 9047 9108

# Iniciar de nuevo
./START.sh
```

### Probar API
```bash
./test_api.sh
```

---

## 🌐 URLs Importantes

| Servicio | URL |
|----------|------|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **Community** | http://localhost:3000/community |
| **Leaderboard** | http://localhost:3000/leaderboard |

---

## 📖 Documentación Disponible

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Documentación principal |
| `DOCUMENTATION.md` | Guía completa |
| `VERIFICACION_INSTALACION.md` | Detalles de instalación |
| `CHANGELOG.md` | Historial de cambios |
| `backend/README.md` | Docs backend |
| `frontend/README.md` | Docs frontend |

---

## 🐛 Solución de Problemas

### Backend no arranca
```bash
# Verificar puerto 8000
lsof -ti:8000

# Matar proceso
kill -9 $(lsof -ti:8000)

# Reiniciar
cd backend && PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend no arranca
```bash
# Verificar puerto 3000
lsof -ti:3000

# Matar proceso
kill -9 $(lsof -ti:3000)

# Reiniciar
cd frontend && npm run dev
```

### Error de módulos Python
```bash
# Reinstalar dependencias
pip3 install -r requirements.txt
```

### Error node_modules
```bash
# Eliminar y reinstalar
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Soporte

- **GitHub Issues**: https://github.com/bladealex9848/pixelcv_starter_local/issues
- **Discussions**: https://github.com/bladealex9848/pixelcv_starter_local/discussions

---

## 🎉 ¡Disfruta PixelCV!

1. **Regístrate** - Crea tu cuenta
2. **Crea CVs** - Muestra tu experiencia
3. **Publícalos** - Comparte con la comunidad
4. **Interactúa** - Da likes y comenta
5. **Sube de nivel** - Desbloquea badges
6. **Compite** - Sube en el leaderboard

**¡Levánt
ate y brilla con tu CV profesional!** 🚀✨

---

**Versión**: 2.0.0  
**Fecha**: 23 de Diciembre de 2024  
**Estado**: ✅ Funcionando localmente
