import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading?: boolean;
}

export default function MarkdownModal({ isOpen, onClose, title, content, isLoading }: MarkdownModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 crt-effect">
      {/* Scanlines overlay for retro effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      <div className="bg-slate-900 border-2 border-purple-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-purple-500/20 relative z-10 pixel-border">
        {/* Pixel border effect */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{
          clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))'
        }}></div>

        <div className="p-6 border-b border-purple-500/20 flex justify-between items-center relative z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 pixel-font">
            <span className="text-3xl">🤖</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] uppercase tracking-tight">
              {title}
            </span>
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`text-gray-400 hover:text-white transition text-2xl ${isLoading ? 'opacity-0 cursor-not-allowed' : 'hover:scale-110'}`}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 text-gray-200 leading-relaxed relative z-10 grid-background-purple">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="text-6xl animate-bounce glow-text" style={{color: '#a855f7'}}>🧠</div>
              <p className="text-purple-300 text-xl font-semibold pixel-font">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">ANALIZANDO TU PERFIL PROFESIONAL</span>
              </p>
              <p className="text-slate-400 text-sm italic pixel-font">
                ESTO PUEDE TOMAR HASTA UN MINUTO DEPENDIENDO DE LA IA
              </p>
              {/* Loading dots animation */}
              <div className="flex space-x-1 mt-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-purple max-w-none
              prose-headings:text-purple-300 prose-headings:font-bold prose-headings:border-b prose-headings:border-purple-500/20 prose-headings:pb-2 prose-headings:mb-4
              prose-h3:text-xl prose-h3:mt-6
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-ul:space-y-2 prose-ul:my-4
              prose-li:text-gray-300
              prose-strong:text-purple-200 prose-strong:font-semibold
              prose-em:text-gray-400
              prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
              pixel-font
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-purple-500/20 flex justify-end bg-slate-900/50 rounded-b-2xl relative z-10">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-8 py-3 rounded-lg font-black text-sm uppercase tracking-wider transition transform hover:scale-105 shadow-lg ${
              isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-gray-500/50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-purple-500/50'
            }`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></span>
                ANALIZANDO...
              </>
            ) : (
              'ENTENDIDO'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
