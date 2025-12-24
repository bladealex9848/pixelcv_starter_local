# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

## [2.1.0] - 2024-12-23

### Añadido 🆕

#### Funcionalidades de IA Avanzada
- **Revisión Interactiva:** Modal "lado a lado" para comparar sugerencias de IA con el texto original antes de aceptar.
- **IA Contextual:** Botones "✨ Mejorar" integrados directamente en los campos de Experiencia, Habilidades y Resumen del editor.
- **Regeneración Guiada:** Capacidad de dar instrucciones personalizadas a la IA (ej: "Hazlo más corto", "Enfócate en ventas") para regenerar sugerencias.
- **Revisión Integral:** Nuevo botón "🔍 Revisión Integral" que analiza todo el CV y genera un informe de fortalezas y debilidades.
- **Robustez en Ollama:** Parser mejorado para manejar respuestas ruidosas o múltiples bloques JSON de modelos pequeños (Phi-3.5).

#### Gestión de Temas
- **Selector Visual de Temas:** Nueva interfaz en el paso 6 para elegir entre 5 temas de RenderCV (`classic`, `moderncv`, `sb2nov`, etc.) con vista previa.
- **Persistencia de Diseño:** El tema seleccionado se guarda correctamente en la base de datos y se recupera al editar.

#### Documentación y Scripts
- **Reestructuración de Documentación:** Movimiento de documentación a carpeta `docs/` organizada por categorías (`installation`, `development`, `scripts`).
- **PixelCV Diagnostic Suite:** Nueva herramienta web (`docs/test-interactivo.html`) para probar la salud del sistema y las funciones de IA.
- **Limpieza Automática:** El script `run.sh` ahora limpia la caché de Next.js para asegurar que los cambios se reflejen.

### Corregido 🐛

- Error 422 en endpoint `/improve-bullets` al usar modelos Pydantic correctamente.
- Duplicación de código en `CVWizard.tsx` que impedía la compilación.
- Error en `routes_cv.py` que no guardaba la configuración de diseño al actualizar un CV.
- Visibilidad condicional de opciones de IA cuando no hay modelos disponibles.

---

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
