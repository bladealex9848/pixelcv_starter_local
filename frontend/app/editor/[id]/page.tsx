"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PrivateRoute from '../../../components/PrivateRoute';

function EditorContent() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;

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
  const [loadingCV, setLoadingCV] = useState(true);
  const [loadingStage, setLoadingStage] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('phi3.5:latest');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar datos del CV existente
  useEffect(() => {
    const loadCV = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/cv/${cvId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('CV no encontrado');
        }

        const data = await res.json();
        const cvData = data.data?.cv || {};
        const designData = data.data?.design || {};

        // Mapear datos del CV al formulario
        setFormData({
          name: cvData.name || '',
          email: cvData.email || '',
          phone: cvData.phone || '',
          location: cvData.location || '',
          linkedin: cvData.social_networks?.[0]?.username || '',
          summary: cvData.summary || '',
          skills: cvData.sections?.Habilidades?.[0]?.details || '',
          theme: designData.theme || 'classic',
          experience: (cvData.sections?.Experiencia || []).map((exp: any) => ({
            company: exp.company || '',
            position: exp.position || '',
            dates: `${exp.start_date || ''} - ${exp.end_date || ''}`,
            location: exp.location || '',
            highlights: (exp.highlights || []).join('\n')
          })),
          education: (cvData.sections?.Educacion || []).map((edu: any) => ({
            institution: edu.institution || '',
            degree: edu.area || '',
            dates: `${edu.start_date || ''} - ${edu.end_date || ''}`,
            location: edu.location || ''
          }))
        });
      } catch (err: any) {
        setError(err.message || 'Error al cargar el CV');
      } finally {
        setLoadingCV(false);
      }
    };

    loadCV();
  }, [cvId, router]);

  // Cargar modelos de IA
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('http://localhost:8000/ollama/models');
        const data = await res.json();
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          // Si el modelo seleccionado no esta en la lista, usar el primero
          if (!data.models.includes(selectedModel)) {
            setSelectedModel(data.models[0]);
          }
        } else {
            setModels([]);
            setUseAI(false);
        }
      } catch (error) {
        console.error('Error cargando modelos:', error);
        setModels([]);
        setUseAI(false);
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

  const updateCV = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setLoadingStage('validando');

    try {
      if (!formData.name || !formData.email) {
        throw new Error('Nombre y email son obligatorios');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No autenticado');
      }

      setLoadingStage('mejorando_ia');
      const res = await fetch(`http://localhost:8000/cv/${cvId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
          improve: useAI,
          model: selectedModel,
          formats: ['pdf']
        })
      });

      setLoadingStage('generando_pdf');
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Error al actualizar el CV');

      setLoadingStage('finalizando');
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Error al actualizar el CV');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const downloadPDF = () => {
    window.open(`http://localhost:8000/cv/${cvId}/pdf`, '_blank');
  };

  if (loadingCV) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-pulse mb-4">📄</div>
          <p className="text-purple-300 text-xl">Cargando CV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-white">Editar CV</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-300 hover:text-white transition"
          >
            Volver al Dashboard
          </button>
        </div>
        <p className="text-purple-300 text-center mb-8">Actualiza tu informacion profesional</p>

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
                placeholder="LinkedIn URL"
                value={formData.linkedin}
                onChange={e => setFormData({...formData, linkedin: e.target.value})}
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 2: Experiencia Laboral</h2>
              {formData.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-black/20 border border-purple-500/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold">Trabajo #{idx + 1}</h3>
                    <button onClick={() => removeExperience(idx)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                  </div>
                  <input placeholder="Empresa" value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <input placeholder="Cargo" value={exp.position} onChange={e => updateExperience(idx, 'position', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <input placeholder="Periodo (ej: 2020 - 2022)" value={exp.dates} onChange={e => updateExperience(idx, 'dates', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <input placeholder="Ubicacion" value={exp.location} onChange={e => updateExperience(idx, 'location', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <textarea placeholder="Logros (uno por linea)" value={exp.highlights} onChange={e => updateExperience(idx, 'highlights', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white min-h-[80px]" />
                </div>
              ))}
              <button onClick={addExperience} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">
                + Agregar trabajo
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 3: Educacion</h2>
              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-black/20 border border-purple-500/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold">Educacion #{idx + 1}</h3>
                    <button onClick={() => removeEducation(idx)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                  </div>
                  <input placeholder="Institucion" value={edu.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <input placeholder="Titulo/Grado" value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <input placeholder="Periodo (ej: 2016 - 2020)" value={edu.dates} onChange={e => updateEducation(idx, 'dates', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <input placeholder="Ubicacion" value={edu.location} onChange={e => updateEducation(idx, 'location', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                </div>
              ))}
              <button onClick={addEducation} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">
                + Agregar educacion
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 4: Habilidades</h2>
              <textarea
                placeholder="Habilidades (separadas por comas)"
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white min-h-[120px]"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 5: Resumen Profesional</h2>
              <textarea
                placeholder="Breve descripcion de tu perfil profesional..."
                value={formData.summary}
                onChange={e => setFormData({...formData, summary: e.target.value})}
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white min-h-[150px]"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 6: Estilo y Actualizacion</h2>

              {/* Selector de Tema */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Estilo del CV:</h3>
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
                            Actual
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

              {/* Opciones de IA - Solo visible si hay modelos disponibles */}
              {models.length > 0 && (
              <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white font-semibold text-lg">Usar IA para mejorar</label>
                    <p className="text-purple-300 text-sm mt-2">Optimizar logros con inteligencia artificial</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                    <div className="w-11 h-6 bg-purple-900 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {useAI && (
                  <div>
                    <label className="text-white font-semibold block mb-2">Modelo de IA:</label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white">
                      {models.map((model: string, index: number) => (
                        <option key={model || index} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              )}

              {loading && (
                <div className="bg-blue-600/20 border border-blue-500/30 p-6 rounded-lg">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-4xl animate-spin">⏳</div>
                    <div className="text-blue-200 text-xl">
                      {loadingStage === 'validando' && 'Validando...'}
                      {loadingStage === 'mejorando_ia' && 'Mejorando con IA...'}
                      {loadingStage === 'generando_pdf' && 'Generando PDF...'}
                      {loadingStage === 'finalizando' && 'Finalizando...'}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-6 rounded-lg">
                  <p className="font-semibold">Error: {error}</p>
                </div>
              )}

              {success ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-500/20 border border-green-500/30 p-8 rounded-lg">
                    <p className="text-green-300 text-4xl mb-4">CV actualizado!</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button onClick={downloadPDF} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition">
                      Descargar PDF
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="bg-black/40 text-purple-300 px-8 py-4 rounded-xl font-semibold hover:bg-purple-900/30 transition">
                      Ir al Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={updateCV} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-xl font-bold text-xl hover:opacity-90 transition disabled:opacity-50">
                  {loading ? 'Actualizando...' : 'Actualizar CV'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="bg-black/40 text-purple-300 px-6 py-3 rounded-lg disabled:opacity-50">
            Anterior
          </button>
          {step < 6 && (
            <button onClick={() => setStep(Math.min(6, step + 1))} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditCV() {
  return (
    <PrivateRoute>
      <EditorContent />
    </PrivateRoute>
  );
}
