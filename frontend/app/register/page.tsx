"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          full_name: fullName || username
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al registrarse');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex items-center justify-center px-4 pt-16 relative overflow-hidden">

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Floating Pixel Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-2 h-2 bg-cyan-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] right-[12%] w-1 h-1 bg-teal-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[55%] left-[5%] w-1 h-1 bg-cyan-400 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[70%] right-[8%] w-2 h-2 bg-sky-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[85%] left-[20%] w-1 h-1 bg-cyan-300 opacity-30 animate-twinkle"></div>

        {/* Floating Icons */}
        <div className="absolute top-[15%] left-[8%] text-3xl opacity-15 animate-float-slow">🎮</div>
        <div className="absolute top-[45%] right-[5%] text-2xl opacity-10 animate-float-medium">🕹️</div>
        <div className="absolute top-[70%] left-[10%] text-2xl opacity-15 animate-float-delayed">👾</div>
        <div className="absolute top-[30%] right-[15%] text-xl opacity-10 animate-float-slow">⭐</div>
      </div>

      {/* Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[15vw] font-black opacity-[0.015] tracking-widest text-cyan-500 select-none">
          NEW PLAYER
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-teal-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] uppercase">
              REGISTER
            </h1>
            <div className="absolute -top-2 -left-3 w-2 h-2 bg-cyan-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-1 -right-2 w-1 h-1 bg-teal-400 animate-twinkle-delayed hidden md:block"></div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 bg-cyan-900/30 border border-cyan-500/50 px-3 py-1 rounded-sm">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              <span className="text-cyan-300 text-xs font-bold uppercase">New Player</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm">Crea tu cuenta y comienza tu aventura</p>
        </div>

        {/* Form Card */}
        <div
          className="bg-black border-2 border-cyan-900 p-1"
          style={{ clipPath: 'polygon(0 10px, 10px 10px, 10px 0, calc(100% - 10px) 0, calc(100% - 10px) 10px, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 10px calc(100% - 10px), 0 calc(100% - 10px))' }}
        >
          <div className="bg-[#0a0a0a] p-6 md:p-8">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 mb-6 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-cyan-400 text-xs uppercase tracking-wider mb-2 font-bold">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="player_one"
                  className="w-full p-3 bg-black border-2 border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-400 text-xs uppercase tracking-wider mb-2 font-bold">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full p-3 bg-black border-2 border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-cyan-400 text-xs uppercase tracking-wider mb-2 font-bold">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@pixelcv.com"
                  className="w-full p-3 bg-black border-2 border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-400 text-xs uppercase tracking-wider mb-2 font-bold">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 bg-black border-2 border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  required
                />
                <p className="text-gray-600 text-[10px] mt-1 uppercase tracking-wider">
                  Min 6 characters recommended
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-3 font-black uppercase tracking-wider hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>🎮</span>
                    Join Game
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-[1px] bg-gray-800"></div>
              <span className="text-gray-600 text-xs">OR</span>
              <div className="flex-1 h-[1px] bg-gray-800"></div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">Already a player?</p>
              <button
                onClick={() => router.push('/login')}
                className="text-cyan-400 hover:text-cyan-300 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                Login →
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-cyan-400 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <span>←</span> Back to Home
          </button>
        </div>

        {/* Footer decoration */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-cyan-600"></div>
            <div className="w-1 h-1 bg-cyan-500"></div>
            <div className="w-1 h-1 bg-cyan-400"></div>
          </div>
          <span className="text-gray-600 text-[10px] uppercase tracking-widest">New Adventure</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-cyan-400"></div>
            <div className="w-1 h-1 bg-cyan-500"></div>
            <div className="w-1 h-1 bg-cyan-600"></div>
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
