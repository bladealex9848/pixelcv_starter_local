# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

## [2.4.4] - 2024-12-24

### Correcciones 🐛

- **Página de CV Público - URL de PDF Incorrecta:** Solucionado problema de ruta absoluta en PDF:
  - **Problema:** El `pdf_url` devolvía ruta absoluta del sistema de archivos (`/Volumes/NVMe1TB/...`)
  - **Solución:** Cambiado a URL relativa (`/cv/{cv_id}/pdf`) en `backend/app/api/routes_cv_community.py`
  - **Resultado:** Descarga de PDF funcional desde la interfaz pública

- **Visualización de Contenido YAML:** Mejorada la visualización del contenido del CV:
  - **Problema:** El contenido YAML se mostraba como texto plano sin contexto
  - **Solución:** Agregado diseño estructurado con título, fondo gris y explicación clara
  - **Resultado:** Interfaz más profesional con enlace directo al PDF

### Mejorado ✨

- **Backend API:** Normalización de URLs en endpoints públicos
- **Frontend UX:** Explicación clara sobre el formato YAML y enlace al PDF
- **Consistencia:** Mismo comportamiento de descarga que en dashboard y editor

## [2.4.3] - 2024-12-24

### Correcciones 🐛

- **Página de CV Público - Navbar Duplicado:** Eliminado navbar redundante en página de visualización de CV:
  - **Problema:** La página `/cv/[slug]` tenía su propio navbar además del navbar principal del layout
  - **Solución:** Eliminado el header duplicado y ajustado el padding superior (pt-20) para evitar superposición
  - **Resultado:** Interfaz limpia con un solo navbar consistente en toda la aplicación

- **Visualización de Contenido YAML:** Mejorada la visualización del contenido del CV:
  - **Problema:** El contenido YAML no se mostraba correctamente o aparecía espacio en blanco
  - **Solución:** Agregado manejo de contenido condicional y estilos mejorados (min-h-[500px], overflow-x-auto)
  - **Resultado:** Visualización clara del contenido YAML con scroll horizontal si es necesario

### Mejorado ✨

- **Experiencia de Usuario:** Eliminada confusión de navegación con navbar duplicado
- **Diseño Responsivo:** Mejorada la visualización en diferentes tamaños de pantalla
- **Manejo de Errores:** Agregado mensaje amigable cuando el contenido no está disponible

## [2.4.2] - 2024-12-24

### Correcciones 🐛

- **Editor de CV - Errores de Compilación:** Solucionados errores críticos de sintaxis JSX:
  - **Error 1:** "Unexpected token `div`. Expected jsx identifier" en línea 347
    - **Causa:** Div principal sin cierre adecuado
    - **Solución:** Agregado cierre de div principal (`</div>`) antes del cierre de función
  - **Error 2:** "Unexpected token. Did you mean `{'}'}` or `&rbrace;`" en línea 579
    - **Causa:** Estructura incorrecta de cierre de componentes
    - **Solución:** Balanceado correctamente todos los divs (49 abiertos / 49 cerrados)
  - **Error 3:** Componente AIButton con sintaxis incorrecta
    - **Causa:** Función flecha dentro de componente React
    - **Solución:** Cambiado de `const AIButton = () => {}` a `function AIButton() {}`
  - **Resultado:** Compilación exitosa de Next.js y eliminación de todos los errores de sintaxis

### Mejorado ✨

- **Limpieza de Código:** Eliminados espacios innecesarios en props de AIButton
- **Consistencia:** Unificado estilo de className en botones de IA
- **Estructura:** Mejorada la organización del componente EditorContent

## [2.4.1] - 2024-12-24

### Cambios 🎨

- **CVWizard - Estilos Consistentes:** Unificación de estilos en todos los campos de formulario del wizard:
  - **Paso 1 (Información Personal):** Inputs con fondo negro y bordes purple-900
  - **Paso 2 (Experiencia Laboral):** Inputs y textarea con fondo negro consistente
  - **Paso 3 (Educación):** Inputs con fondo negro consistente
  - **Paso 4 (Habilidades):** Textarea con fondo negro agregado
  - **Paso 5 (Resumen Profesional):** Textarea con fondo negro agregado
  - **Paso 6 (Estilo y Generación):** Select de modelo con fondo negro agregado
  - **Eliminado:** Código duplicado en className y estilos inconsistentes
  - **Resultado:** Diseño retro completamente consistente en todos los pasos del wizard

### Correcciones 🐛

- Eliminado código duplicado `text-white focus:outline-none focus:border-purple-400` en className
- Eliminados estilos `rounded` y bordes inconsistentes en pasos 2 y 3
- Estandarizados todos los inputs a usar `bg-black border-2 border-purple-900`

---

## [2.4.0] - 2024-12-24

### Añadido 🆕

