# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

## [2.0.0] - 2024-12

### Añadido 🆕

#### Backend
- Sistema completo de autenticación con JWT
- Modelos de base de datos extendidos:
  - User, UserProfile
  - CV con publicaciones
  - Comments con respuestas
  - Likes
  - Visits con anti-spam
  - PointHistory
- Servicio de gamificación:
  - Sistema de puntos por acciones
  - 5 niveles (Novato → Leyenda)
  - 7 badges desbloqueables
  - Leaderboard global
  - Estadísticas de usuario
- Endpoints de comunidad:
  - Explorar CVs públicos
  - Landing pages por slug
  - Likes y dislikes
  - Sistema de comentarios
  - Registro de visitas

#### Frontend
- Homepage rediseñada con estilo gamer/futurista
- Landing pages para CVs públicos (`/cv/[slug]`)
- Galería de comunidad con filtros
- Leaderboard de usuarios
- Dashboard personal con estadísticas
- Páginas de login y registro
- Sistema de autenticación completo
- UI con gradiente purple/pink
- Glassmorphism y efectos visuales

#### Scripts y Configuración
- `INSTALL.sh` - Script de instalación automática
- `START.sh` - Inicio de backend y frontend
- `test_api.sh` - Pruebas de la API
- Documentación completa (`DOCUMENTATION.md`)
- README actualizado
- Backend y frontend READMEs
- LICENSE (MIT)
- .gitignore configurado

### Cambiado 🔄

- Migración de estructura básica a sistema completo de comunidad
- Integración de autenticación en todos los endpoints
- Rediseño completo del frontend con Tailwind
- Base de datos extendida con tablas de comunidad

### Mejorado ✨

- Sistema anti-spam para visitas
- Validación de datos con Pydantic
- CORS configurado correctamente
- Documentación Swagger UI
- Type safety con TypeScript
- Responsive design

### Corregido 🐛

- Configuración de paths del backend
- Variables de entorno del frontend
- Estructura de carpetas del frontend

---

## [1.0.0] - 2024-12

### Inicial

- Backend básico con FastAPI
- Frontend básico con Next.js
- Integración con RenderCV
- Integración con Ollama para IA
- Sistema de CVs YAML
- Generación de PDFs

---

**Formato del changelog:**
- `Añadido` - Nuevas características
- `Cambiado` - Cambios en funcionalidad existente
- `Mejorado` - Mejoras en funcionalidad existente
- `Corregido` - Corrección de bugs
- `Eliminado` - Funcionalidad eliminada
