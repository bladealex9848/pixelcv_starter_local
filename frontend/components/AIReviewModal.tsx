import React from 'react';

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (improvedExperience: any[]) => void;
  originalExperience: any[];
  improvedExperience: any[];
}

export default function AIReviewModal({ isOpen, onClose, onAccept, originalExperience, improvedExperience }: AIReviewModalProps) {
  if (!isOpen) return null;

  const hasAnyChanges = improvedExperience.some((exp, idx) => exp.highlights !== originalExperience[idx]?.highlights);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-purple-500/20 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Revisión de Sugerencias IA</h2>
            <p className="text-purple-300 text-sm">Compara y selecciona las mejoras para tus logros profesionales</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {improvedExperience.map((exp: any, idx: number) => {
            const originalHighlights = originalExperience[idx]?.highlights || '';
            const improvedHighlights = exp.highlights || '';
            const hasChanges = originalHighlights !== improvedHighlights;

            if (!hasChanges) return null;

            return (
              <div key={idx} className="bg-black/40 rounded-xl p-4 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {exp.company} - {exp.position}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      <span>Tu versión</span>
                    </div>
                    <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-line min-h-[100px]">
                      {originalHighlights}
                    </div>
                  </div>

                  {/* Improved */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-wider text-green-400 font-semibold">
                      <span>Sugerencia IA ✨</span>
                    </div>
                    <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-3 text-white text-sm whitespace-pre-line min-h-[100px]">
                      {improvedHighlights}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {!hasAnyChanges && (
             <div className="text-center text-gray-400 py-10">
               La IA no encontró mejoras significativas para el texto actual. ¡Ya está excelente!
             </div>
          )}
        </div>

        <div className="p-6 border-t border-purple-500/20 flex justify-end space-x-4 bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-transparent border border-gray-600 text-gray-300 hover:bg-white/5 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onAccept(improvedExperience)}
            disabled={!hasAnyChanges}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aplicar Mejoras
          </button>
        </div>
      </div>
    </div>
  );
}
