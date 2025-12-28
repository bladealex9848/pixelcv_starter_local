"use client";
import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      border: 'border-red-500',
      header: 'from-red-600 to-red-800',
      headerBorder: 'border-red-400',
      accent: 'red',
      confirmBtn: 'bg-red-600 hover:bg-red-500 border-red-400',
      icon: '🗑️'
    },
    warning: {
      border: 'border-orange-500',
      header: 'from-orange-600 to-orange-800',
      headerBorder: 'border-orange-400',
      accent: 'orange',
      confirmBtn: 'bg-orange-600 hover:bg-orange-500 border-orange-400',
      icon: '⚠️'
    },
    info: {
      border: 'border-cyan-500',
      header: 'from-cyan-600 to-blue-600',
      headerBorder: 'border-cyan-400',
      accent: 'cyan',
      confirmBtn: 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400',
      icon: '✨'
    }
  };

  const styles = variantStyles[variant];

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
        className={`relative bg-[#0a0a0a] border-2 ${styles.border} max-w-md w-full overflow-hidden transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner pixels */}
        <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${styles.border}`}></div>
        <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${styles.border}`}></div>
        <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${styles.border}`}></div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${styles.border}`}></div>

        {/* Header */}
        <div className={`bg-gradient-to-r ${styles.header} p-4 border-b ${styles.headerBorder}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{styles.icon}</span>
            <h2 className="text-lg font-black italic tracking-tight text-white uppercase">
              {title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 text-sm font-mono leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-800 bg-[#050505]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-gray-800 border border-gray-600 text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-700 hover:text-white transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 ${styles.confirmBtn} border text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 15px currentColor; }
        }
      `}</style>
    </div>
  );
}
