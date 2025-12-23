# 🌐 Flujo de Navegación y Autenticación - PixelCV

## 📋 Índice
1. [Páginas Públicas (Sin autenticación)](#pages-publicas)
2. [Páginas Privadas (Requieren autenticación)](#pages-privadas)
3. [Flujo de Usuario](#flujo-de-usuario)
4. [Componentes de Navegación](#componentes-de-navegacion)

---

## 🔓 Páginas Públicas (Sin autenticación)

### 📍 / - Página de Inicio
Accesible: Sin login
Contenido:
- Hero section con titulo "PixelCV"
- Botones: "Crear mi CV" → /register y "Explorar Comunidad" → /community
- Seccion de caracteristicas (CVs Profesionales, Asistente con IA, Gamificacion)
- CTA final: "Registrarse Gratis" y "Iniciar Sesion"

Navegacion visible (sin autenticar):
- Logo PixelCV (clic → inicio)
- Comunidad
- Ranking
- Botones: "Iniciar Sesion" y "Registrarse"

### 🔐 /login - Pagina de Inicio de Sesion
Accesible: Sin login
Formulario:
- Email (obligatorio)
- Contrasena (obligatorio)
- Boton "Iniciar Sesion"

Acciones al iniciar sesion con exito:
- Guarda token en localStorage
- Guarda datos de usuario en localStorage
- Redirige a la ruta guardada (si existe) o a /dashboard

Ayudas:
- Mensajes de error claros
- Link: "No tienes cuenta? Registrate gratis" → /register
- Boton: "← Volver al inicio" → /

### 📝 /register - Pagina de Registro
Accesible: Sin login
Formulario:
- Nombre de usuario (obligatorio)
- Nombre completo (opcional)
- Email (obligatorio)
- Contrasena (obligatorio)
  - Nota: "La contrasena sera truncada automaticamente si es muy larga"
- Boton "Crear Cuenta"

Acciones al registrarse con exito:
- Guarda token en localStorage
- Guarda datos de usuario en localStorage
- Redirige automaticamente a /dashboard

Ayudas:
- Mensajes de error claros
- Link: "Ya tienes cuenta? Inicia sesion" → /login
- Boton: "← Volver al inicio" → /

### 👥 /community - Pagina de Comunidad
Accesible: Sin login (publico)
Contenido:
- Explora CVs publicos
- Ver, dar like y comentar CVs
- Sin restricciones de visualizacion

### 🏆 /leaderboard - Pagina de Ranking
Accesible: Sin login (publico)
Contenido:
- Ranking de usuarios
- Top por puntos y nivel
- Visible para todos los visitantes

---

## 🔒 Páginas Privadas (Requieren autenticacion)

### 📊 /dashboard - Dashboard del Usuario
Accesible: Solo con login (protegido por PrivateRoute)
Contenido:
- Saludo personalizado: "👋 Bienvenido, {username}!"
- Estadisticas:
  - 📄 CVs creados
  - ⭐ Puntos
  - 🏅 Nivel
- Tarjeta destacada: "✨ Crea tu primer CV"
  - Boton: "🚀 Crear CV con Asistente" → /editor
- Seccion: "📋 Tus CVs"
  - Lista de CVs creados
  - Si no hay CVs: mensaje de invitacion a crear uno

Navegacion visible (usuario autenticado):
- Logo PixelCV (clic → inicio)
- 📊 Dashboard
- ✏️ Crear CV
- 👥 Comunidad
- Avatar del usuario + nombre
- Boton: "Cerrar Sesion"

### ✏️ /editor - Asistente de CV Inteligente
Accesible: Solo con login (protegido por PrivateRoute)
Contenido:
- Asistente paso a paso en 6 etapas:
  1. 📄 Informacion Personal
  2. 💼 Experiencia Laboral
  3. 🎓 Educacion
  4. ⚡ Habilidades
  5. 📝 Resumen Profesional
  6. ✨ Generar y Descargar

Caracteristicas:
- Barra de progreso visual
- Validacion de campos obligatorios
- Integracion con IA (Ollama) para mejorar contenido
- Agregar/eliminar multiples trabajos y educacion
- Generacion automatica de PDF con RenderCV
- Descarga directa del PDF

Ayudas:
- Descripcion clara en cada paso
- Placeholders explicativos
- Mensajes de error especificos
- Indicacion de que hara la IA antes de generar

---

## 🔄 Flujo de Usuario

### Flujo 1: Usuario Nuevo (Sin registro)

1. Llega a / (pagina de inicio)
   - Ve la propuesta de valor
   - Decide registrarse

2. Clic en "Crear mi CV" o "Registrarse" → /register
   - Completa formulario de registro
   - Ingresa nombre, email, contrasena

3. Registro exitoso
   - Token guardado en localStorage
   - Usuario autenticado automaticamente
   - Redirige a /dashboard

4. En el Dashboard
   - Ve sus estadisticas (0 CVs, 0 puntos, Novato)
   - Clic en "Crear CV con Asistente"

5. En el Asistente (/editor)
   - Completa 6 pasos del formulario
   - Clic en "🚀 Generar CV con IA"
   - Descarga su CV en PDF

### Flujo 2: Usuario Registrado

1. Accede a /login
   - Ingresa email y contrasena

2. Login exitoso
   - Token guardado en localStorage
   - Redirige a /dashboard

3. Navegacion por el sistema:
   - Desde Navbar puede ir a:
     - Dashboard
     - Crear CV
     - Comunidad
     - Cerrar Sesion

### Flujo 3: Acceso directo a pagina protegida

1. Usuario intenta acceder a /editor o /dashboard sin token
   - PrivateRoute detecta falta de autenticacion
   - Guarda ruta actual en localStorage (redirectAfterLogin)
   - Redirige a /login

2. Usuario inicia sesion
   - Token guardado en localStorage
   - Redirige automaticamente a la ruta guardada

---

## 🧩 Componentes de Navegacion

### Navbar (components/Navbar.tsx)
Funcionalidades:
- Logo PixelCV siempre visible y clickeable
- Adapta su contenido segun estado de autenticacion
- Menu movil responsive
- Informacion del usuario cuando esta autenticado
- Boton de cerrar sesion

Sin autenticar muestra:
- Comunidad
- Ranking
- Boton "Iniciar Sesion"
- Boton "Registrarse"

Autenticado muestra:
- Dashboard
- Crear CV
- Comunidad
- Avatar y nombre del usuario
- Boton "Cerrar Sesion"

### PrivateRoute (components/PrivateRoute.tsx)
Funcionalidades:
- Protege rutas que requieren autenticacion
- Verifica existencia de token en localStorage
- Guarda ruta actual para redireccion despues del login
- Muestra pantalla de carga mientras verifica autenticacion

Rutas protegidas:
- /dashboard
- /editor

---

## 🔐 Seguridad y Autenticacion

### Token JWT
- Almacenado en: localStorage
- Clave: 'token'
- Uso: En header Authorization como 'Bearer {token}'

### Datos de Usuario
- Almacenados en: localStorage
- Clave: 'user'
- Formato: JSON con datos del usuario

### Persistencia
- Token y datos persisten entre sesiones
- Navbar verifica autenticacion en cada cambio de ruta
- Cerrar sesion limpia localStorage

---

## 📱 Diseño Responsive

### Desktop (md+)
- Navbar horizontal con todos los enlaces
- Informacion completa del usuario visible
- Botones de accion completos

### Mobile
- Menu hamburguesa desplegable
- Enlaces en lista vertical
- Avatar visible, nombre oculto
- Botones de accion simplificados

---

## 🎨 Estilos y UX

### Colores
- Fondo: Gradiente slate-900 via purple-900
- Texto principal: blanco
- Texto secundario: purple-300
- Acentos: purple-600 y pink-600
- Errores: red-400/red-300
- Exitos: green-300

### Estados y Feedback
- Loading: Spinner animado
- Errores: Mensajes claros en rojo
- Exitos: Mensajes de confirmacion
- Progreso: Barra visual de progreso

### Interactividad
- Hover effects en botones y enlaces
- Transiciones suaves
- Click en logo regresa al inicio
- Mobile menu animado

---

## 🔗 Estructura de Rutas

```
/
├── /                      [Publico] Página de inicio
├── /login                 [Publico] Inicio de sesion
├── /register              [Publico] Registro
├── /community             [Publico] Explorar CVs
├── /leaderboard           [Publico] Ranking
├── /dashboard            [Privado] Panel de usuario
└── /editor               [Privado] Asistente de CV
```

[Privado] = Requiere autenticacion (protegido por PrivateRoute)
[Publico] = Accesible sin autenticacion

---

## 💾 Almacenamiento en Cliente (localStorage)

### Claves utilizadas:
1. 'token' - JWT de autenticacion
2. 'user' - Datos del usuario en JSON
3. 'redirectAfterLogin' - Ruta a redirigir despues de login

### Manejo:
- Login: Guarda token y user
- Logout: Elimina token, user y redirectAfterLogin
- PrivateRoute: Lee token, guarda redirectAfterLogin si no existe

---

## 🚀 Redirecciones Automáticas

### Desde /login
- Exitoso → /dashboard (o ruta guardada)
- Cerrar sesion → /

### Desde /register
- Exitoso → /dashboard
- Volver al inicio → /

### Desde /dashboard
- Crear CV → /editor
- Comunidad → /community
- Cerrar sesion → /

### Desde /editor
- Generar CV exitoso → Permanece en /editor
- Volver (desde navbar) → /dashboard o /community

---

## 📊 Resumen de Funcionalidades

### Sin Autenticacion Puede:
- Ver pagina de inicio
- Ver y explorar comunidad
- Ver ranking
- Registrarse
- Iniciar sesion

### Con Autenticacion Puede:
- Todo lo anterior
- Ver dashboard personal
- Crear CVs con asistente
- Ver estadisticas
- Cerrar sesion

### No Puede:
- Acceder a /dashboard sin autenticar
- Acceder a /editor sin autenticar
- Crear CVs sin estar registrado

---

## ✅ Checklist de Implementacion

- [x] Navbar adaptativo
- [x] Proteccion de rutas privadas
- [x] Flujo de login y registro
- [x] Redireccion despues de login
- [x] Menu movil responsive
- [x] Mensajes de error claros
- [x] Indicadores de carga
- [x] Persistencia de sesion
- [x] Cierre de sesion
- [x] Navegacion fluida entre paginas
