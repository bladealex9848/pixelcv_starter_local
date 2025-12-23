# PixelCV - Documentación Oficial

## 📋 Índice

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Características Principales](#características-principales)
3. [Arquitectura Técnica](#arquitectura-técnica)
4. [Guía de Instalación](#guía-de-instalación)
5. [Guía de Uso](#guía-de-uso)
6. [API Reference](#api-reference)
7. [Sistema de Gamificación](#sistema-de-gamificación)
8. [Desarrollo y Contribución](#desarrollo-y-contribución)

---

## 📄 Descripción del Proyecto

PixelCV es una plataforma moderna para crear, compartir y gamificar currículums vitae (CVs). Integra **RenderCV** para generar CVs profesionales con tipografía perfecta, y añade una capa de comunidad con sistema de puntos, niveles y badges inspirado en videojuegos.

### 🎯 Objetivo Principal

Transformar la creación de CVs de una tarea aburrida a una experiencia social y gamificada, donde los usuarios pueden:
- Crear CVs profesionales con YAML
- Publicarlos como landing pages personalizadas
- Ganar puntos por interacciones (visitas, likes, comentarios)
- Subir de nivel y desbloquear badges
- Explorar CVs de la comunidad

---

## ✨ Características Principales

### 📝 Creación de CVs
- **RenderCV Integration**: Usa el proyecto RenderCV para generar PDFs con tipografía perfecta
- **YAML-Based**: Escribe tu CV en formato YAML simple
- **Múltiples Templates**: Soporta themes clásicos, modernos y customizables
- **IA Asistente**: Integración con Ollama para mejorar bullets de experiencia

### 🌐 Comunidad y Landing Pages
- **Páginas Públicas**: Cada CV puede publicarse como landing page única
- **URLs Personalizadas**: Slugs amigables para compartir (ej: `/cv/john-doe-abc123`)
- **Galería Explorable**: Explora CVs de la comunidad por popularidad o recientes

### 🎮 Gamificación
- **Sistema de Puntos**: Gana puntos por:
  - Crear CVs (+10 pts)
  - Publicar CVs (+50 pts)
  - Recibir visitas (+5 pts/visita)
  - Recibir likes (+20 pts)
  - Recibir comentarios (+10 pts)
  - Dar likes (+2 pts)
  - Comentar (+15 pts)

### 🏆 Niveles y Badges
- **5 Niveles**: Novato → Aprendiz → Maestro → Experto → Leyenda
- **Badges Especiales**:
  - 🚀 **Pionero**: Uno de los primeros 100 usuarios
  - 🏆 **Top Creador**: 10+ CVs publicados
  - 💬 **Mariposa Social**: 50+ comentarios
  - ⭐ **Popular**: 100+ likes recibidos
  - 🔥 **Viral**: 1000+ visitas en un CV
  - 👑 **Leyenda**: Nivel 5 alcanzado
  - 🤝 **Ayudante**: 20+ likes en comentarios

### 👥 Interacciones Sociales
- **Likes**: Da/quita likes en CVs públicos
- **Comentarios**: Comenta en CVs y responde a otros usuarios
- **Ranking Global**: Tabla de clasificación por puntos
- **Perfiles de Usuario**: Avatar, bio y estadísticas públicas

---

## 🏗️ Arquitectura Técnica

```
pixelcv_starter_local/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/              # Rutas de la API
│   │   │   ├── routes_auth.py        # Auth endpoints
│   │   │   ├── routes_cv.py          # CV creation
│   │   │   ├── routes_cv_community.py # Community features
│   │   │   └── routes_gamification.py # Gamification endpoints
│   │   ├── models/           # Modelos de base de datos
│   │   │   └── database.py          # SQLAlchemy models
│   │   ├── services/         # Lógica de negocio
│   │   │   ├── auth_service.py       # Authentication logic
│   │   │   ├── gamification_service.py # Points, levels, badges
│   │   │   ├── render_service.py     # RenderCV integration
│   │   │   └── yaml_service.py       # YAML processing
│   │   ├── static/           # Archivos estáticos
│   │   │   └── artefactos/          # PDFs generados
│   │   └── main.py           # App entry point
│   ├── pyproject.toml        # Python dependencies
│   └── .env.example          # Environment variables
├── frontend/                  # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx          # Homepage
│   │   ├── editor/           # CV Editor
│   │   ├── cv/[slug]/        # Public CV landing page
│   │   ├── community/        # CV gallery
│   │   ├── leaderboard/      # User rankings
│   │   ├── dashboard/        # User dashboard
│   │   ├── login/            # Login page
│   │   └── register/         # Registration page
│   ├── components/           # Reusable components
│   ├── styles/               # Global styles
│   └── package.json          # Node dependencies
├── docs/                     # Documentation
│   └── rendercv/             # RenderCV source
├── INSTALL.sh                # Installation script
├── START.sh                  # Start script
├── test_api.sh               # API testing script
├── .gitignore                # Git ignore rules
└── DOCUMENTATION.md          # This file
```

### Stack Tecnológico

#### Backend
- **FastAPI**: Framework web moderno y asíncrono
- **SQLAlchemy**: ORM para base de datos
- **SQLite**: Base de datos local
- **JWT**: Autenticación con JSON Web Tokens
- **Passlib**: Hashing de contraseñas con bcrypt
- **PyYAML**: Procesamiento de YAML
- **RenderCV**: Generación de CVs en PDF

#### Frontend
- **Next.js 14**: Framework React con App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: State management

---

## 🚀 Guía de Instalación

### Requisitos Previos

- **Python 3.10+**: [Descargar](https://python
.org/)
- **Node.js 18+**: [Descargar](https://nodejs.org/)
- **Git**: [Descargar](https://git-scm.com/)

### Instalación Automática

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/pixelcv_starter_local.git
cd pixelcv_starter_local

# Ejecutar script de instalación
./INSTALL.sh
```

### Instalación Manual

#### 1. Instalar dependencias del backend

```bash
cd backend

# Opción A: Con uv (recomendado)
uv sync

# Opción B: Con pip
pip3 install fastapi uvicorn pydantic pydantic-settings sqlalchemy passlib python-jose python-multipart pyyaml requests email-validator

cd ..
```

#### 2. Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

#### 3. Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

#### 4. Iniciar el proyecto

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

O usa el script de inicio automático:
```bash
./START.sh
```

### Verificar Instalación

Abre en tu navegador:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

Ejecuta las pruebas de la API:
```bash
./test_api.sh
```

---

## 📖 Guía de Uso

### 1. Registro y Login

1. Ve a http://localhost:3000
2. Haz clic en "Registrarse"
3. Completa el formulario:
   - Nombre de usuario (único)
   - Email
   - Contraseña
   - Nombre completo (opcional)
4. ¡Bienvenido! Empiezas en **Nivel 1: Novato**

### 2. Crear tu Primer CV

1. Inicia sesión y ve al **Dashboard**
2. Haz clic en "Crear nuevo CV"
3. Edita el formulario con tu información:
   - Datos personales
   - Experiencia laboral
   - Educación
   - Habilidades
   - Proyectos
4. Guarda y genera el PDF
5. **¡Ganas 10 puntos!**

### 3. Publicar como Landing Page

1. Ve a tus CVs en el Dashboard
2. Haz clic en "Publicar"
3. Elige un slug (URL amigable) o usa el sugerido
4. **¡Ganas 50 puntos!**
5. Comparte el link: `https://pixelcv.com/cv/tu-nombre-abc123`

### 4. Interactuar con la Comunidad

#### Explorar CVs
- Ve a la sección **Comunidad**
- Filtra por: Recientes, Populares, Más visitados
- Ver CVs de otros profesionales

#### Dar Likes
- En cualquier CV público, haz clic en ❤️
- **Ganas 2 puntos**
- El autor gana **20 puntos**

#### Comentar
- Deja un comentario en un CV
- **Ganas 15 puntos**
- El autor gana **10 puntos**

### 5. Seguir tu Progreso

#### Dashboard
- Tu **nivel actual** y **rango**
- **Puntos totales** acumulados
- **CVs creados** y **publicados**
- **Visitas recibidas**
- **Progreso** al siguiente nivel
- **Badges** desbloqueados

#### Ranking Global
- Ve a la sección **Ranking**
- Compara tu posición con otros usuarios
- Identifica a los creadores más destacados

### 6. Subir de Nivel

| Nivel | Puntos Requisito | Título |
|-------|-----------------|--------|
| 1 | 0 | Novato |
| 2 | 100 | Aprendiz |
| 3 | 500 | Maestro |
| 4 | 1,500 | Experto |
| 5 | 5,000 | Leyenda |

---

## 🔌 API Reference

### Autenticación

#### POST /auth/register
Registra un nuevo usuario.

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepass123",
  "full_name": "Nombre Completo"
}
```

**Response:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": { "id": "...", "username": "...", "email": "..." },
  "token": "jwt_token_here"
}
```

#### POST /auth/login
Inicia sesión de usuario.

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

#### GET /auth/me
Obtiene el perfil del usuario actual.

**Headers:** `Authorization: Bearer <token>`

### CVs

#### POST /cv/create
Crea un nuevo CV.

```json
{
  "yaml_content": "cv:\n  name: John Doe\n  ...",
  "design": { "theme": "classic" }
}
```

#### GET /cv/browse
Explora CVs públicos.

**Query params:**
- `skip`: Offset (default 0)
- `limit`: Límite (default 20)
- `sort_by`: "created" | "popular" | "visited"

#### GET /cv/public/{slug}
Obtiene un CV público por slug.

#### POST /cv/{cv_id}/visit
Registra una visita a un CV.

#### POST /cv/{cv_id}/like
Toggle like en un CV.

#### POST /cv/{cv_id}/comment
Agrega un comentario a un CV.

```json
{
  "content": "¡Excelente CV!",
  "parent_id": null
}
```

### Gamificación

#### GET /gamification/leaderboard
Obtiene el ranking de usuarios.

**Query params:**
- `limit`: Cantidad de usuarios (default 100)

#### GET /gamification/stats/me
Obtiene estadísticas del usuario actual.

#### GET /gamification/badges
Lista todos los badges disponibles.

---

## 🎮 Sistema de Gamificación

### Puntos por Acción

| Acción | Puntos Usuario | Puntos Receptor |
|--------|---------------|-----------------|
| Crear CV | 10 | - |
| Publicar CV | 50 | - |
| Visita recibida | - | 5 |
| Like dado | 2 | 20 |
| Like recibido | - | - (incluido arriba) |
| Comentario | 15 | 10 |
| Comentario recibido | - | - (
incluido arriba) |
| Badge desbloqueado | 100 | - |

### Cálculo de Niveles

```python
LEVEL_THRESHOLDS = {
    1: 0,      # Novato (0+ puntos)
    2: 100,    # Aprendiz (100+ puntos)
    3: 500,    # Maestro (500+ puntos)
    4: 1500,   # Experto (1500+ puntos)
    5: 5000,   # Leyenda (5000+ puntos)
}
```

### Sistema de Badges

Los badges se otorgan automáticamente al cumplir ciertas condiciones:

```python
BADGES = {
    'early_adopter': 'Primeros 100 usuarios',
    'top_creator': '10+ CVs publicados',
    'social_butterfly': '50+ comentarios',
    'popular': '100+ likes recibidos',
    'viral': '1000+ visitas en un CV',
    'legend': 'Nivel 5 alcanzado',
    'helper': '20+ likes en comentarios',
}
```

### Prevención de Abuso

- **Visitas**: Solo cuenta una visita por IP cada hora
- **Likes**: Un usuario puede dar like solo una vez por CV
- **Comentarios**: Puedes comentar múltiples veces, pero hay spam detection

---

## 💻 Desarrollo y Contribución

### Estructura del Código

#### Backend

```python
# app/models/database.py
# Define todos los modelos de la base de datos
# - User, UserProfile, CV, Comment, Like, Visit, PointHistory

# app/services/
# - auth_service.py: Registro, login, JWT tokens
# - gamification_service.py: Puntos, niveles, badges
# - render_service.py: Integración con RenderCV
# - yaml_service.py: Procesamiento de YAML

# app/api/
# - routes_auth.py: Endpoints de autenticación
# - routes_cv.py: Creación y edición de CVs
# - routes_cv_community.py: Landing pages, likes, comentarios
# - routes_gamification.py: Leaderboard, stats
```

#### Frontend

```typescript
// app/page.tsx - Homepage
// app/editor/page.tsx - Editor de CVs
// app/cv/[slug]/page.tsx - Landing page pública
// app/community/page.tsx - Galería de CVs
// app/leaderboard/page.tsx - Ranking de usuarios
// app/dashboard/page.tsx - Dashboard del usuario
// app/login/page.tsx - Login
// app/register/page.tsx - Registro
```

### Agregar Nuevas Características

#### 1. Nuevo Badge

1. Editar `backend/app/models/database.py`:
```python
BADGES = {
    # ... badges existentes
    'new_badge': {'name': 'Nombre', 'description': 'Descripción', 'icon': '🎖️'}
}
```

2. Editar `backend/app/services/gamification_service.py`:
```python
@staticmethod
def check_badges(db: Session, profile: UserProfile, action: str):
    # ... código existente
    if condition:
        badges_to_check.append('new_badge')
```

#### 2. Nueva Acción de Puntos

1. Editar `backend/app/models/database.py`:
```python
POINT_VALUES = {
    # ... valores existentes
    'new_action': 25,
}
```

2. Usar en el servicio:
```python
GamificationService.add_points(db, user_id, 'new_action', description)
```

### Testing

#### Pruebas de API
```bash
./test_api.sh
```

#### Pruebas Manuales
1. Inicia el backend y frontend
2. Ve a http://localhost:8000/docs
3. Prueba cada endpoint con Swagger UI

### Deploy

#### Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

#### Variables de Entorno de Producción

```bash
# backend/.env
PIXELCV_DB_URL=postgresql://user:pass@host/db
JWT_SECRET_KEY=secure-random-key-here
PIXELCV_STORAGE=/var/www/pixelcv/artefactos

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://api.pixelcv.com
```

---

## 📞 Soporte y Contribuciones

### Reportar Issues

Si encuentras un bug o tienes una sugerencia:
1. Ve a [GitHub Issues](https://github.com/tu-usuario/pixelcv_starter_local/issues)
2. Crea un nuevo issue con:
   - Título descriptivo
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Capturas de pantalla si aplica

### Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nueva-caracteristica`
3. Commit tus cambios: `git commit -m 'Agrega nueva característica'`
4. Push a la rama: `git push origin feature/nueva-caracteristica`
5. Abre un Pull Request

### Código de Conducta

- Respetar a todos los contribuidores
- Ser constructivo en feedback
- Seguir las convenciones de código existentes
- Documentar cambios significativos

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 🙏 Agradecimientos

- **RenderCV**: Por la increíble herramienta de generación de CVs
- **FastAPI**: Por el framework backend tan elegante
- **Next.js**: Por la experiencia de desarrollo React
- **Tailwind CSS**: Por el utility-first approach

---

## 📞 Contacto

- **Email**: support@pixelcv.com
- **Twitter**: [@PixelCV](https://twitter.com/PixelCV)
- **Discord**: [Únete a nuestra comunidad](https://discord.gg/pixelcv)

---

**Versión**: 2.0.0  
**Última actualización**: Diciembre 2024
