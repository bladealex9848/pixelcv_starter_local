"use client";
import { useEffect, useState } from 'react';
import CVPreview from '../../../components/CVPreview';
import Toast from '../../../components/Toast';

interface CVClientWrapperProps {
  cv: any;
  slug: string;
}

export default function CVClientWrapper({ cv, slug }: CVClientWrapperProps) {
  const [cvData, setCvData] = useState(cv);
  const [liked, setLiked] = useState(false);
  const [viewMode, setViewMode] = useState<'render' | 'yaml'>('render');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Registrar visita
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/public/${slug}/visit?visitor_ip=${Date.now()}`, { method: 'POST' });
  }, [slug]);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setToast({ message: 'Debes iniciar sesión para dar like', type: 'error' });
      return;
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/${cvData?.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setLiked(!liked);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/public/${slug}`)
        .then(res => res.json())
        .then(setCvData);
      setToast({ message: '¡Like agregado!', type: 'success' });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setToast({ message: '¡Link copiado al portapapeles!', type: 'success' });
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="relative inline-block">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-teal-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)] uppercase">
            {cvData?.name}
          </h1>
          <div className="absolute -top-2 -left-3 w-2 h-2 bg-teal-400 animate-twinkle hidden md:block"></div>
          <div className="absolute -top-1 -right-2 w-1 h-1 bg-emerald-400 animate-twinkle-delayed hidden md:block"></div>
        </div>

        <div className="flex items-center justify-center md:justify-start gap-2 mt-3 flex-wrap">
          <div className="flex items-center gap-2 bg-teal-900/30 border border-teal-500/50 px-3 py-1 rounded-sm">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
            <span className="text-teal-300 text-xs font-bold uppercase">@{cvData?.author.username}</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/50 px-3 py-1 rounded-sm">
            <span>👁️</span>
            <span className="text-emerald-300 text-xs font-bold uppercase">{cvData?.total_visits || 0} Views</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div
          className="bg-black border-2 border-teal-900 p-1 transition-all duration-300 hover:border-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
        >
          <div className="bg-[#0a0a0a] p-5 text-center">
            <div className="text-3xl mb-2">❤️</div>
            <h3 className="text-3xl font-black text-teal-400">{cvData?.total_likes || 0}</h3>
            <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Likes</p>
          </div>
        </div>

        <div
          className="bg-black border-2 border-emerald-900 p-1 transition-all duration-300 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
        >
          <div className="bg-[#0a0a0a] p-5 text-center">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="text-3xl font-black text-emerald-400">{cvData?.total_comments || 0}</h3>
            <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Comments</p>
          </div>
        </div>

        <div
          className="bg-black border-2 border-cyan-900 p-1 transition-all duration-300 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
        >
          <div className="bg-[#0a0a0a] p-5 text-center">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="text-xl font-black text-cyan-400">Public</h3>
            <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Status</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-wider transition-all duration-300 ${
            liked
              ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]'
              : 'bg-teal-900/50 border border-teal-500/50 text-teal-300 hover:bg-teal-900/70'
          }`}
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{liked ? 'Liked!' : 'Like'}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-wider bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/70 transition-all duration-300"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          <span>🔗</span>
          <span>Share</span>
        </button>

        {cvData?.pdf_url && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}${cvData.pdf_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-wider bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all duration-300"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            <span>📄</span>
            <span>Download PDF</span>
          </a>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-black border-2 border-teal-900 p-1" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
          <button
            onClick={() => setViewMode('render')}
            className={`px-6 py-2 font-bold text-sm uppercase tracking-wider transition-all ${
              viewMode === 'render'
                ? 'bg-teal-600 text-white'
                : 'text-teal-400 hover:text-teal-300'
            }`}
          >
            🖼️ Render Preview
          </button>
          <button
            onClick={() => setViewMode('yaml')}
            className={`px-6 py-2 font-bold text-sm uppercase tracking-wider transition-all ${
              viewMode === 'yaml'
                ? 'bg-teal-600 text-white'
                : 'text-teal-400 hover:text-teal-300'
            }`}
          >
            📝 Raw YAML
          </button>
        </div>
      </div>

      {/* CV Content */}
      <div
        className="bg-black border-2 border-teal-900 p-1"
        style={{ clipPath: 'polygon(0 12px, 12px 12px, 12px 0, calc(100% - 12px) 0, calc(100% - 12px) 12px, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 12px calc(100% - 12px), 0 calc(100% - 12px))' }}
      >
        <div className="bg-[#0a0a0a] p-6 md:p-8">
          {viewMode === 'render' ? (
            <div className="cv-render-wrapper">
              <CVPreview yamlContent={cvData?.yaml_content || ''} design={cvData?.design} />
            </div>
          ) : (
            <div className="yaml-content overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {cvData?.yaml_content || 'No content available'}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Footer decoration */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-teal-600"></div>
          <div className="w-1 h-1 bg-teal-500"></div>
          <div className="w-1 h-1 bg-teal-400"></div>
        </div>
        <span className="text-gray-600 text-[10px] uppercase tracking-widest">PixelCV Public Profile</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-teal-400"></div>
          <div className="w-1 h-1 bg-teal-500"></div>
          <div className="w-1 h-1 bg-teal-600"></div>
        </div>
      </div>

      <style jsx>{`
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-twinkle-delayed {
          animation: twinkle 2.5s ease-in-out infinite 0.5s;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
