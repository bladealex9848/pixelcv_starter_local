# Reporte de Incidente - Error 502 y Falla de Build (28 Dic 2025)

## Resumen
El domingo 28 de diciembre de 2025, tras un despliegue automático, el servidor respondió con un error 502. La causa raíz fue un error de TypeScript que rompió el proceso de build, seguido de una falla en el mecanismo de recuperación que dejó el puerto bloqueado.

## Causa Raíz
1.  **Error de TypeScript**: Se introdujo un cambio en `frontend/app/editor/[id]/page.tsx` y `frontend/components/CVWizard.tsx` donde un argumento obligatorio (`model`) se definía después de argumentos opcionales (`index`, `instruction`).
    *   Error: `Type error: A required parameter cannot follow an optional parameter.`
2.  **Falla de Recuperación**: El script de gestión (`manage-pixelcv.sh`) detectó el fallo del build e intentó iniciar el servidor en modo desarrollo (`npm run dev`). Sin embargo, el puerto 5180 no se liberó correctamente del proceso anterior, causando un error `EADDRINUSE`.

## Solución Aplicada
1.  **Corrección de Código**: Se modificó la firma de la función `tryModelImprove` en ambos archivos afectados para hacer el parámetro `model` opcional (`model?: string`).
    *   Antes: `(..., index?: number, instruction?: string, model: string)`
    *   Después: `(..., index?: number, instruction?: string, model?: string)`
2.  **Restauración del Servicio**:
    *   Se eliminó el proceso zombie en el puerto 5180.
    *   Se ejecutó `npm run build` manualmente para verificar la corrección.
    *   Se reinició el servicio `pixelcv-backend.service`.

## Prevención
*   **Validación Local**: Es crítico ejecutar `npm run build` localmente antes de realizar un `git push` para detectar errores de tipos que no son evidentes durante el desarrollo pero que detienen el build de producción.
