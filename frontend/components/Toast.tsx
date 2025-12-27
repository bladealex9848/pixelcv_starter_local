"use client";
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: {
      bg: 'from-green-600 to-emerald-600',
      border: 'border-green-900',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',
      icon: '✅'
    },
    error: {
      bg: 'from-red-600 to-pink-600',
      border: 'border-red-900',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]',
      icon: '❌'
    },
    info: {
      bg: 'from-cyan-600 to-blue-600',
      border: 'border-cyan-900',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
      icon: 'ℹ️'
    }
  };

  const theme = colors[type];

  return (
    <div
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div
        className={`relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r ${theme.bg} text-white font-mono text-sm border-2 ${theme.border} ${theme.glow} transition-all duration-300`}
        style={{
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
        }}
      >
        {/* Floating pixels around the toast */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-400 animate-twinkle"></div>
        <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-emerald-400 animate-twinkle-delayed"></div>

        {/* Icon */}
        <span className="text-xl">{theme.icon}</span>

        {/* Message */}
        <span className="font-bold uppercase tracking-wider">{message}</span>

        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 text-white/70 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 1s ease-in-out infinite;
        }
        .animate-twinkle-delayed {
          animation: twinkle 1.2s ease-in-out infinite 0.3s;
        }
      `}</style>
    </div>
  );
}
