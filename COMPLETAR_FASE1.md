# 🎯 Guía para Completar FASE 1

## 📋 Resumen

**Estado actual:** Lógica preparada, UI pendiente en paso 6  
**Tiempo estimado:** 30-45 minutos  
**Nivel de dificultad:** ⚠️ INTERMEDIO

---

## 🔧 Pasos para Completar

### Paso 1: Verificar el estado actual (5 minutos)

Abre `frontend/components/CVWizard.tsx` y verifica que tenga:

```typescript
// Líneas 11-16
const [useAI, setUseAI] = useState(true);
const [models, setModels] = useState<any[]>([]);
const [selectedModel, setSelectedModel] = useState('phi3.5:latest');
const [loadingStage, setLoadingStage] = useState('');
const [improvementPreview, setImprovementPreview] = useState<{ original: string; improved: string } | null>(null);

// Líneas 19-35
useEffect(() => {
  const fetchModels = async () => {
    try {
      const res = await fetch('http://localhost:8000/ollama/models');
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        if (!data.models.find((m: any) => m.name === selectedModel)) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (error) {
      console.error('Error cargando modelos:', error);
    }
  };
  fetchModels();
}, []);
```

✅ Si ya está, continúa al Paso 2.

---

### Paso 2: Actualizar el paso 6 en UI (20-30 minutos)

Ve a la línea 365 (paso 6) y reemplaza el contenido del paso 6 con:

```tsx
{step === 6 && (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-white mb-4">✨ Paso 6: Generar CV</h2>
    
    {/* Opciones de IA */}
    <div className="bg-purple-600/20 border border-purple-500/30 p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-white font-semibold">🤖 Usar IA para mejorar mi CV</label>
          <p className="text-purple-300 text-sm mt-1">La IA optimizará tus logros y lenguaje profesionalmente</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
          />
          <div className="w-11 h-6 bg-purple-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      {useAI && models.length > 0 && (
        <div>
          <label className="text-white font-semibold block mb-2">Modelo de IA:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white focus:outline-none focus:border-purple-400"
          >
            {models.map((model: any) => (
              <option key={model.name} value={model.name}>
                {model.name} ({model.parameter_size || '3.8B'})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>

    {/* Mensajes de carga por etapa */}
    {loading && (
      <div className="bg-blue-600/20 border border-blue-500/30 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="text-2xl animate-spin">⏳</div>
          <div className="text-blue-200">
            {loadingStage === 'validando' && '📋 Validando información...'}
            {loadingStage === 'mejorando_ia' && '🤖 Mejorando contenido con IA...'}
            {loadingStage === 'generando_pdf' && '📄 Generando PDF con RenderCV...'}
            {loadingStage === 'finalizando' && '✨ Finalizando...'}
          </div>
        </div>
      </div>
    )}

    {error && (
      <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
        {error}
      </div>
    )}
    
    {cvId ? (
      <
      <div className="text-center space-y-4">
        <div className="bg-green-500/20 border border-green-500/30 p-6 rounded-lg">
          <p className="text-green-300 text-2xl mb-2">✅ ¡CV generado exitosamente!</p>
          <p className="text-green-200">
            {useAI ? \`Tu CV ha sido optimizado con IA (${selectedModel}) y está listo para descargar\` : 'Tu CV está listo para descargar'}
          </p>
        </div>
        <div className="space-y-3">
          <button onClick={downloadPDF} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition">
            📥 Descargar PDF
          </button>
          <button onClick={() => {setCvId(null); setStep(1);}} className="w-full bg-black/40 text-purple-300 px-8 py-3 rounded-lg hover:bg-purple-900/30 transition">
            Crear otro CV
          </button>
        </div>
      </div>
    ) : (
      <div>
        <div className="bg-purple-600/20 border border-purple-500/30 p-4 rounded-lg mb-4">
          <p className="text-purple-200">
            <strong>¿Qué pasará al generar?</strong>
          </p>
          <ul className="text-purple-300 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Validación de datos obligatorios</li>
            {useAI && <li>Mejora de logros con IA ({selectedModel})</li>}
            <li>Generación de YAML compatible con RenderCV</li>
            <li>Creación automática de PDF</li>
          </ul>
        </div>
        <button onClick={generateCV} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'Procesando...' : '🚀 Generar CV'}
        </button>
      </div>
    )}
  </div>
)}
```

