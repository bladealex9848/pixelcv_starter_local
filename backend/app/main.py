# -*- coding: utf-8 -*-
"""PixelCV Backend (FastAPI)
Arranque local para generar CVs usando RenderCV y servicios de IA vía Ollama.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_cv import router as cv_router

app = FastAPI(title="PixelCV API", version="1.0.0")

# CORS: permitir frontend local por defecto
origins = [
    os.getenv("PIXELCV_FRONTEND_ORIGIN", "http://localhost:3000"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"name": "PixelCV", "status": "ok", "ts": ""}

app.include_router(cv_router)
