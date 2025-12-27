"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CVPreview from '../../../components/CVPreview';

export default function PublicCVPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [viewMode, setViewMode] = useState<'render' | 'yaml'>('render');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/public/${slug}`)
      .then(res => res.json())
      .then(data => {
        setCv(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/public/${slug}/visit?visitor_ip=${Date.now()}`, { method: 'POST' });
  }, [slug]);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para dar like');
      return;
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/${cv?.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setLiked(!liked);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/public/${slug}`)
        .then(res => res.json())
        .then(setCv);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    alert('¡Link copiado al portapapeles!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020a0a] flex items-center justify-center relative overflow-hidden">
        {/* Scanlines */}
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
          backgroundSize: '100% 2px'
        }}></div>
        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        {/* Floating Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-teal-500 opacity-60 animate-twinkle"></div>
          <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-cyan-400 opacity-40 animate-twinkle-delayed"></div>
          <div className="absolute top-[60%] left-[5%] w-1 h-1 bg-emerald-400 opacity-50 animate-twinkle"></div>
          <div className="absolute top-[80%] right-[8%] w-2 h-2 bg-teal-400 opacity-40 animate-twinkle-delayed"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="text-6xl animate-bounce mb-4">📄</div>
          <p className="text-teal-400 font-mono animate-pulse">Loading CV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020a0a] text-white font-mono pt-16 pb-12 px-4 relative overflow-hidden">

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Floating Pixel Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-teal-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-cyan-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[45%] left-[3%] w-2 h-2 bg-emerald-500 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[65%] right-[95%] w-1 h-1 bg-teal-400 opacity-60 animate-twinkle-delayed"></div>
        <div className="absolute top-[80%] left-[8%] w-1 h-1 bg-cyan-400 opacity-50 animate-twinkle"></div>

        {/* Floating Icons */}
        <div className="absolute top-[20%] left-[5%] text-3xl opacity-15 animate-float-slow">📄</div>
        <div className="absolute top-[50%] right-[5%] text-2xl opacity-10 animate-float-medium">🏆</div>
        <div className="absolute top-[75%] left-[8%] text-2xl opacity-15 animate-float-delayed">⭐</div>
      </div>

      {/* Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[12vw] font-black opacity-[0.015] tracking-widest text-teal-500 select-none">
          CV PREVIEW
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="relative inline-block">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-teal-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)] uppercase">
              {cv?.name}
            </h1>
            <div className="absolute -top-2 -left-3 w-2 h-2 bg-teal-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-1 -right-2 w-1 h-1 bg-emerald-400 animate-twinkle-delayed hidden md:block"></div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-2 bg-teal-900/30 border border-teal-500/50 px-3 py-1 rounded-sm">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
              <span className="text-teal-300 text-xs font-bold uppercase">@{cv?.author.username}</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/50 px-3 py-1 rounded-sm">
              <span>👁️</span>
              <span className="text-emerald-300 text-xs font-bold uppercase">{cv?.total_visits || 0} Views</span>
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
              <h3 className="text-3xl font-black text-teal-400">{cv?.total_likes || 0}</h3>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Likes</p>
            </div>
          </div>

          <div
            className="bg-black border-2 border-emerald-900 p-1 transition-all duration-300 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
          >
            <div className="bg-[#0a0a0a] p-5 text-center">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="text-3xl font-black text-emerald-400">{cv?.total_comments || 0}</h3>
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

          {cv?.pdf_url && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}${cv.pdf_url}`}
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
                <CVPreview yamlContent={cv?.yaml_content || ''} design={cv?.design} />
              </div>
            ) : (
              <div className="yaml-content overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {cv?.yaml_content || 'No content available'}
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
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float 6s ease-in-out infinite 1s;
        }
        .animate-float-delayed {
          animation: float 7s ease-in-out infinite 2s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
