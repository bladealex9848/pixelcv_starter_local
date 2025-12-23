# PixelCV Starter (Local)

> 🚀 Plataforma moderna para crear, compartir y gamificar CVs con RenderCV

![PixelCV](https://img.shields.io/badge/Version-2.0.0-purple)
![License](https://img.shields.io/badge/License-MIT-green)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Node](https://img.shields.io/badge/Node.js-18+-green)

## ✨ Características

- 📄 **CVs Profesionales**: Integración con RenderCV para generar PDFs perfectos
- 🌐 **Landing Pages**: Publica tu CV como página web personalizada
- 🎮 **Gamificación**: Gana puntos, sube de nivel y desbloquea badges
- 👥 **Comunidad**: Explora CVs de otros profesionales
- 💬 **Interacciones**: Likes y comentarios en CVs públicos
- 🏆 **Ranking**: Tabla de clasificación global

## 🎯 Demo Rápida

```bash
# Instalación
git clone https://github.com/tu-usuario/pixelcv_starter_local.git
cd pixelcv_starter_local
./INSTALL.sh

# Iniciar
./START.sh

# Abrir en navegador
open http://localhost:3000
```

## 📖 Documentación Completa

Para documentación detallada, ver: [DOCUMENTATION.md](DOCUMENTATION.md)

## 🏗️ Arquitectura

```
├── backend/          # FastAPI (Python)
│   ├── app/
│   │   ├── api/      # Endpoints: auth, cv, community, gamification
│   │   ├── models/   # SQLAlchemy: User, CV, Comments, Likes...
│   │   ├── services/ # Auth, Gamification, RenderCV integration
│   │   └── main.py   # App entry point
│   └── pyproject.toml
├── frontend/         # Next.js (TypeScript)
│   ├── app/
│   │   ├── page.tsx  # Homepage
│   │   ├── editor/   # CV Editor
│   │   ├── cv/[slug]/ # Public CV landing page
│   │   ├── community/ # CV gallery
│   │   ├── leaderboard/ # User rankings
│   │   ├── dashboard/ # User dashboard
│   │   ├── login/ & register/ # Auth pages
│   │   └── layout.tsx
│   └── package.json
└── docs/rendercv/    # RenderCV source
```

## 🎮 Sistema de Gamificación

### Puntos por Acción

| Acción | Puntos |
|--------|--------|
| Crear CV | +10 |
| Publicar CV | +50 |
| Recibir visita | +5 |
| Dar/Recibir like | +2/+20 |
| Comentar | +15 |
| Desbloquear badge | +100 |

### Niveles

1. 🌱 **Novato** (0 puntos)
2. 🌿 **Aprendiz** (100 puntos)
3. 🌳 **Maestro** (500 puntos)
4. 🏔️ **Experto** (1,500 puntos)
5. 👑 **Leyenda** (5,000 puntos)

### Badges

- 🚀 Pionero - Primeros 100 usuarios
- 🏆 Top Creador - 10+ CVs publicados
- 💬 Mariposa Social - 50+ comentarios
- ⭐ Popular - 100+ likes
- 🔥 Viral - 1000+ visitas
- 👑 Leyenda - Nivel 5

## 🚀 API Endpoints

### Autenticación
- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `GET /auth/me` - Perfil actual

### CVs
- `POST /cv/create` - Crear CV
- `GET /cv/browse` - Explorar CVs públicos
- `GET /cv/public/{slug}` - Ver CV público
- `POST /cv/{id}/visit` - Registrar visita
- `POST /cv/{id}/like` - Dar/quitar like
- `POST /cv/{id}/comment` - Comentar

### Gamificación
- `GET /gamification/leaderboard` - Ranking global
- `GET /gamification/stats/me` - Estadísticas
- `GET /gamification/badges` - Badges disponibles

Ver docs completas: http://localhost:8000/docs

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web moderno
- **SQLAlchemy** - ORM de base de datos
- **SQLite** - Base de datos
- **JWT** - Autenticación
- **Passlib** - Hashing de contraseñas
- **RenderCV** - Generación de CVs

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS

## 📝 Scripts

```bash
./INSTALL.sh    # Instala dependencias
./START.sh      # Inicia backend y frontend
./test_api.sh   # Prueba la API
```

## 🔧 Requisitos

- Python 3.10+
- Node.js 18+
- Git

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el repo
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Contacto

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/pixelcv_starter_local/issues)
- **Discord**: [Únete a la comunidad](https://discord.gg/pixelcv)

---

**Hecho con ❤️ y gamificación**
