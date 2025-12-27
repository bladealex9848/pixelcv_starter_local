"use client";
import { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

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
        className={`relative bg-[#0a0a0a] border-2 border-cyan-500 max-w-2xl w-full max-h-[90vh] overflow-hidden transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner pixels */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

        {/* Floating pixels */}
        <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-cyan-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[20%] right-[10%] w-1 h-1 bg-blue-400 opacity-40 animate-twinkle-delayed"></div>

        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 border-b border-cyan-400">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
              <span className="text-3xl">🎮</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-200 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                {title}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors text-2xl hover:scale-110 transform"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>

        {/* Footer decoration */}
        <div className="flex items-center justify-center gap-2 py-3 border-t border-cyan-900 bg-[#050505]">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-cyan-600"></div>
            <div className="w-1 h-1 bg-cyan-500"></div>
            <div className="w-1 h-1 bg-cyan-400"></div>
          </div>
          <span className="text-cyan-700 text-[10px] uppercase tracking-widest">PixelCV Gamification</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-cyan-400"></div>
            <div className="w-1 h-1 bg-cyan-500"></div>
            <div className="w-1 h-1 bg-cyan-600"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-twinkle-delayed {
          animation: twinkle 2.5s ease-in-out infinite 0.5s;
        }
      `}</style>
    </div>
  );
}
