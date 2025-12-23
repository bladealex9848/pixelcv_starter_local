#!/bin/bash

echo "🎯 Comiteando documentación y preparación de FASE 1"
echo ""

# Agregar archivos nuevos
git add ESTADO_SUGERENCIAS.md
git add FLUJO_NAVEGACION.md
git add FASE1_IMPLEMENTADA.md
git add CHANGELOG_FASE1.md
git add COMPLETAR_FASE1.md
git add backend/tests/test_ollama_endpoints.py

# Modificar archivos existentes
git add frontend/components/CVWizard.tsx
git add frontend/components/Navbar.tsx
git add frontend/components/PrivateRoute.tsx
git add frontend/app/layout.tsx
git add frontend/app/login/page.tsx
git add frontend/app/register/page.tsx
git add frontend/app/dashboard/page.tsx
git add frontend/app/editor/page.tsx
git add frontend/app/page.tsx
git add backend/app/services/auth_service.py

# Verificar cambios
echo "📊 Archivos preparados para commit:"
git status --short

echo ""
echo "✅ Archivos preparados. Para hacer el commit:"
echo "   git commit -m 'feat(v2.0.1): FASE 1 - Mejoras críticas en asistente de CV"
echo ""
echo "📋 Cambios incluidos:"
echo "   ✅ Documentación de flujo de navegación"
echo "   ✅ Análisis de sugerencias futuras"
echo "   ✅ Tests para endpoints de Ollama"
echo "   ✅ Preparación de FASE 1 (estados en CVWizard)"
echo "   ✅ Navbar con autenticación"
echo "   ✅ Rutas protegidas con PrivateRoute"
echo "   ✅ Fix de error de contraseña (bcrypt directo)"
echo "   ✅ Segurizar credenciales (URL de Ollama)"
echo ""
echo "🚀 Para subir a GitHub:"
echo "   git push origin main"
