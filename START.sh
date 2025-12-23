#!/bin/bash
# Script de inicio para PixelCV

echo "🚀 Iniciando PixelCV..."

# Iniciar backend en segundo plano
echo "📡 Iniciando backend..."
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Esperar un momento
sleep 3

# Iniciar frontend
echo "🖥️ Iniciando frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ PixelCV iniciado!"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios"

# Función para limpiar procesos
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Esperar indefinidamente
wait
