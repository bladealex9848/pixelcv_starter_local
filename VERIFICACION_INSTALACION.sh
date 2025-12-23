#!/bin/bash
# Script de verificación de instalación de PixelCV v2.0

echo "🔍 Verificando instalación de PixelCV v2.0..."
echo ""

# Verificar Python
echo "📋 Verificando Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python: $PYTHON_VERSION"
else
    echo "❌ Python no instalado"
    exit 1
fi

# Verificar Node.js
echo ""
echo "📋 Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js no instalado"
    exit 1
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm no instalado"
    exit 1
fi

# Verificar servicios
echo ""
echo "🚀 Verificando servicios..."

if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ Backend corriendo en http://localhost:8000"
else
    echo "❌ Backend no responde"
fi

if curl -s -I http://localhost:3000 2>&1 | grep -q "200 OK"; then
    echo "✅ Frontend corriendo en http://localhost:3000"
else
    echo "❌ Frontend no responde"
fi

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificación completada"
echo ""
echo "🌐 URLs de acceso:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