- **Diseño Retro Completo - Dashboard:** Tema azul/cian estilo "Player Stats" con estética gamer única:
  - **Fondo:** Base oscura #020812 con grid ciano y scanlines CRT
  - **Animaciones:** Efectos twinkle, float, glow-pulse en elementos flotantes
  - **Tarjetas de Estadísticas:** Diseño pixel-art con bordes animados y efectos hover
  - **Iconos flotantes:** 📊🎯⚡ con animaciones suaves
  - **Texto de fondo:** "PLAYER HUB" gigante en ciano semitransparente
  - **Gradientes:** De cyan-400 a blue-600 con efectos de brillo
  - **Botones:** Con clip-path y sombras de neón al hacer hover

### Cambiado 🔄

- **Dashboard (app/dashboard/page.tsx):**
  - Paleta de colores: Ambar → Cyan/Blue/Teal
  - Bordes: De amber-900 a cyan-900, blue-900, teal-900
  - Texto: De amber-400/orange a cyan-400/blue-400/teal-400
  - Añadida clase scanline-effect para efecto CRT
  - Añadidas animaciones personalizadas de Tailwind

### Mejorado ✨

- **Sistema de Animaciones Globales (tailwind.config.js):**
  - Añadidos keyframes: twinkle, float-slow/medium/delayed, glow-pulse, scanline, glitch, pixel-border, slide-in, fade-in, bounce-retro
  - Añadidos colores: retroGreen, retroCyan, retroPurple, retroPink
  - Todos los efectos configurados para consistencia

- **Estilos CSS Globales (globals.css):**
  - Añadida clase .crt-effect para líneas de escaneo
  - Añadida clase .scanline-effect para escaneo vertical
  - Añadida clase .pixel-border con gradiente rotativo
  - Añadidas clases .glow-text y .glow-box para efectos de brillo
  - Añadida clase .retro-card con efecto de brillo en hover
  - Añadidas animaciones gradient-rotate y scanline
  - Añadidos fondos de grid: grid-background, grid-background-purple, grid-background-green

- **Editor de CV (app/editor/[id]/page.tsx):**
  - Tema morado/rosa estilo "Game Editor" con estética gamer única
  - Fondo: Base oscura #0f0815 con grid morado y scanlines CRT
  - Header actualizado con gradiente purple-400 a pink-600
  - Inputs actualizados con bordes pixel-art y fuentes monoespaciadas
  - Añadidos efectos de hover con sombras de neón
  - Barra de progreso con gradiente purple-500 a pink-500

- **CVWizard (components/CVWizard.tsx):**
  - Tema consistente con el editor (morado/rosa estilo "Game Mode")
  - Fondo: Base oscura #0f0815 con grid morado y scanlines CRT
  - Header actualizado con gradiente purple-400 a pink-600
  - Badge "Game Mode" con animación pulse
  - Inputs y tarjetas actualizadas con bordes pixel-art
  - Añadidos efectos de hover y transiciones suaves

## [2.3.0] - 2024-12-24

### Añadido 🆕

- **Estilo Retro Completo:** Rediseño de todas las páginas públicas con estética retro/gamer única por sección:
  - **Login:** Tema verde ("Player Login") con efectos CRT y bordes pixel art
  - **Register:** Tema cyan ("New Player") con iconos de gaming flotantes
  - **Home:** Tema morado con glitch text y sección "How it Works"
  - **Community:** Tema rosa con loading arcade y cards estilo pixel
  - **Leaderboard:** Tema dorado con podio visual top 3 y tabla retro
- **Renderizado Markdown:** El modal de análisis de CV ahora renderiza Markdown correctamente con `react-markdown` y estilos prose.
- **Dependencias Frontend:**
  - `react-markdown` y `remark-gfm` para renderizado de contenido
  - `@tailwindcss/typography` para estilos prose

### Mejorado ✨

- **Modal de Análisis IA:** Títulos, listas y negritas ahora se visualizan correctamente en lugar de mostrar Markdown crudo.
- **Consistencia Visual:** Todas las páginas ahora tienen scanlines CRT, grid de fondo, estrellas pixel flotantes y tipografía retro.

### Corregido 🐛

- Error de tipos TypeScript en `improvedContent` en editor y CVWizard que impedía el build.

---

## [2.2.0] - 2024-12-23

### Añadido 🆕

- **Sección de Modelos:** Nueva página interactiva con estética retro-gamer (pixel art) que muestra el catálogo de IAs disponibles.
- **Benchmark de IA:** Sistema de validación automática de modelos con métricas de Precisión, Recall y F1-Score.
- **Gráficos de Rendimiento:** Visualización comparativa de latencia y precisión dentro de la aplicación.
- **Soporte Gemma 3 & Qwen 3:** Integración y validación de los últimos modelos ligeros de Google y Alibaba.

### Mejorado ✨

- **Feedback de IA:** Indicadores de carga y bloqueo de UI mejorados para evitar colisiones en procesos largos.
- **Robustez de Red:** Timeouts aumentados a 300s para soportar análisis complejos en servidores remotos.

---

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
