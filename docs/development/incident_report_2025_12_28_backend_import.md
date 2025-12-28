# Reporte de Incidente - Error 502 por ImportError en Backend (28 Dic 2025)

## Resumen
El domingo 28 de diciembre de 2025, tras un despliegue, el backend falló al iniciar (Error 502) debido a un error de importación en el servicio de PixelArt.

## Causa Raíz
*   **Error de Importación**: El archivo `backend/app/services/pixelart_service.py` intentaba importar una clase `OllamaService` y llamar a un método estático `generate_response`.
*   **Discrepancia**: El archivo `backend/app/services/ollama_service.py` había sido refactorizado (o siempre fue así) para usar funciones independientes (`generate_text`, `improve_bullets`) en lugar de una clase contenedora. No existía la clase `OllamaService`.
*   **Consecuencia**: `uvicorn` fallaba al arrancar con `ImportError: cannot import name 'OllamaService'`, causando que el servicio systemd reiniciara en bucle o fallara silenciosamente tras el inicio.

## Solución Aplicada
1.  **Refactorización de Dependencia**: Se modificó `backend/app/services/pixelart_service.py`.
    *   **Antes**: 
        ```python
        from app.services.ollama_service import OllamaService
        # ...
        response = OllamaService.generate_response(improved_prompt)
        ```
    *   **Después**:
        ```python
        from app.services.ollama_service import generate_text
        # ...
        response = generate_text(improved_prompt)
        ```
2.  **Validación**: El cambio alinea el consumidor (`PixelArtService`) con la implementación real del proveedor (`ollama_service.py`).

## Estado Final
El código ha sido corregido para usar la función `generate_text` directamente.
