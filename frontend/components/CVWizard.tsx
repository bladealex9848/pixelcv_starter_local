"use client";
import { useState } from 'react';

export default function CVWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '',
    experience: [], education: [], skills: '', summary: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('phi3.5:latest');
  const [cvId, setCvId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Cargar modelos disponibles de Ollama
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

  const [improvementPreview, setImprovementPreview] = useState<{ original: string; improved: string } | null>(null);

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { 
        company: '', position: '', dates: '', location: '', highlights: '' 
      }]
    });
  };

  const updateExperience = (idx: number, field: string, value: string) => {
    const exp = [...formData.experience];
    exp[idx] = { ...exp[idx], [field]: value };
    setFormData({ ...formData, experience: exp });
  };

  const removeExperience = (idx: number) => {
    setFormData({ 
      ...formData, 
      experience: formData.experience.filter((_, i) => i !== idx) 
    });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { 
        institution: '', degree: '', dates: '', location: '' 
      }]
    });
  };

  const updateEducation = (idx: number, field: string, value: string) => {
    const edu = [...formData.education];
    edu[idx] = { ...edu[idx], [field]: value };
    setFormData({ ...formData, education: edu });
  };

  const removeEducation = (idx: number) => {
    setFormData({ 
      ...formData, 
      education: formData.education.filter((_, i) => i !== idx) 
    });
  };

  // Cargar modelos disponibles de Ollama
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('http://localhost:8000/ollama/models');
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          if (!selectedModel || !data.models.find((m: any) => m.name === selectedModel)) {
            setSelectedModel(data.models[0].name);
          }
        }
      } catch (error) {
        console.error('Error cargando modelos:', error);
      }
    };
    fetchModels();
  }, []);

  // Función para previsualizar mejora de IA
  const previewAIImprovement = async (bullet: string) => {
    if (!bullet.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/ollama/improve-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          bullets: [bullet]
        })
      });
      const data = await res.json();
      if (data.improved_bullets && data.improved_bullets[0]) {
        setImprovementPreview({
          original: bullet,
          improved: data.improved_bullets[0]
        });
      }
    } catch (error) {
      console.error('Error previsualizando mejora:', error);
    }
  };

  const generateCV = async () => {
    setLoading(true);
    setError('');
    setLoadingStage('validando');
    
    try {
      if (!formData.name || !formData.email) {
        throw new Error('Nombre y email son obligatorios');
      }

      setLoadingStage('mejorando_ia');
      const res = await fetch('http://localhost:8000/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          linkedin: formData.linkedin,
          sections: {
            experiencia: formData.experience.map(exp => ({
              company: exp.company,
              position: exp.position,
              start_date: exp.dates.split('-')[0]?.trim() || '',
              end_date: exp.dates.includes('-') ? exp.dates.split('-')[1]?.trim() : 'present',
              location: exp.location,
              highlights: exp.highlights.split('\n').filter(h => h.trim())
            })),
            educacion: formData.education.map(edu => ({
              institution: edu.institution,
              degree: edu.degree,
              start_date: edu.dates.split('-')[0]?.trim() || '',
              end_date: edu.dates.includes('-') ? edu.dates.split('-')[1]?.trim() : 'present',
              location: edu.location
            })),
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
          },
          summary: formData.summary,
          improve: useAI,
          model: selectedModel,
          formats: ['pdf']
        })
      });
      
      setLoadingStage('generando_pdf');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || 'Error al generar el CV');
      
      setLoadingStage('finalizando');
      setCvId(data.cvId);
      setImprovementPreview(null);
    } catch (e: any) {
      setError(e.message || 'Error al generar el CV');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const downloadPDF = () => {
    if (cvId) {
      window.open(`http://localhost:8000/cv/${cvId}/pdf`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-4">🎯 Asistente de CV Inteligente</h1>
        <p className="text-purple-300 text-center mb-8">Crea tu CV profesional paso a paso con ayuda de IA</p>
        
        <div className="mb-8">
          <div className="w-full bg-black/40 rounded-full h-3 mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" 
                 style={{width: `${(step/6)*100}%`}}></div>
          </div>
          <div className="flex justify-between text-purple-300 text-sm">
            <span>Paso {step} de 6</span>
            <span>{Math.round((step/6)*100)}% completado</span>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 mb-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">👤 Paso 1: Información Personal</h2>
              <p className="text-purple-300 mb-4">Datos básicos de contacto. Los campos marcados con * son obligatorios.</p>
              <input 
                placeholder="Nombre completo *" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
              />
              <input 
                placeholder="Email *" 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
              />
              <input 
                placeholder="Teléfono" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
              />
              <input 
                placeholder="Ciudad/País" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
              />
              <input 
                placeholder="LinkedIn URL (opcional)" 
                value={formData.linkedin} 
                onChange={e => setFormData({...formData, linkedin: e.target.value})} 
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">💼 Paso 2: Experiencia Laboral</h2>
              <p className="text-purple-300 mb-4">Agrega tus trabajos anteriores. La IA mejorará automáticamente tus logros.</p>
              {formData.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-black/20 border border-purple-500/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold">Trabajo #{idx + 1}</h3>
                    <button onClick={() => removeExperience(idx)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                  </div>
                  <input 
                    placeholder="Empresa" 
                    value={exp.company} 
                    onChange={e => updateExperience(idx, 'company', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                  <input 
                    placeholder="Cargo" 
                    value={exp.position} 
                    onChange={e => updateExperience(idx, 'position', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                  <input 
                    placeholder="Período (ej: 2020-2022)" 
                    value={exp.dates} 
                    onChange={e => updateExperience(idx, 'dates', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                  <input 
                    placeholder="Ubicación" 
                    value={exp.location} 
                    onChange={e => updateExperience(idx, 'location', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                  <textarea 
                    placeholder="Logros y responsabilidades (cada logro en una nueva línea)" 
                    value={exp.highlights} 
                    onChange={e => updateExperience(idx, 'highlights', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 min-h-[80px]" 
                  />
                </div>
              ))}
              <button onClick={addExperience} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">
                + Agregar otro trabajo
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">🎓 Paso 3: Educación</h2>
              <p className="text-purple-300 mb-4">Tu formación académica y certificaciones.</p>
              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-black/20 border border-purple-500/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold">Educación #{idx + 1}</h3>
                    <button onClick={() => removeEducation(idx)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                  </div>
                  <input 
                    placeholder="Institución" 
                    value={edu.institution} 
                    onChange={e => updateEducation(idx, 'institution', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                  <input 
                    placeholder="Título/Grado" 
                    value={edu.degree} 
                    onChange={e => updateEducation(idx, 'degree', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                  <input 
                    placeholder="Período (ej: 2016-2020)" 
                    value={edu.dates} 
                    onChange={e => updateEducation(idx, 'dates', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                  <input 
                    placeholder="Ubicación" 
                    value={edu.location} 
                    onChange={e => updateEducation(idx, 'location', e.target.value)} 
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400" 
                  />
                </div>
              ))}
              <button onClick={addEducation} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">
                + Agregar otra educación
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">⚡ Paso 4: Habilidades</h2>
              <p className="text-purple-300 mb-4">Separa cada habilidad con una coma. Ej: Python, React, Git, Agile</p>
              <textarea 
                placeholder="Habilidades técnicas y blandas (separadas por comas)" 
                value={formData.skills} 
                onChange={e => setFormData({...formData, skills: e.target.value})}
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 min-h-[120px]" 
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">📝 Paso 5: Resumen Profesional</h2>
              <p className="text-purple-300 mb-4">Una breve descripción de 2-3 frases sobre tu experiencia única y objetivos profesionales.</p>
              <textarea 
                placeholder="Ej: Ingeniero de software con 5 años de experiencia en desarrollo de aplicaciones web. Especializado en React y Node.js. Busco oportunidades para aplicar mis habilidades en proyectos innovadores..." 
                value={formData.summary} 
                onChange={e => setFormData({...formData, summary: e.target.value})} 
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 min-h-[150px]" 
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">✨ Paso 6: Generar CV</h2>
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
                  {error}
                </div>
              )}
              {cvId ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-500/20 border border-green-500/30 p-6 rounded-lg">
                    <p className="text-green-300 text-2xl mb-2">✅ ¡CV generado exitosamente!</p>
                    <p className="text-green-200">Tu CV ha sido optimizado con IA y está listo para descargar</p>
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
                      🤖 <strong>¿Qué hará la IA?</strong>
                    </p>
                    <ul className="text-purple-300 text-sm mt-2 space-y-1 list-disc list-inside">
                      <li>Mejorará tus logros para que sean más impactantes</li>
                      <li>Optimizará el formato y lenguaje profesional</li>
                      <li>Generará un PDF profesional con RenderCV</li>
                    </ul>
                  </div>
                  <button onClick={generateCV} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50">
                    {loading ? '⏳ Generando con IA...' : '🚀 Generar CV con IA'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button 
            onClick={() => setStep(Math.max(1, step - 1))} 
            disabled={step === 1} 
            className="bg-black/40 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          {step < 6 && (
            <button 
              onClick={() => setStep(Math.min(6, step + 1))} 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
