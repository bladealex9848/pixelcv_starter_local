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

## 🚀 Versión v2.0.3 - Estabilización de Despliegue (28 Dic 2025)

### 3. Error de TypeScript en Build de Producción (Error 502)
**Problema:** Un error de sintaxis en `tryModelImprove` (parámetro obligatorio después de opcional) rompía el build de producción (`npm run build`). El script de recuperación intentaba lanzar el modo dev en un puerto ocupado, tumbando el servicio.
**Solución:** Se hizo opcional el parámetro `model` en `frontend/app/editor/[id]/page.tsx` y `frontend/components/CVWizard.tsx`.
**Referencia:** [Reporte de Incidente](incident_report_2025_12_28.md)

### 4. ImportError en Backend (PixelArtService)
**Problema:** `PixelArtService` intentaba importar una clase inexistente `OllamaService` en lugar de usar las funciones directas del módulo, causando un error 502 al iniciar el backend.
**Solución:** Se actualizó `backend/app/services/pixelart_service.py` para importar y usar `generate_text` directamente.
**Referencia:** [Reporte de Incidente](incident_report_2025_12_28_backend_import.md)

---

## 🧪 Verificación
- Las peticiones a `/ollama/models`, `/ollama/improve-bullets`, `/cv`, etc., ahora deberían construirse con la URL base correcta.
- El error `SyntaxError: Unexpected token '<'` debería desaparecer al recibir respuestas JSON válidas de la API en lugar de páginas de error HTML 404.
