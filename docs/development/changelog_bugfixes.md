# 🐛 Changelog - Corrección de Errores

## 🚀 Versión v2.0.2 - Correcciones Críticas de Frontend

**Fecha:** 24 de Diciembre de 2024
**Estado:** Implementado

---

## 🛠 Correcciones Realizadas

### 1. Interpolación de Variables de Entorno en Frontend
**Problema:** Se estaban utilizando comillas simples `'` en lugar de backticks `` ` `` al interpolar `process.env.NEXT_PUBLIC_API_URL` en las llamadas `fetch`. Esto provocaba que las peticiones se dirigieran literalmente a la cadena `${process.env.NEXT_PUBLIC_API_URL}...` en lugar de la URL real de la API, causando errores 404 y SyntaxError en el navegador.

**Solución:** Se reemplazaron todas las instancias incorrectas por la sintaxis correcta de Template Literals en los siguientes archivos:
- `frontend/components/CVWizard.tsx` (4 ocurrencias)
- `frontend/app/editor/[id]/page.tsx` (3 ocurrencias)
- `frontend/app/dashboard/page.tsx` (2 ocurrencias)

### 2. Configuración de Variables de Entorno
**Problema:** La variable `NEXT_PUBLIC_API_URL` no estaba definida en el entorno de ejecución local, lo que agravaba el problema de conexión con el backend.

**Solución:** Se creó el archivo `frontend/.env.local` con la configuración correcta para el desarrollo local:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Nota:** Este archivo no se sube al repositorio por seguridad (está en .gitignore), pero es necesario crearlo en cada despliegue.

---

## 🧪 Verificación
- Las peticiones a `/ollama/models`, `/ollama/improve-bullets`, `/cv`, etc., ahora deberían construirse con la URL base correcta.
- El error `SyntaxError: Unexpected token '<'` debería desaparecer al recibir respuestas JSON válidas de la API en lugar de páginas de error HTML 404.
