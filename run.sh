#!/bin/bash

# ============================================
# PixelCV - Script de Inicio Rapido
# ============================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directorio base del proyecto
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# PIDs de los procesos
BACKEND_PID=""
FRONTEND_PID=""

# Funcion para limpiar al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}Deteniendo servicios...${NC}"

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}Backend detenido${NC}"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}Frontend detenido${NC}"
    fi

    # Matar cualquier proceso restante en los puertos
    lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null

    echo -e "${GREEN}PixelCV detenido correctamente${NC}"
    exit 0
}

# Capturar señales de interrupcion
trap cleanup SIGINT SIGTERM

# Banner
clear
echo -e "${PURPLE}"
echo "  ╔═══════════════════════════════════════════════════════════╗"
echo "  ║                                                           ║"
echo "  ║   ██████╗ ██╗██╗  ██╗███████╗██╗      ██████╗██╗   ██╗   ║"
echo "  ║   ██╔══██╗██║╚██╗██╔╝██╔════╝██║     ██╔════╝██║   ██║   ║"
echo "  ║   ██████╔╝██║ ╚███╔╝ █████╗  ██║     ██║     ██║   ██║   ║"
echo "  ║   ██╔═══╝ ██║ ██╔██╗ ██╔══╝  ██║     ██║     ╚██╗ ██╔╝   ║"
echo "  ║   ██║     ██║██╔╝ ██╗███████╗███████╗╚██████╗ ╚████╔╝    ║"
echo "  ║   ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚═══╝     ║"
echo "  ║                                                           ║"
echo "  ║          CVs Profesionales con IA y Gamificacion          ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar requisitos
echo -e "${CYAN}Verificando requisitos...${NC}"

# Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo -e "  ${GREEN}✓${NC} $PYTHON_VERSION"
else
    echo -e "  ${RED}✗ Python 3 no encontrado${NC}"
    exit 1
fi

# Node
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>&1)
    echo -e "  ${GREEN}✓${NC} Node.js $NODE_VERSION"
else
    echo -e "  ${RED}✗ Node.js no encontrado${NC}"
    exit 1
fi

# Ollama (opcional)
if command -v ollama &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Ollama instalado"
    OLLAMA_AVAILABLE=true
else
    echo -e "  ${YELLOW}! Ollama no encontrado (IA deshabilitada)${NC}"
    OLLAMA_AVAILABLE=false
fi

echo ""

# Liberar puertos si estan ocupados
echo -e "${CYAN}Liberando puertos...${NC}"
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
echo -e "  ${GREEN}✓${NC} Puertos 8000 y 3000 disponibles"
echo ""

# Verificar dependencias del backend
echo -e "${CYAN}Verificando dependencias del backend...${NC}"
cd "$BACKEND_DIR"
if [ -d ".venv" ]; then
    echo -e "  ${GREEN}✓${NC} Entorno virtual encontrado"
else
    echo -e "  ${YELLOW}!${NC} Creando entorno virtual..."
    python3 -m venv .venv
fi

# Activar entorno virtual e instalar dependencias si es necesario
source .venv/bin/activate 2>/dev/null || true
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "  ${YELLOW}!${NC} Instalando dependencias..."
    pip install -q fastapi uvicorn pydantic pydantic-settings sqlalchemy passlib python-jose python-multipart pyyaml requests email-validator bcrypt 2>/dev/null
fi

# Verificar RenderCV
if ! command -v rendercv &> /dev/null; then
    echo -e "  ${YELLOW}!${NC} Instalando RenderCV..."
    pip3 install -q "rendercv[full]" 2>/dev/null
fi
echo -e "  ${GREEN}✓${NC} Dependencias de Python listas (incluye RenderCV)"
echo ""

# Verificar dependencias del frontend
echo -e "${CYAN}Verificando dependencias del frontend...${NC}"
cd "$FRONTEND_DIR"
if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} node_modules encontrado"
else
    echo -e "  ${YELLOW}!${NC} Instalando dependencias..."
    npm install --silent 2>/dev/null
fi
echo -e "  ${GREEN}✓${NC} Dependencias de Node listas"
echo ""

# Iniciar Backend
echo -e "${CYAN}Iniciando Backend (FastAPI)...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate 2>/dev/null || true
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/pixelcv_backend.log 2>&1 &
BACKEND_PID=$!

# Esperar a que el backend este listo
sleep 2
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend corriendo en http://localhost:8000"
else
    echo -e "  ${YELLOW}!${NC} Backend iniciando..."
    sleep 3
fi

# Iniciar Frontend
echo -e "${CYAN}Iniciando Frontend (Next.js)...${NC}"
cd "$FRONTEND_DIR"
npm run dev > /tmp/pixelcv_frontend.log 2>&1 &
FRONTEND_PID=$!

# Esperar a que el frontend este listo
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo -e "  ${GREEN}✓${NC} Frontend corriendo en http://localhost:3000"
else
    echo -e "  ${YELLOW}!${NC} Frontend iniciando..."
    sleep 2
fi

echo ""

# Verificar Ollama
if [ "$OLLAMA_AVAILABLE" = true ]; then
    OLLAMA_STATUS=$(curl -s http://localhost:8000/ollama/models 2>/dev/null)
    if echo "$OLLAMA_STATUS" | grep -q "connected"; then
        MODEL_COUNT=$(echo "$OLLAMA_STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null || echo "0")
        echo -e "${GREEN}✓ Ollama conectado con $MODEL_COUNT modelo(s)${NC}"
    else
        echo -e "${YELLOW}! Ollama no responde - ejecuta 'ollama serve' en otra terminal${NC}"
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}            PixelCV esta listo para usar${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}    http://localhost:3000"
echo -e "  ${CYAN}Backend:${NC}     http://localhost:8000"
echo -e "  ${CYAN}API Docs:${NC}    http://localhost:8000/docs"
echo ""
echo -e "  ${PURPLE}Paginas disponibles:${NC}"
echo -e "    - Editor de CV:  http://localhost:3000/editor"
echo -e "    - Comunidad:     http://localhost:3000/community"
echo -e "    - Leaderboard:   http://localhost:3000/leaderboard"
echo -e "    - Login:         http://localhost:3000/login"
echo -e "    - Registro:      http://localhost:3000/register"
echo ""
echo -e "  ${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Abrir navegador automaticamente (opcional)
if command -v open &> /dev/null; then
    sleep 1
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    sleep 1
    xdg-open http://localhost:3000
fi

# Mantener el script corriendo y mostrar logs
echo -e "${CYAN}Logs del servidor (Ctrl+C para salir):${NC}"
echo ""
tail -f /tmp/pixelcv_backend.log /tmp/pixelcv_frontend.log 2>/dev/null
