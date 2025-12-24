"use client";
import { useEffect, useState } from 'react';

interface CV {
  id: string;
  name: string;
  slug: string;
  author: { username: string; avatar_url: string };
  total_visits: number;
  total_likes: number;
  total_comments: number;
  created_at: string;
}

export default function CommunityPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created');

  useEffect(() => {
    fetchCVs();
  }, [sortBy]);

  const fetchCVs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/browse?sort_by=${sortBy}`);
      const data = await response.json();
      setCvs(data.cvs || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center pt-16">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">👾</div>
          <div className="text-purple-400 text-xl font-mono animate-pulse">LOADING_COMMUNITY...</div>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-purple-500 animate-ping"></div>
            <div className="w-2 h-2 bg-purple-400 animate-ping" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-300 animate-ping" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden pt-16 relative">

      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Floating Pixel Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-purple-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] left-[90%] w-1 h-1 bg-cyan-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[45%] left-[3%] w-2 h-2 bg-pink-500 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[65%] left-[95%] w-1 h-1 bg-yellow-400 opacity-60 animate-twinkle-delayed"></div>
        <div className="absolute top-[80%] left-[8%] w-1 h-1 bg-green-400 opacity-50 animate-twinkle"></div>

        {/* Floating retro icons */}
        <div className="absolute top-[12%] left-[8%] text-3xl opacity-20 animate-float-slow">👾</div>
        <div className="absolute top-[30%] right-[6%] text-2xl opacity-15 animate-float-medium">🎮</div>
        <div className="absolute top-[55%] left-[5%] text-2xl opacity-20 animate-float-delayed">📄</div>
        <div className="absolute top-[75%] right-[4%] text-3xl opacity-15 animate-float-slow">🏆</div>
        <div className="absolute top-[90%] left-[10%] text-2xl opacity-20 animate-float-medium">💼</div>
      </div>

      {/* Large Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[12vw] font-black opacity-[0.02] tracking-widest text-purple-500 select-none animate-pulse-slow">
          COMMUNITY
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="fixed top-20 left-4 pointer-events-none opacity-30 hidden md:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-pink-500"></div>
            <div className="w-2 h-2 bg-pink-400"></div>
            <div className="w-2 h-2 bg-pink-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-pink-400"></div>
          </div>
        </div>
      </div>
      <div className="fixed top-20 right-4 pointer-events-none opacity-30 rotate-90 hidden md:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-500"></div>
            <div className="w-2 h-2 bg-cyan-400"></div>
            <div className="w-2 h-2 bg-cyan-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-400"></div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-pink-400 to-purple-900 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] uppercase glitch-text" data-text="COMMUNITY">
              COMMUNITY
            </h1>
            <div className="absolute -top-2 -left-4 w-2 h-2 bg-cyan-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-1 -right-3 w-1 h-1 bg-pink-400 animate-twinkle-delayed hidden md:block"></div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-pink-900/30 border border-pink-500/50 px-4 py-1 rounded-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className="text-pink-300 text-xs font-bold uppercase tracking-wider">Gallery Online</span>
            </div>
            <div className="bg-gray-900/50 border border-gray-700 px-3 py-1 rounded-sm">
              <span className="text-gray-400 text-xs font-mono">{cvs.length} CVs</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="hidden md:flex gap-1">
              <div className="w-1 h-1 bg-pink-500"></div>
              <div className="w-1 h-1 bg-pink-400"></div>
              <div className="w-1 h-1 bg-pink-300"></div>
              <div className="w-2 h-1 bg-pink-200"></div>
            </div>
            <p className="text-gray-400 text-sm max-w-xl">
              Descubre CVs profesionales creados por la comunidad
            </p>
            <div className="hidden md:flex gap-1">
              <div className="w-2 h-1 bg-pink-200"></div>
              <div className="w-1 h-1 bg-pink-300"></div>
              <div className="w-1 h-1 bg-pink-400"></div>
              <div className="w-1 h-1 bg-pink-500"></div>
            </div>
          </div>
        </header>

        {/* Sort Buttons */}
        <div className="flex justify-center gap-3 mb-10">
          <button
            onClick={() => setSortBy('created')}
            className={`group relative px-5 py-2 font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
              sortBy === 'created'
                ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]'
                : 'bg-black/50 text-gray-400 border border-gray-700 hover:border-pink-500 hover:text-pink-400'
            }`}
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            <span className="flex items-center gap-2">
              <span>🕐</span> Recientes
            </span>
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`group relative px-5 py-2 font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
              sortBy === 'popular'
                ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]'
                : 'bg-black/50 text-gray-400 border border-gray-700 hover:border-pink-500 hover:text-pink-400'
            }`}
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            <span className="flex items-center gap-2">
              <span>❤️</span> Populares
            </span>
          </button>
          <button
            onClick={() => setSortBy('visited')}
            className={`group relative px-5 py-2 font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
              sortBy === 'visited'
                ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]'
                : 'bg-black/50 text-gray-400 border border-gray-700 hover:border-pink-500 hover:text-pink-400'
            }`}
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            <span className="flex items-center gap-2">
              <span>👁️</span> Visitados
            </span>
          </button>
        </div>

        {/* CV Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map((cv, idx) => (
            <a key={cv.id} href={`/cv/${cv.slug}`} className="block group">
              <div
                className="relative bg-black border-2 border-pink-900 hover:border-pink-500 transition-all duration-300 p-1 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]"
                style={{ clipPath: 'polygon(0 5px, 5px 5px, 5px 0, calc(100% - 5px) 0, calc(100% - 5px) 5px, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 5px calc(100% - 5px), 0 calc(100% - 5px))' }}
              >
                <div className="bg-[#111] p-5 space-y-4">
                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={cv.author.avatar_url}
                        alt={cv.author.username}
                        className="w-10 h-10 rounded-sm border-2 border-pink-500/50 group-hover:border-pink-400 transition-colors"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse"></div>
                    </div>
                    <div>
                      <span className="text-pink-400 text-sm font-bold">@{cv.author.username}</span>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Player {idx + 1}</div>
                    </div>
                  </div>

                  {/* CV Name */}
                  <h3 className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors leading-tight">
                    {cv.name}
                  </h3>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-900/50 p-2 border border-gray-800 group-hover:border-pink-900 transition-colors">
                      <div className="text-lg">❤️</div>
                      <div className="text-sm font-bold text-pink-400">{cv.total_likes}</div>
                      <div className="text-[9px] text-gray-500 uppercase">Likes</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 border border-gray-800 group-hover:border-pink-900 transition-colors">
                      <div className="text-lg">👁️</div>
                      <div className="text-sm font-bold text-cyan-400">{cv.total_visits}</div>
                      <div className="text-[9px] text-gray-500 uppercase">Views</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 border border-gray-800 group-hover:border-pink-900 transition-colors">
                      <div className="text-lg">💬</div>
                      <div className="text-sm font-bold text-yellow-400">{cv.total_comments}</div>
                      <div className="text-[9px] text-gray-500 uppercase">Comments</div>
                    </div>
                  </div>

                  {/* View Button */}
                  <div className="pt-2 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 ${i < Math.min(cv.total_likes, 5) ? 'bg-pink-500 shadow-[0_0_5px_rgba(236,72,153,0.5)]' : 'bg-gray-800'}`}></div>
                        ))}
                      </div>
                      <span className="text-[10px] uppercase font-black text-pink-400 group-hover:text-white transition-colors flex items-center gap-1">
                        Ver CV <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Empty State */}
        {cvs.length === 0 && (
          <div className="text-center py-20 space-y-6">
            <div className="text-6xl animate-bounce">📄</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-400">NO CVs FOUND</h3>
              <p className="text-gray-500 text-sm">La comunidad espera tu primer CV</p>
            </div>
            <a
              href="/editor"
              className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 py-3 transition-colors"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              CREAR MI CV
            </a>
          </div>
        )}

        {/* Retro Footer */}
        <footer className="text-center space-y-6 mt-16">
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-pink-600"></div>
              <div className="w-1 h-1 bg-pink-500"></div>
              <div className="w-1 h-1 bg-pink-400"></div>
            </div>
            <div className="w-16 h-[2px] bg-gradient-to-r from-pink-600 to-transparent"></div>
            <span className="text-pink-500 text-lg">📄</span>
            <div className="w-16 h-[2px] bg-gradient-to-l from-pink-600 to-transparent"></div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-pink-400"></div>
              <div className="w-1 h-1 bg-pink-500"></div>
              <div className="w-1 h-1 bg-pink-600"></div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
            <span>PIXELCV COMMUNITY</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              SHARE YOUR STORY
              <span className="animate-pulse">_</span>
            </span>
          </div>
        </footer>
      </main>

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
          25% { transform: translateY(-10px) rotate(3deg); }
          50% { transform: translateY(-5px) rotate(-2deg); }
          75% { transform: translateY(-15px) rotate(2deg); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }

        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -2px 0 #ff00ff;
          clip-path: inset(0 0 50% 0);
          animation: glitch-top 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: 2px 0 #00ffff;
          clip-path: inset(50% 0 0 0);
          animation: glitch-bottom 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch-top {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-2px, 1px); }
          94% { transform: translate(2px, -1px); }
          96% { transform: translate(-1px, 2px); }
          98% { transform: translate(1px, -2px); }
        }
        @keyframes glitch-bottom {
          0%, 90%, 100% { transform: translate(0); }
          91% { transform: translate(2px, 1px); }
          93% { transform: translate(-2px, -1px); }
          95% { transform: translate(1px, 2px); }
          97% { transform: translate(-1px, -2px); }
        }
      `}</style>
    </div>
  );
}
