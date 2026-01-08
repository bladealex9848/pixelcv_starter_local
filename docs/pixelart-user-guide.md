# Guía de Usuario - PixelArt en PixelCV

**Última actualización**: 08/01/2026
**Versión**: 2.0

---

## Índice

1. [Introducción](#introducción)
2. [Editor de PixelArt](#editor-de-pixelart)
3. [Generación con IA](#generación-con-ia)
4. [Herramientas de Dibujo](#herramientas-de-dibujo)
5. [Compartir y Exportar](#compartir-y-exportar)
6. [Galería Comunitaria](#galería-comunitaria)
7. [Tips y Trucos](#tips-y-trucos)
8. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

PixelCV incluye un completo editor de PixelArt con generación por IA. Puedes crear tus obras manualmente o usar IA para generar desde descripciones en lenguaje natural.

**Características principales:**
- ✏️ Editor de 32x32 píxeles
- 🤖 Generación con IA multi-proveedor
- 🛠️ Herramientas profesionales (pincel, borrador, relleno, gotero)
- ↩️ Undo/Redo ilimitado
- 💾 Exportar a PNG
- 🌐 Galería comunitaria con likes y comentarios

---

## Editor de PixelArt

### Acceder al Editor

1. Ve a `/community/pixelart`
2. Haz clic en **"Nueva Creación"**
3. Accederás al editor completo

### Interfaz del Editor

```
┌─────────────────────────────────────────────────────────────┐
│  [Canvas 32x32]          │  Panel de Herramientas          │
│  ┌────────────────────┐  │  ┌──────────────────────────┐  │
│  │                    │  │  │ Título de la obra        │  │
│  │    (Editor)        │  │  │ [___________________]     │  │
│  │                    │  │  ├──────────────────────────┤  │
│  │                    │  │  │ 🛠️ Herramientas          │  │
│  │                    │  │  │ [✏️] [🧹] [🪣] [💉]      │  │
│  │                    │  │  ├──────────────────────────┤  │
│  │                    │  │  │ Paleta de Color          │  │
│  │                    │  │  │ [Color Picker]           │  │
│  │                    │  │  │ [██][██][██][██]         │  │
│  └────────────────────┘  │  ├──────────────────────────┤  │
│  ↩️ Undo ↪️ Redo          │  │ 🤖 Generación IA          │  │
│  🗑️ Limpiar 💾 Exportar  │  │ [Prompt____________]      │  │
│                          │  │ [Generar con IA]         │  │
│                          │  ├──────────────────────────┤  │
│                          │  │ [Publicar en Galería]    │  │
│                          │  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Generación con IA

### ¿Cómo funciona?

La IA genera pixelart desde descripciones en **español o inglés**. Simplemente describe lo que quieres crear y la IA generará una imagen de 32x32 píxeles.

### Escribir un Buen Prompt

**✅ Ejemplos de buenos prompts:**

```
"Paisaje con casa y rio, y el sol iluminando y cielo azul"

"Gato negro con ojos verdes sentado en una pared"

"Castillo medieval con torres y banderas"

"Pizza con pepperoni y champiñones"

"Astronauta en la luna con la tierra visible"
```

**❌ Evitar:**

- Prompts demasiado vagos: "algo bonito"
- Instrucciones contradictorias: "un gato que es un perro"
- Demasiados elementos (más de 5 objetos principales)

### Tips para Mejores Resultados

1. **Específico es mejor**
   - ✅ "Casa roja con teclado azul"
   - ❌ "Una casa"

2. **Menciona colores**
   - ✅ "Árbol verde con tronco marrón"
   - ❌ "Un árbol"

3. **Incluye posiciones**
   - ✅ "Sol en el cielo, casa abajo"
   - ❌ "Sol y casa"

4. **Sé creativo pero claro**
   - ✅ "Dragón rojo volando sobre montañas"
   - ❌ "Algo volando con montañas"

### Sistema de Reintentos Automáticos

Si la primera generación no es satisfactoria, el sistema reintenta automáticamente hasta 3 veces con variaciones del prompt para mejorar el resultado.

---

## Herramientas de Dibujo

### ✏️ Pincel (Pencil)

**Uso:** Dibuja píxel por píxel o arrastrando el mouse.

**Atajo:** `P` (planeado)

**Tips:**
- Mantén presionado el clic para dibujar líneas continuas
- Usa colores de alto contraste para mejor visibilidad

### 🧹 Borrador (Eraser)

**Uso:** Borra píxeles (los pone en blanco).

**Atajo:** `E` (planeado)

**Tips:**
- Útil para corregir errores pequeños
- No elimina el historial (puedes usar Undo)

### 🪣 Relleno (Fill Bucket)

**Uso:** Rellena un área completa del mismo color.

**Algoritmo:** Flood Fill (búsqueda en profundidad)

**Tips:**
- Funciona mejor en áreas cerradas
- Si el área tiene "bordes", el relleno se detiene allí
- Ideal para fondos o áreas grandes

### 💉 Gotero (Color Picker)

**Uso:** Copia el color de un píxel existente.

**Tips:**
- Después de copiar, vuelve automáticamente al Pincel
- Útil para colorear partes existentes
- Preserva el color exacto (incluyendo hex)

---

## Compartir y Exportar

### 💾 Exportar a PNG

1. Haz clic en **"Exportar PNG"**
2. La imagen se descarga como `titulo.png`
3. Resolución: 512x512px (16x por píxel original)

**Usos:**
- Compartir en redes sociales
- Usar como avatar
- Incluir en otros proyectos

### Publicar en Galería

1. Escribe un título para tu obra
2. (Opcional) Si usaste IA, el prompt se guarda automáticamente
3. Haz clic en **"Publicar en Galería"**
4. Tu obra estará visible en `/community/pixelart`

**Beneficios:**
- ❤️ Recibe likes de la comunidad
- 💬 Obtén comentarios
- 🏆 Gana puntos para el leaderboard
- 👤 Otros pueden usarla como avatar

### Compartir con Metadata OG

Cada pixelart publicado tiene su propia página con metadata para redes sociales:

- URL: `/community/pixelart/[id]`
- Imagen OG automática con tu pixelart
- Compartible en WhatsApp, Facebook, Twitter, LinkedIn

---

## Galería Comunitaria

### Navegar la Galería

1. Ve a `/community/pixelart`
2. Explora obras de la comunidad
3. Haz clic en cualquier pixelart para verlo en detalle

### Interactuar con Obras

**Dar Like:**
- Haz clic en el botón ❤️
- El autor recibe puntos de gamificación

**Comentar:**
- Haz clic en el botón 💬
- Escribe tu comentario
- El autor recibe puntos y notificación

**Usar como Avatar:**
- Haz clic en 👤 Avatar
- El pixelart se convierte en tu foto de perfil

**Tus Obras:**
- ✏️ Editar título
- 🗑️ Borrar obra
- 👤 Usar como avatar

---

## Tips y Trucos

### Para Dibujo Manual

1. **Empieza con siluetas**
   - Dibuja primero la forma básica
   - Luego añade detalles

2. **Usa una paleta limitada**
   - 3-5 colores es suficiente
   - Demasiados colores puede verse confuso

3. **Contraste es clave**
   - Usa colores oscuros para bordes
   - Usa colores claros para highlights

4. **Aprovecha el Undo/Redo**
   - Experimenta sin miedo
   - Puedes deshacer cualquier cambio

### Para Generación IA

1. **Itera sobre el resultado**
   - Si no te gusta, regenera
   - Ajusta el prompt basado en el resultado

2. **Combina IA + Manual**
   - Genera la base con IA
   - Refina manualmente los detalles
   - Mejor que cualquiera de los dos métodos por separado

3. **Aprende de la comunidad**
   - Mira qué prompts funcionaron
   - Inspírate en obras existentes

---

## Preguntas Frecuentes

### ¿Cuál es el tamaño del canvas?

El canvas es de **32x32 píxeles** (1024 píxeles totales). Al exportar a PNG, se escala a **512x512px** para mejor visibilidad.

### ¿Puedo animar mi pixelart?

No actualmente. La animación está en la roadmap para futuras versiones.

### ¿La IA guarda mis prompts?

Sí, si publicas la obra, el prompt original se guarda y es visible para otros usuarios como inspiración.

### ¿Cuántos puntos gano por crear pixelart?

- **Creación manual**: +10 puntos
- **Generación con IA**: +20 puntos
- **Like recibido**: +5 puntos
- **Comentario recibido**: +10 puntos

### ¿Puedo editar obras después de publicarlas?

Sí, puedes editar el título de tus obras en cualquier momento desde la galería.

### ¿Puedo borrar mis obras?

Sí, puedes borrar tus propias obras desde la galería. Esto elimina también los likes y comentarios asociados.

### ¿Puedo usar pixelart de otros como avatar?

Sí, puedes usar cualquier pixelart de la comunidad como tu avatar, solo haz clic en el botón 👤 Avatar.

---

## Atajos de Teclado (Planeados)

| Atajo | Acción |
|-------|--------|
| `P` | Pincel |
| `E` | Borrador |
| `F` | Relleno |
| `I` | Gotero (Eyedropper) |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Guardar (Publicar) |
| `Ctrl+E` | Exportar PNG |

*Nota: Los atajos están en desarrollo y estarán disponibles en futuras versiones.*

---

## Recursos Adicionales

- **Documentación técnica**: `/root/pixelcv/docs/pixelart-system-architecture.md`
- **Métodos de creación OG**: `/root/pixelcv/docs/pixelart-og-creation-methods.md`
- **API Backend**: `/root/pixelcv/backend/app/api/routes_pixelart.py`
- **Soporte**: Crea un issue en GitHub

---

## Changelog

### v2.0 (08/01/2026)
- ✨ Nuevo sistema de generación IA con reintentos
- ✨ Herramientas mejoradas (Fill, Picker, Eraser)
- ✨ Undo/Redo completo
- ✨ Exportar a PNG
- ✨ Imágenes OG dinámicas para compartir
- ✨ Páginas individuales por pixelart
- 🐛 Fix: Generación IA ahora respeta todos los elementos del prompt

### v1.0 (15/12/2025)
- 🎉 Lanzamiento inicial
- ✏️ Editor básico de 32x32
- 🤖 Generación con IA
- 🌐 Galería comunitaria
- ❤️ Sistema de likes
