# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos de Desarrollo

### Backend (FastAPI)
```bash
cd backend
uv sync                              # Instalar dependencias
uvicorn app.main:app --reload        # Iniciar servidor (puerto 8000)
pytest                               # Ejecutar tests
```

### Frontend (Next.js)
```bash
cd frontend
npm install                          # Instalar dependencias
npm run dev                          # Iniciar servidor (puerto 3000)
npm run build                        # Build producción
```

### Scripts de Utilidad
```bash
./INSTALL.sh                         # Instalación automática completa
./START.sh                           # Iniciar backend y frontend
./test_api.sh                        # Pruebas manuales de la API
```

## Arquitectura del Proyecto

PixelCV es una plataforma para crear CVs profesionales con gamificación. Usa **FastAPI + SQLite** en backend y **Next.js 14 + Tailwind** en frontend.

### Backend (`backend/app/`)

**Entry point**: `main.py` - Configura FastAPI con CORS y monta los routers.

**Modelos** (`models/`):
- `database.py`: Define User, UserProfile, CV, Comment, Like, Visit, PointHistory con SQLAlchemy
- `db.py`: Configuración de la sesión de base de datos

**Servicios** (`services/`):
- `auth_service.py`: JWT, hashing de contraseñas, autenticación
- `gamification_service.py`: Sistema de puntos, niveles (1-5), badges
- `render_service.py`: Integración con RenderCV para generar PDFs
- `yaml_service.py`: Procesamiento de YAML para CVs
- `ollama_service.py`: Integración con Ollama para IA

**Rutas** (`api/`):
- `routes_auth.py`: `/auth/*` - registro, login, perfil
- `routes_cv.py`: `/cv/*` - CRUD de CVs
- `routes_cv_community.py`: Landing pages, likes, comentarios, visitas
- `routes_gamification.py`: `/gamification/*` - leaderboard, stats, badges
- `routes_ollama.py`: `/ollama/*` - endpoints de IA

### Frontend (`frontend/app/`)

Usa Next.js 14 App Router. Páginas principales:
- `page.tsx`: Homepage
- `editor/`: Editor de CVs con vista previa
- `cv/[slug]/`: Landing page pública de CV
- `community/`: Galería de CVs públicos
- `leaderboard/`: Ranking de usuarios
- `dashboard/`: Panel del usuario
- `login/`, `register/`: Autenticación

### Flujo de Datos

1. Usuario crea CV en editor → YAML se envía a `/cv/create`
2. Backend procesa YAML y genera PDF con RenderCV
3. Usuario publica CV → se genera slug único
4. Visitas/likes/comentarios actualizan puntos via `GamificationService.add_points()`
5. Sistema verifica badges automáticamente tras cada acción

### Sistema de Gamificación

**Puntos**: crear CV (+10), publicar (+50), visita recibida (+5), like dado (+2), like recibido (+20), comentar (+15)

**Niveles**: Novato (0) → Aprendiz (100) → Maestro (500) → Experto (1500) → Leyenda (5000)

## Variables de Entorno

Backend (`backend/.env`):
```
PIXELCV_DB_URL=sqlite:///./pixelcv.db
JWT_SECRET_KEY=<secret>
OLLAMA_BASE_URL=http://localhost:11434
```

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Convenciones

- **Idioma**: Documentación y comentarios en español
- **Backend**: Python 3.10+, FastAPI async, SQLAlchemy 2.0
- **Frontend**: TypeScript, React hooks, Tailwind CSS
- **Componentes**: PascalCase (`UserProfile.tsx`)
