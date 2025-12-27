"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Toast from '../../../components/Toast';

// Lazy load game components
import dynamic from 'next/dynamic';

// Import game components dynamically
const PongGame = dynamic(() => import('../../../components/games/PongGame'), { ssr: false });
const TicTacToe = dynamic(() => import('../../../components/games/TicTacToe'), { ssr: false });
const MemoryMatch = dynamic(() => import('../../../components/games/MemoryMatch'), { ssr: false });
const SnakeGame = dynamic(() => import('../../../components/games/SnakeGame'), { ssr: false });
const BreakoutGame = dynamic(() => import('../../../components/games/BreakoutGame'), { ssr: false });
const Game2048 = dynamic(() => import('../../../components/games/Game2048'), { ssr: false });
const TetrisGame = dynamic(() => import('../../../components/games/TetrisGame'), { ssr: false });
const SpaceInvaders = dynamic(() => import('../../../components/games/SpaceInvaders'), { ssr: false });

const GAMES_CONFIG: Record<string, { name: string; icon: string; component: any }> = {
  pong: { name: 'Pong', icon: '🏓', component: PongGame },
  tictactoe: { name: 'Tic Tac Toe', icon: '⭕', component: TicTacToe },
  memory: { name: 'Memory Match', icon: '🃏', component: MemoryMatch },
  snake: { name: 'Snake', icon: '🐍', component: SnakeGame },
  breakout: { name: 'Breakout', icon: '🧱', component: BreakoutGame },
  '2048': { name: '2048', icon: '🔢', component: Game2048 },
  tetris: { name: 'Tetris', icon: '🧩', component: TetrisGame },
  spaceinvaders: { name: 'Space Invaders', icon: '👾', component: SpaceInvaders },
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.game as string;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const gameConfig = GAMES_CONFIG[gameId];
  const GameComponent = gameConfig?.component;

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleBack = () => {
    router.push('/games');
  };

  const handleGameEnd = async (score: number, won: boolean, moves: number = 0, timeSeconds: number = 0, gameData: any = {}) => {
    if (!isAuthenticated) {
      setToast({ message: 'Demo mode: ¡Regístrate para guardar tus puntuaciones!', type: 'info' });
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_id: gameId,
          score,
          won,
          moves,
          time_seconds: timeSeconds,
          game_data: gameData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToast({ message: `¡+${data.points_earned} puntos ganados!`, type: 'success' });
      } else {
        setToast({ message: 'Error al guardar puntuación', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      setToast({ message: 'Error al conectar con el servidor', type: 'error' });
    }
  };

  if (!gameConfig || !GameComponent) {
    return (
      <div className="min-h-screen bg-[#080505] flex items-center justify-center pt-16">
        <div className="text-center space-y-6">
          <div className="text-6xl">🎮</div>
          <h2 className="text-2xl font-bold text-orange-400">Juego no encontrado</h2>
          <button
            onClick={handleBack}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Volver a Arcade
          </button>
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

      {/* Floating Pixels */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-orange-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-red-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[45%] left-[3%] w-2 h-2 bg-yellow-500 opacity-50 animate-twinkle"></div>
      </div>

      {/* Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[12vw] font-black opacity-[0.015] tracking-widest text-orange-500 select-none">
          {gameConfig.name.toUpperCase()}
        </div>
      </div>

      <main className="container mx-auto relative z-10 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-8 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleBack}
              className="bg-orange-900/30 border border-orange-500/50 text-orange-400 px-4 py-2 hover:bg-orange-900/50 transition-colors flex items-center gap-2"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              <span>←</span>
              <span className="hidden sm:inline">Volver</span>
            </button>

            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] uppercase">
              {gameConfig.icon} {gameConfig.name}
            </h1>

            {!isAuthenticated && (
              <div className="bg-gray-900/50 border border-gray-700 px-3 py-2 rounded-sm">
                <span className="text-gray-400 text-xs font-mono">Demo Mode</span>
              </div>
            )}
          </div>
        </header>

        {/* Game Container */}
        <div className="bg-black border-2 border-orange-900 p-1">
          <div className="bg-[#0a0a0a] p-4 md:p-8">
            <GameComponent
              isAuthenticated={isAuthenticated}
              onGameEnd={handleGameEnd}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-orange-900/10 border border-orange-900/30 p-4 rounded-sm max-w-2xl mx-auto">
            <h3 className="text-orange-400 text-sm font-bold mb-2">CÓMO JUGAR</h3>
            <p className="text-gray-400 text-xs">
              {isAuthenticated
                ? 'Juega y gana puntos por cada partida. ¡Consigue victorias y puntuaciones altas para desbloquear achievements!'
                : 'Modo demo: Puedes jugar gratis pero no ganarás puntos. ¡Regístrate para competir en el ranking!'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-2 mt-8">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-orange-600"></div>
            <div className="w-1 h-1 bg-orange-500"></div>
            <div className="w-1 h-1 bg-orange-400"></div>
          </div>
          <span className="text-gray-600 text-[10px] uppercase tracking-widest">PixelCV Arcade</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-orange-400"></div>
            <div className="w-1 h-1 bg-orange-500"></div>
            <div className="w-1 h-1 bg-orange-600"></div>
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
      `}</style>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
