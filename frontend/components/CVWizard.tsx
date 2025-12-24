"use client";
import { useState, useEffect } from 'react';
import AIReviewModal from './AIReviewModal';

export default function CVWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '',
    experience: [] as any[], education: [] as any[], skills: '', summary: '',
    theme: 'classic'
  });

  const themes = [
    { id: 'classic', name: 'Classic', description: 'Elegante y tradicional' },
    { id: 'moderncv', name: 'Modern CV', description: 'Moderno con colores' },
    { id: 'sb2nov', name: 'SB2Nov', description: 'Limpio y minimalista' },
    { id: 'engineeringclassic', name: 'Engineering Classic', description: 'Para ingenieros' },
    { id: 'engineeringresumes', name: 'Engineering Resumes', description: 'Tecnico detallado' },
  ];
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('phi3.5:latest');
  const [cvId, setCvId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Estado para Revision IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [improvedExperience, setImprovedExperience] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Cargar modelos disponibles de Ollama
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('http://localhost:8000/ollama/models');
        const data = await res.json();
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          if (!data.models.includes(selectedModel)) {
            setSelectedModel(data.models[0]);
          }
        } else {
            setModels([]);
        }
      } catch (error) {
        console.error('Error cargando modelos:', error);
        setModels([]);
      }
    };
    fetchModels();
  }, []);

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

  const handleAcceptAI = (newData: any[]) => {
    if (!activeField) return;

    if (activeField.type === 'experience' && typeof activeField.index === 'number') {
      const exp = [...formData.experience];
      exp[activeField.index].highlights = newData[0].highlights;
      setFormData({ ...formData, experience: exp });
    } else if (activeField.type === 'summary') {
      setFormData({ ...formData, summary: newData[0].highlights });
    } else if (activeField.type === 'skills') {
      setFormData({ ...formData, skills: newData[0].highlights });
    }
    
    setShowAIModal(false);
    setActiveField(null);
  };

  // Botón de IA reutilizable
  const AIButton = ({ onClick, visible }: { onClick: () => void, visible: boolean }) => {
    if (!visible || models.length === 0) return null;
    return (
      <button
        onClick={onClick}
        className="absolute right-2 bottom-2 text-xs bg-purple-600/80 hover:bg-purple-500 text-white px-3 py-1 rounded-full flex items-center gap-1 transition shadow-lg backdrop-blur-sm z-10"
        title="Mejorar con IA"
      >
        <span>✨</span> Mejorar
      </button>
    );
  };

  const generateCV = async () => {
    setLoading(true);
    setError('');
    setLoadingStage('validando');

    try {
      if (!formData.name || !formData.email) {
        throw new Error('Nombre y email son obligatorios');
      }

      // Obtener token de autenticacion
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      setLoadingStage('generando_pdf');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:8000/cv', {
        method: 'POST',
        headers,
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
              highlights: exp.highlights.split('\n').filter((h: string) => h.trim())
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
          theme: formData.theme,
          improve: false, // Mejorado manualmente
          model: selectedModel,
          formats: ['pdf']
        })
      });

      setLoadingStage('finalizando');
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Error al generar el CV');

      setCvId(data.cvId);
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
        <h1 className="text-4xl font-bold text-center text-white mb-4">Asistente de CV Inteligente</h1>
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
              <h2 className="text-2xl font-bold text-white mb-4">Paso 1: Informacion Personal</h2>
              <p className="text-purple-300 mb-4">Datos basicos de contacto. Los campos marcados con * son obligatorios.</p>
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
                placeholder="Telefono"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
              />
              <input
                placeholder="Ciudad/Pais"
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
              <h2 className="text-2xl font-bold text-white mb-4">Paso 2: Experiencia Laboral</h2>
              <p className="text-purple-300 mb-4">Agrega tus trabajos anteriores. La IA mejorara automaticamente tus logros.</p>
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
                    placeholder="Periodo (ej: 2020-2022)"
                    value={exp.dates}
                    onChange={e => updateExperience(idx, 'dates', e.target.value)}
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    placeholder="Ubicacion"
                    value={exp.location}
                    onChange={e => updateExperience(idx, 'location', e.target.value)}
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                  <div className="relative">
                  <textarea
                    placeholder="Logros y responsabilidades (cada logro en una nueva linea)"
                    value={exp.highlights}
                    onChange={e => updateExperience(idx, 'highlights', e.target.value)}
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 min-h-[80px]"
                  />
                  <AIButton onClick={() => handleAnalyzeClick('experience', idx)} visible={exp.highlights.length > 20} />
                  </div>
                </div>
              ))}
              <button onClick={addExperience} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">
                + Agregar otro trabajo
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 3: Educacion</h2>
              <p className="text-purple-300 mb-4">Tu formacion academica y certificaciones.</p>
              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-black/20 border border-purple-500/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold">Educacion #{idx + 1}</h3>
                    <button onClick={() => removeEducation(idx)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                  </div>
                  <input
                    placeholder="Institucion"
                    value={edu.institution}
                    onChange={e => updateEducation(idx, 'institution', e.target.value)}
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    placeholder="Titulo/Grado"
                    value={edu.degree}
                    onChange={e => updateEducation(idx, 'degree', e.target.value)}
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    placeholder="Periodo (ej: 2016-2020)"
                    value={edu.dates}
                    onChange={e => updateEducation(idx, 'dates', e.target.value)}
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    placeholder="Ubicacion"
                    value={edu.location}
                    onChange={e => updateEducation(idx, 'location', e.target.value)}
                    className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                </div>
              ))}
              <button onClick={addEducation} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">
                + Agregar otra educacion
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 4: Habilidades</h2>
              <p className="text-purple-300 mb-4">Separa cada habilidad con una coma. Ej: Python, React, Git, Agile</p>
              <div className="relative">
              <textarea
                placeholder="Habilidades tecnicas y blandas (separadas por comas)"
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 min-h-[120px]"
              />
              <AIButton onClick={() => handleAnalyzeClick('skills')} visible={formData.skills.length > 10} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 5: Resumen Profesional</h2>
              <p className="text-purple-300 mb-4">Una breve descripcion de 2-3 frases sobre tu experiencia unica y objetivos profesionales.</p>
              <div className="relative">
              <textarea
                placeholder="Ej: Ingeniero de software con 5 anos de experiencia en desarrollo de aplicaciones web. Especializado en React y Node.js. Busco oportunidades para aplicar mis habilidades en proyectos innovadores..."
                value={formData.summary}
                onChange={e => setFormData({...formData, summary: e.target.value})}
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 min-h-[150px]"
              />
              <AIButton onClick={() => handleAnalyzeClick('summary')} visible={formData.summary.length > 20} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 6: Estilo y Generacion</h2>

              {/* Selector de Tema */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Selecciona el estilo de tu CV:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setFormData({...formData, theme: theme.id})}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                        formData.theme === theme.id
                          ? 'border-purple-500 ring-2 ring-purple-500/50'
                          : 'border-purple-500/30 hover:border-purple-500/60'
                      }`}
                    >
                      <div className="aspect-[3/4] relative bg-white">
                        <img
                          src={`/themes/${theme.id}.png`}
                          alt={theme.name}
                          className="w-full h-full object-cover object-top"
                        />
                        {formData.theme === theme.id && (
                          <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                            Seleccionado
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-black/60">
                        <p className="text-white font-medium text-sm">{theme.name}</p>
                        <p className="text-purple-300 text-xs">{theme.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opciones de IA - Solo visible si hay modelos */}
              {models.length > 0 && (
              <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-semibold text-lg">Configuración de IA</label>
                    <p className="text-purple-300 text-sm mt-1">Modelo seleccionado para las mejoras automáticas.</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-white font-medium block mb-2 text-sm">Modelo Activo:</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 rounded-lg bg-black/40 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    {models.map((model: string, index: number) => (
                      <option key={model || index} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              )}

              <AIReviewModal 
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onAccept={handleAcceptAI}
                onRegenerate={handleRegenerate}
                isRegenerating={isAnalyzing}
                originalExperience={activeField ? (
                  activeField.type === 'experience' && typeof activeField.index === 'number' ? [{...formData.experience[activeField.index]}] : 
                  activeField.type === 'summary' ? [{highlights: formData.summary, company: 'Resumen', position: ''}] :
                  [{highlights: formData.skills, company: 'Habilidades', position: ''}]
                ) : []}
                improvedExperience={improvedExperience}
              />

              {/* Mensajes de carga por etapa */}
              {loading && (
                <div className="bg-blue-600/20 border border-blue-500/30 p-6 rounded-lg">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-4xl animate-spin">-</div>
                    <div className="text-blue-200 text-xl">
                      {loadingStage === 'validando' && 'Validando informacion...'}
                      {loadingStage === 'mejorando_ia' && 'Mejorando contenido con IA...'}
                      {loadingStage === 'generando_pdf' && 'Generando PDF con RenderCV...'}
                      {loadingStage === 'finalizando' && 'Finalizando...'}
                      {loadingStage === '' && 'Procesando...'}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-6 rounded-lg">
                  <p className="font-semibold text-lg mb-2">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              {cvId ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-500/20 border border-green-500/30 p-8 rounded-lg">
                    <p className="text-green-300 text-4xl mb-4">CV generado exitosamente!</p>
                    <p className="text-green-200 text-xl">
                      Tu CV esta listo para descargar (Modelo IA: {selectedModel})
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button onClick={downloadPDF} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-5 rounded-xl font-bold text-lg hover:opacity-90 transition">
                      Descargar PDF
                    </button>
                    <button onClick={() => {setCvId(null); setStep(1);}} className="w-full bg-black/40 text-purple-300 px-8 py-4 rounded-xl font-semibold hover:bg-purple-900/30 transition">
                      Crear otro CV
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-lg mb-6">
                    <p className="text-purple-200 text-lg mb-4">
                      <strong>Que pasara al generar?</strong>
                    </p>
                    <ul className="text-purple-300 text-base space-y-2 list-disc list-inside">
                      <li>Validacion de datos obligatorios</li>
                      <li>Generacion de YAML compatible con RenderCV</li>
                      <li>Creacion automatica de PDF profesional</li>
                    </ul>
                  </div>
                  <button onClick={generateCV} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-xl font-bold text-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Procesando...' : 'Generar CV'}
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
            Anterior
          </button>
          {step < 6 && (
            <button
              onClick={() => setStep(Math.min(6, step + 1))}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
