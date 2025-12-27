"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  has_ai: boolean;
  multiplayer: boolean;
}

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    // Fetch games list
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/list`)
      .then(res => res.json())
      .then(data => {
        setGames(data.games || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePlayGame = (gameId: string) => {
    router.push(`/games/${gameId}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Arcade': return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'Puzzle': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'Estrategia': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      default: return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080505] flex items-center justify-center pt-16">
        {/* Scanlines */}
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
          backgroundSize: '100% 2px'
        }}></div>
        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(249,115,22,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        <div className="text-center relative z-10">
          <div className="text-6xl animate-bounce mb-4">🕹️</div>
          <p className="text-orange-400 font-mono animate-pulse">LOADING ARCADE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080505] text-white font-mono pt-16 pb-12 px-4 relative overflow-hidden">

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(249,115,22,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Floating Pixel Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-orange-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-red-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[45%] left-[3%] w-2 h-2 bg-yellow-500 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[65%] right-[95%] w-1 h-1 bg-orange-400 opacity-60 animate-twinkle-delayed"></div>
        <div className="absolute top-[80%] left-[8%] w-1 h-1 bg-red-400 opacity-50 animate-twinkle"></div>

        {/* Floating retro icons */}
        <div className="absolute top-[20%] left-[5%] text-3xl opacity-15 animate-float-slow">🕹️</div>
        <div className="absolute top-[50%] right-[5%] text-2xl opacity-10 animate-float-medium">👾</div>
        <div className="absolute top-[75%] left-[8%] text-2xl opacity-15 animate-float-delayed">🏆</div>
      </div>

      {/* Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[12vw] font-black opacity-[0.015] tracking-widest text-orange-500 select-none">
          ARCADE
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="fixed top-20 left-4 pointer-events-none opacity-30 hidden md:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-orange-500"></div>
            <div className="w-2 h-2 bg-orange-400"></div>
            <div className="w-2 h-2 bg-orange-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-orange-400"></div>
          </div>
        </div>
      </div>
      <div className="fixed top-20 right-4 pointer-events-none opacity-30 rotate-90 hidden md:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-500"></div>
            <div className="w-2 h-2 bg-red-400"></div>
            <div className="w-2 h-2 bg-red-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-400"></div>
          </div>
        </div>
      </div>

      <main className="container mx-auto relative z-10 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] uppercase glitch-text" data-text="ARCADE">
              ARCADE
            </h1>
            <div className="absolute -top-2 -left-4 w-2 h-2 bg-orange-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-1 -right-3 w-1 h-1 bg-red-400 animate-twinkle-delayed hidden md:block"></div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-orange-900/30 border border-orange-500/50 px-4 py-1 rounded-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">8 Games Available</span>
            </div>
            {isAuthenticated ? (
              <div className="bg-yellow-900/30 border border-yellow-500/50 px-3 py-1 rounded-sm">
                <span className="text-yellow-300 text-xs font-mono">✓ Logged In - Earn Points!</span>
              </div>
            ) : (
              <div className="bg-gray-900/50 border border-gray-700 px-3 py-1 rounded-sm">
                <span className="text-gray-400 text-xs font-mono">Demo Mode - No Points</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="hidden md:flex gap-1">
              <div className="w-1 h-1 bg-orange-500"></div>
              <div className="w-1 h-1 bg-orange-400"></div>
              <div className="w-1 h-1 bg-orange-300"></div>
              <div className="w-2 h-1 bg-orange-200"></div>
            </div>
            <p className="text-gray-400 text-sm max-w-xl">
              Juega clásicos retro y gana puntos para subir de nivel
            </p>
            <div className="hidden md:flex gap-1">
              <div className="w-2 h-1 bg-orange-200"></div>
              <div className="w-1 h-1 bg-orange-300"></div>
              <div className="w-1 h-1 bg-orange-400"></div>
              <div className="w-1 h-1 bg-orange-500"></div>
            </div>
          </div>
        </header>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
          {games.map((game) => (
            <div
              key={game.id}
              className="group min-h-[460px]"
            >
              <div
                className="bg-black border-2 border-orange-900 p-1 transition-all duration-300 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105 h-full flex flex-col"
                style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
              >
                <div className="bg-[#0a0a0a] p-6 text-center flex flex-col h-full">
                  {/* Icon */}
                  <div className="text-5xl mb-3 h-16 flex items-center justify-center">
                    {game.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-orange-400 mb-2 uppercase leading-tight">
                    {game.name}
                  </h3>

                  {/* Category Badge */}
                  <div className={`inline-block px-2 py-1 text-[10px] font-bold uppercase border rounded-sm mb-3 ${getCategoryColor(game.category)}`}>
                    {game.category}
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-xs mb-4 flex-1">
                    {game.description}
                  </p>

                  {/* Features */}
                  <div className="flex justify-center gap-2 mb-4">
                    {game.has_ai && (
                      <div className="bg-purple-900/30 border border-purple-500/50 px-2 py-1 rounded-sm">
                        <span className="text-purple-300 text-[10px] font-bold uppercase">🤖 AI</span>
                      </div>
                    )}
                    {game.multiplayer && (
                      <div className="bg-blue-900/30 border border-blue-500/50 px-2 py-1 rounded-sm">
                        <span className="text-blue-300 text-[10px] font-bold uppercase">👥 Multi</span>
                      </div>
                    )}
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayGame(game.id)}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-wider py-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:from-orange-500 hover:to-red-500"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    Play Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {games.length === 0 && (
          <div className="text-center py-20 space-y-6">
            <div className="text-6xl animate-bounce">🕹️</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-400">NO GAMES FOUND</h3>
              <p className="text-gray-500 text-sm">Los juegos estarán disponibles pronto</p>
            </div>
          </div>
        )}

        {/* Arcade Footer */}
        <footer className="text-center space-y-6 mt-16">
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-orange-600"></div>
              <div className="w-1 h-1 bg-orange-500"></div>
              <div className="w-1 h-1 bg-orange-400"></div>
            </div>
            <div className="w-16 h-[2px] bg-gradient-to-r from-orange-600 to-transparent"></div>
            <span className="text-orange-500 text-lg">🕹️</span>
            <div className="w-16 h-[2px] bg-gradient-to-l from-orange-600 to-transparent"></div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-orange-400"></div>
              <div className="w-1 h-1 bg-orange-500"></div>
              <div className="w-1 h-1 bg-orange-600"></div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
            <span>PIXELCV ARCADE</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              PLAY & EARN
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
          50% { transform: translateY(-15px) rotate(3deg); }
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
          text-shadow: -2px 0 #ff6600;
          clip-path: inset(0 0 50% 0);
          animation: glitch-top 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: 2px 0 #ffcc00;
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
