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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-purple-500/20 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🤖</span> {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`text-gray-400 hover:text-white transition ${isLoading ? 'opacity-0 cursor-not-allowed' : ''}`}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 text-gray-200 leading-relaxed">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="text-5xl animate-bounce">🧠</div>
              <p className="text-purple-300 text-lg">Analizando tu perfil profesional...</p>
              <p className="text-slate-500 text-sm italic">Esto puede tomar hasta un minuto dependiendo de la IA</p>
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
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-purple-500/20 flex justify-end bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isLoading ? 'Analizando...' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
