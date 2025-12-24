#!/bin/bash
# Script de pruebas para la API de PixelCV

API_URL="http://localhost:8000"

echo "🧪 Iniciando pruebas de la API..."
echo ""

# Test 1: Health check
echo "Test 1: Health check"
curl -s ${API_URL}/health | python3 -m json.tool
echo ""

# Test 2: Registrar usuario
echo "Test 2: Registrar usuario"
REGISTER_RESPONSE=$(curl -s -X POST ${API_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pixelcv.com",
    "username": "testuser",
    "password": "testpass123",
    "full_name": "Test User"
  }')
echo "$REGISTER_RESPONSE" | python3 -m json.tool
TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))")
echo ""
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test 3: Obtener perfil
echo "Test 3: Obtener perfil"
curl -s ${API_URL}/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test 4: Obtener leaderboard
echo "Test 4: Obtener leaderboard"
curl -s ${API_URL}/gamification/leaderboard | python3 -m json.tool
echo ""

# Test 5: Obtener badges
echo "Test 5: Obtener badges disponibles"
curl -s ${API_URL}/gamification/badges | python3 -m json.tool
echo ""

# Test 6: Explorar CVs (community)
echo "Test 6: Explorar CVs públicos"
curl -s ${API_URL}/cv/browse | python3 -m json.tool
echo ""

echo "✅ Pruebas completadas!"
