#!/bin/bash
# Script de instalación para PixelCV

echo "🚀 Instalando PixelCV..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
if command -v uv &> /dev/null; then
    uv sync
else
    pip3 install fastapi uvicorn pydantic pydantic-settings sqlalchemy passlib python-jose python-multipart pyyaml requests email-validator
fi
cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

# Crear archivos de entorno
echo "⚙️ Creando archivos de configuración..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Archivo backend/.env creado"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Archivo frontend/.env.local creado"
fi

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "Para iniciar el proyecto:"
echo "1. Terminal 1 (Backend): cd backend && uvicorn app.main:app --reload"
echo "2. Terminal 2 (Frontend): cd frontend && npm run dev"
echo "3. Abrir en navegador: http://localhost:3000"
