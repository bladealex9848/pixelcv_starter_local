"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PrivateRoute from '../../../components/PrivateRoute';
import AIReviewModal from '../../../components/AIReviewModal';
import MarkdownModal from '../../../components/MarkdownModal';

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
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('phi3.5:latest');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Estado para Revision IA Contextual
  const [showAIModal, setShowAIModal] = useState(false);
  const [improvedExperience, setImprovedExperience] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeField, setActiveField] = useState<{type: 'experience' | 'skills' | 'summary', index?: number} | null>(null);

  // Estado para Revision General
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

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

        if (!res.ok) throw new Error('CV no encontrado');

        const data = await res.json();
        const cvData = data.data?.cv || {};
        const designData = data.data?.design || {};

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
      experience: [...formData.experience, { company: '', position: '', dates: '', location: '', highlights: '' }]
    });
  };

  const updateExperience = (idx: number, field: string, value: string) => {
    const exp = [...formData.experience];
    exp[idx] = { ...exp[idx], [field]: value };
    setFormData({ ...formData, experience: exp });
  };

  const removeExperience = (idx: number) => {
    setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== idx) });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { institution: '', degree: '', dates: '', location: '' }]
    });
  };

  const updateEducation = (idx: number, field: string, value: string) => {
    const edu = [...formData.education];
    edu[idx] = { ...edu[idx], [field]: value };
    setFormData({ ...formData, education: edu });
  };

  const removeEducation = (idx: number) => {
    setFormData({ ...formData, education: formData.education.filter((_, i) => i !== idx) });
  };

  // Logica de Mejora con IA
  const analyzeContent = async (text: string | string[], instruction?: string) => {
    const bulletsArray = Array.isArray(text) ? text : text.split('\n').filter(t => t.trim());
    if (bulletsArray.length === 0) return [];

    const res = await fetch('http://localhost:8000/ollama/improve-bullets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bullets: bulletsArray, model: selectedModel, instruction })
    });
    
    const data = await res.json();
    return data.improved || [];
  };

  const handleAnalyzeClick = async (type: 'experience' | 'skills' | 'summary', index?: number, instruction?: string) => {
    setIsAnalyzing(true);
    setActiveField({ type, index });
    setError('');

    try {
      let improvedContent = [];

      if (type === 'experience' && typeof index === 'number') {
        const exp = formData.experience[index];
        const improvedBullets = await analyzeContent(exp.highlights, instruction);
        improvedContent = [{ ...exp, highlights: improvedBullets.join('\n') }];
      } else if (type === 'summary') {
        const text = formData.summary;
        const improvedBullets = await analyzeContent([text], instruction || "Mejora este resumen profesional para que sea impactante y conciso.");
        improvedContent = [{ highlights: improvedBullets.join('\n'), company: 'Resumen Profesional', position: '' }];
      } else if (type === 'skills') {
        const text = formData.skills;
        const improvedBullets = await analyzeContent([text], instruction || "Formatea y agrupa estas habilidades técnicas de forma profesional.");
        improvedContent = [{ highlights: improvedBullets.join(', '), company: 'Habilidades', position: '' }];
      }

      setImprovedExperience(improvedContent);
      setShowAIModal(true);
    } catch (e: any) {
      setError('Error al analizar con IA: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerate = (instruction: string) => {
    if (activeField) handleAnalyzeClick(activeField.type, activeField.index, instruction);
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

  const handleFullReview = async () => {
    setIsReviewing(true);
    setReviewContent('');
    setShowReviewModal(true);
    try {
      const res = await fetch('http://localhost:8000/ollama/review-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_data: formData, model: selectedModel })
      });
      const data = await res.json();
      setReviewContent(data.review);
    } catch (e: any) {
      setReviewContent('Error al realizar la revisión: ' + e.message);
    } finally {
      setIsReviewing(false);
    }
  };

  const updateCV = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setLoadingStage('validando');

    try {
      if (!formData.name || !formData.email) throw new Error('Nombre y email son obligatorios');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No autenticado');

      setLoadingStage('generando_pdf');
      const res = await fetch(`http://localhost:8000/cv/${cvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
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
          improve: false,
          model: selectedModel,
          formats: ['pdf']
        })
      });

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

  // Botón de IA reutilizable con estado de carga
  const AIButton = ({ onClick, visible, isActive }: { onClick: () => void, visible: boolean, isActive: boolean }) => {
    if (!visible || models.length === 0) return null;
    return (
      <button
        onClick={onClick}
        disabled={isActive}
        className={`absolute right-2 bottom-2 text-xs text-white px-3 py-1 rounded-full flex items-center gap-1 transition shadow-lg backdrop-blur-sm z-10 ${
          isActive ? 'bg-purple-500/50 cursor-not-allowed' : 'bg-purple-600/80 hover:bg-purple-500'
        }`}
        title="Mejorar con IA"
      >
        {isActive ? (
          <>
            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
            <span>Pensando...</span>
          </>
        ) : (
          <>
            <span>✨</span> Mejorar
          </>
        )}
      </button>
    );
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
          <button onClick={() => router.push('/dashboard')} className="text-purple-300 hover:text-white transition">Volver al Dashboard</button>
        </div>
        <div className="mb-8">
          <div className="w-full bg-black/40 rounded-full h-3 mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" style={{width: `${(step/6)*100}%`}}></div>
          </div>
          <div className="flex justify-between text-purple-300 text-sm">
            <span>Paso {step} de 6</span>
            <span>{Math.round((step/6)*100)}% completado</span>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 mb-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 1: Información Personal</h2>
              <input placeholder="Nombre completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white focus:border-purple-400" />
              <input placeholder="Email *" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white focus:border-purple-400" />
              <input placeholder="Telefono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white" />
              <input placeholder="Ciudad/Pais" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white" />
              <input placeholder="LinkedIn URL" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white" />
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
                  <input placeholder="Periodo" value={exp.dates} onChange={e => updateExperience(idx, 'dates', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <div className="relative">
                    <textarea placeholder="Logros (uno por linea)" value={exp.highlights} onChange={e => updateExperience(idx, 'highlights', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white min-h-[80px]" />
                    <AIButton 
                      onClick={() => handleAnalyzeClick('experience', idx)} 
                      visible={exp.highlights.length > 20} 
                      isActive={isAnalyzing && activeField?.type === 'experience' && activeField?.index === idx}
                    />
                  </div>
                </div>
              ))}
              <button onClick={addExperience} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30">+ Agregar trabajo</button>
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
                  <input placeholder="Grado" value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                  <input placeholder="Periodo" value={edu.dates} onChange={e => updateEducation(idx, 'dates', e.target.value)} className="w-full p-2 rounded bg-black/40 border border-purple-500/30 text-white" />
                </div>
              ))}
              <button onClick={addEducation} className="w-full p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition">+ Agregar educacion</button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 4: Habilidades</h2>
              <div className="relative">
                <textarea placeholder="Habilidades (separadas por comas)" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white min-h-[120px]" />
                <AIButton 
                  onClick={() => handleAnalyzeClick('skills')} 
                  visible={formData.skills.length > 10} 
                  isActive={isAnalyzing && activeField?.type === 'skills'}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 5: Resumen Profesional</h2>
              <div className="relative">
                <textarea placeholder="Describe tu perfil profesional..." value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white min-h-[150px]" />
                <AIButton 
                  onClick={() => handleAnalyzeClick('summary')} 
                  visible={formData.summary.length > 20} 
                  isActive={isAnalyzing && activeField?.type === 'summary'}
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Paso 6: Estilo y Actualizacion</h2>
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Estilo del CV:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button key={theme.id} onClick={() => setFormData({...formData, theme: theme.id})} className={`relative group rounded-lg overflow-hidden border-2 transition-all ${formData.theme === theme.id ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-purple-500/30 hover:border-purple-500/60'}`}>
                      <div className="aspect-[3/4] relative bg-white">
                        <img src={`/themes/${theme.id}.png`} alt={theme.name} className="w-full h-full object-cover object-top" />
                        {formData.theme === theme.id && <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">Actual</div>}
                      </div>
                      <div className="p-2 bg-black/60">
                        <p className="text-white font-medium text-sm">{theme.name}</p>
                        <p className="text-purple-300 text-xs">{theme.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {models.length > 0 && (
                <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-lg space-y-4">
                  <h3 className="text-white font-semibold text-lg text-center">🤖 Asistente Final</h3>
                  <div className="flex gap-4">
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="flex-1 p-2 rounded-lg bg-black/40 border border-purple-500/30 text-white text-sm">
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button 
                      onClick={handleFullReview} 
                      disabled={isReviewing}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-lg ${
                        isReviewing 
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90'
                      }`}
                    >
                      <span>{isReviewing ? '⏳' : '🔍'}</span> {isReviewing ? 'Analizando...' : 'Revisión Integral'}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg text-sm">{error}</div>}

              {success ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-500/20 border border-green-500/30 p-8 rounded-lg">
                    <p className="text-green-300 text-2xl font-bold mb-2">¡CV Actualizado!</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button onClick={downloadPDF} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold">Descargar PDF</button>
                    <button onClick={() => router.push('/dashboard')} className="bg-black/40 text-purple-300 px-8 py-4 rounded-xl font-semibold">Dashboard</button>
                  </div>
                </div>
              ) : (
                <button onClick={updateCV} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-xl font-bold text-xl disabled:opacity-50">
                  {loading ? loadingStage : 'Actualizar CV'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="bg-black/40 text-purple-300 px-6 py-3 rounded-lg disabled:opacity-50">Anterior</button>
          {step < 6 && <button onClick={() => setStep(Math.min(6, step + 1))} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">Siguiente</button>}
        </div>
      </div>

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
      <MarkdownModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Análisis Integral del CV"
        content={reviewContent}
        isLoading={isReviewing}
      />
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