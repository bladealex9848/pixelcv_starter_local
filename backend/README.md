# PixelCV Backend

API FastAPI para PixelCV - Sistema de CVs con comunidad y gamificación.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
uv sync

# O con pip
pip3 install -r requirements.txt

# Configurar entorno
cp .env.example .env

# Iniciar servidor
uvicorn app.main:app --reload
```

La API estará disponible en http://localhost:8000

## 📚 Documentación de la API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🏗️ Estructura

```
backend/
├── app/
│   ├── api/
│   │   ├── routes_auth.py        # Autenticación (registro, login, perfil)
│   │   ├── routes_cv.py          # Creación y edición de CVs
│   │   ├── routes_cv_community.py # Landing pages, likes, comentarios
│   │   └── routes_gamification.py # Leaderboard, stats, badges
│   ├── models/
│   │   └── database.py           # Modelos SQLAlchemy
│   ├── services/
│   │   ├── auth_service.py       # Lógica de autenticación
│   │   ├── gamification_service.py # Sistema de gamificación
│   │   ├── render_service.py     # Integración con RenderCV
│   │   └── yaml_service.py       # Procesamiento YAML
│   └── main.py                   # Entry point
├── pyproject.toml                # Dependencias
└── .env.example                  # Variables de entorno
```

## 🔌 Endpoints

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener perfil actual
- `PUT /auth/profile` - Actualizar perfil
- `POST /auth/change-password` - Cambiar contraseña

### CVs
- `POST /cv/create` - Crear nuevo CV
- `PUT /cv/{id}` - Actualizar CV
- `POST /cv/{id}/publish` - Publicar/despublicar CV
- `GET /cv/{id}` - Obtener CV por ID
- `GET /cv/public/{slug}` - Obtener CV público
- `GET /cv/browse` - Explorar CVs públicos
- `POST /cv/{id}/visit` - Registrar visita
- `POST /cv/{id}/like` - Dar/quitar like
- `POST /cv/{id}/comment` - Comentar en CV
- `GET /cv/{id}/comments` - Obtener comentarios

### Gamificación
- `GET /gamification/leaderboard` - Ranking global
- `GET /gamification/stats/me` - Estadísticas del usuario
- `GET /gamification/stats/{user_id}` - Estadísticas de usuario
- `GET /gamification/badges` - Lista de badges disponibles

## 🎮 Sistema de Gamificación

### Puntos
- Crear CV: +10
- Publicar CV: +50
- Visita recibida: +5
- Like dado: +2
- Like recibido: +20
- Comentario: +15
- Comentario recibido: +10
- Badge desbloqueado: +100

### Niveles
1. Novato (0 puntos)
2. Aprendiz (100 puntos)
3. Maestro (500 puntos)
4. Experto (1,500 puntos)
5. Leyenda (5,000 puntos)

### Badges
- 🚀 Pionero - Primeros 100 usuarios
- 🏆 Top Creador - 10+ CVs publicados
- 💬 Mariposa Social - 50+ comentarios
- ⭐ Popular - 100+ likes
- 🔥 Viral - 1000+ visitas
- 👑 Leyenda - Nivel 5

## 🔧 Configuración

Variables de entorno en `.env`:

```bash
PIXELCV_DB_URL=sqlite:///./pixelcv.db
JWT_SECRET_KEY=tu-secret-key-aqui
PIXELCV_STORAGE=./backend/app/static/artefactos
OLLAMA_BASE_URL=http://localhost:11434
```

## 📝 Modelos de Datos

### User
- id, username, email, hashed_password
- full_name, avatar_url, bio
- is_verified, is_active
- created_at, updated_at

### UserProfile
- user_id (PK)
- total_points, level, experience, rank_title
- cvs_created, cvs_published
- total_visits_received, total_likes_given/received
- total_comments, badges

### CV
- id, user_id (FK)
- name, slug, yaml_content
- design (JSON)
- is_published, is_featured
- total_visits, total_likes, total_comments
- pdf_path, png_path, html_path

### Comment, Like, Visit, PointHistory
- Ver `app/models/database.py`

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
pytest

# Pruebas manuales con script
./test_api.sh
```

## 🚀 Deploy

Para producción:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Usa una base de datos PostgreSQL para producción:

```bash
PIXELCV_DB_URL=postgresql://user:pass@host/db
```
