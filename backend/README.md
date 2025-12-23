# PixelCV Backend (local)

Backend **FastAPI** para generar CVs con **RenderCV** y mejorar contenido con **Ollama**.

## Requisitos
- Python 3.12+
- Paquete `rendercv[full]` instalado (CLI disponible). **Fuente oficial:** PyPI. 
- SQLite local.

## Instalación
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e .
```

Instala RenderCV:
```bash
pip install "rendercv[full]"  # Requiere Python 3.12+
```

Configura variables:
```bash
cp .env.example .env
```

## Arranque
```bash
uvicorn app.main:app --reload --port 8000
```

## Render de prueba
```bash
rendercv new "Tu Nombre" --locale spanish --theme classic
rendercv render "Tu_Nombre_CV.yaml" --pdf-path ./CV.pdf --png-path ./png
```
