"use client";
import { useEffect, useState } from 'react';

interface EditPixelartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  currentTitle: string;
  isLoading?: boolean;
}

export default function EditPixelartModal({
  isOpen,
  onClose,
  onSave,
  currentTitle,
  isLoading = false
}: EditPixelartModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTitle(currentTitle);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Modal content */}
      <div
        className={`relative bg-[#0a0a0a] border-2 border-orange-500 max-w-md w-full overflow-hidden transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner pixels */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500"></div>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 p-4 border-b border-orange-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <h2 className="text-lg font-black italic tracking-tight text-white uppercase">
                Editar obra
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors text-xl hover:scale-110 transform"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
              Título de la obra
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border-2 border-orange-900 focus:border-orange-500 text-white px-4 py-3 font-mono text-sm outline-none transition-colors"
              placeholder="Ingresa el título..."
              autoFocus
              disabled={isLoading}
            />
          </div>

          <p className="text-gray-500 text-xs font-mono">
            Para editar los píxeles, ve al editor y crea una nueva versión.
          </p>
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-800 bg-[#050505]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-gray-800 border border-gray-600 text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-700 hover:text-white transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-500 border border-orange-400 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
