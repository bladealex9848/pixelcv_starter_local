# PixelCV Starter (local)

Paquete inicial para desarrollo local en macOS con **Python/FastAPI**, **Node/Next.js**, **SQLite**, **RenderCV** y **Ollama**.

## Contenido
- `backend/`: API en FastAPI, integra RenderCV (CLI) y Ollama (IA).
- `frontend/`: Next.js + Tailwind, formularios y preview.
- `docs/`: documentación adicional.

## Requisitos
- Python 3.12+ y paquete `rendercv[full]` (CLI disponible). **Referencia PyPI.**
- Node 20+, npm.
- SQLite.
- Endpoint de Ollama (por defecto `http://localhost:11434/api`).

## Arranque rápido
```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
pip install "rendercv[full]"
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# Frontend
cd ../frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Nota sobre JSON Schema
Este starter **NO incluye** `backend/assets/schema.json` oficial de RenderCV. Descárgalo desde su repositorio y colócalo ahí para habilitar validación y autocompletado.