### Paso 3: Guardar cambios (2 minutos)

```bash
# Guardar cambios en git
git add frontend/components/CVWizard.tsx
git commit -m "feat(v2.0.1): Complete UI de FASE 1 - Toggle IA, modelos y carga por etapa"

- Agregado toggle para activar/desactivar IA
- Agregado dropdown de selección de modelo
- Agregado indicadores de carga por etapa
- Mejorada UX en el asistente de CV
```

---

## 🧪 Paso 4: Ejecutar Tests (5-10 minutos)

### 4.1 Instalar pytest

```bash
cd backend
pip install pytest pytest-asyncio httpx
```

### 4.2 Ejecutar tests

```bash
cd backend
pytest tests/test_ollama_endpoints.py -v
```

### Resultado esperado:

```bash
test_list_models PASSED
test_improve_bullets_success PASSED
test_improve_bullets_empty PASSED
test_improve_bullets_multiple PASSED
test_improve_bullets_invalid_payload PASSED
test_test_endpoint PASSED

6 passed in 2.34s
```

Si algún test falla:
1. Verifica que el backend esté corriendo
2. Verifica que Ollama esté accesible
3. Revisa los mensajes de error específicos

---

## 🧪 Paso 5: Probar en Navegador (10-15 minutos)

### 5.1 Verificar que los servicios estén corriendo

```bash
# Backend
curl http://localhost:8000/health

# Frontend
# Abre http://localhost:3001
```

### 5.2 Probar funcionalidad

1. **Ir al asistente de CV**
   - URL: http://localhost:3001/editor
   - Deberías ver "🎯 Asistente de CV Inteligente"

2. **Completar los pasos 1-5** del formulario
   - Información personal
   - Experiencia laboral
   - Educación
   - Habilidades
   - Resumen

3. **En el paso 6, verificar:**
   - ✅ Checkbox "Usar IA para mejorar mi CV" visible
   - ✅ Dropdown de selección de modelo visible si IA está activada
   - ✅ Mensaje "¿Qué pasará al generar?" condicional

4. **Generar CV:**
   - Clic en "🚀 Generar CV"
   - Verificar indicadores de carga:
     - "📋 Validando información..."
     - "🤖 Mejorando contenido con IA..." (si está activada)
     - "📄 Generando PDF con RenderCV..."
     - "✨ Finalizando..."

5. **Descargar PDF:**
   - Después de la generación, ver el mensaje de éxito
   - Clic en "📥 Descargar PDF"
   - Verificar que el PDF se descarga correctamente

---

## ✅ Paso 6: Documentar y Subir a GitHub (10-15 minutos)

### 6.1 Actualizar CHANGELOG.md principal

Agrega al inicio del archivo:

```markdown
## [v2.0.1] - 2024-12-23

### ✨ Nuevas Funcionalidades (FASE 1)

#### Frontend - Asistente de CV
- 🤖 Toggle para activar/desactivar IA en el generador de CV
- 📊 Selector de modelo de IA con lista de modelos disponibles
- ⏳ Indicadores de carga específicos por etapa de generación
- 🎨 Mejorada UX en el paso 6 del asistente
- 🔍 Carga automática de modelos disponibles desde API de Ollama

#### Testing
- 🧪 Tests completos para endpoints de Ollama
- ✅ Cobertura de casos: éxito, lista vacía, múltiples bullets, payload inválido

#### Seguridad
- 🔒 Verificación de credenciales en documentación
- 📝 Documentación pública usa URL por defecto (localhost)

### 🐛 Bug Fixes
- ✅ Error de "password cannot be longer than 72 bytes" - RESUELTO
- ✅ URL de Ollama expuesta en documentación - CORREGIDO
- ✅ Flujo de autenticación
