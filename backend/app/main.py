# -*- coding: utf-8 -*-
"""PixelCV Backend (FastAPI)
Arranque local para generar CVs usando RenderCV, servicios de IA vía Ollama,
y sistema de comunidad con gamificación.
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Cargar variables de entorno
load_dotenv()

from app.api.routes_cv import router as cv_router
from app.api.routes_auth import router as auth_router
from app.api.routes_cv_community import router as cv_community_router
from app.api.routes_gamification import router as gamification_router
from app.api.routes_ollama import router as ollama_router
from app.api.routes_games import router as games_router
from app.models.database import init_db

app = FastAPI(
    title="PixelCV API",
    description="API para crear CVs con RenderCV y comunidad gamificada",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar base de datos al iniciar
@app.on_event("startup")
def startup_event():
    """Inicializa la base de datos y crea las tablas"""
    init_db()
    print("✅ Base de datos inicializada")

# Rutas
app.include_router(cv_router)
app.include_router(auth_router)
app.include_router(cv_community_router)
app.include_router(gamification_router)
app.include_router(ollama_router)
app.include_router(games_router)

@app.get("/")
def root():
    return {
        "name": "PixelCV API",
        "version": "2.0.0",
        "features": [
            "RenderCV integration",
            "Ollama AI services",
            "User authentication",
            "Community features",
            "Gamification system"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
