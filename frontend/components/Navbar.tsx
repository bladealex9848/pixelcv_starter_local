"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  };

  const navStyle = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? 'text-yellow-400 font-bold border-b-2 border-yellow-400'
      : 'text-gray-300 hover:text-white hover:border-b-2 hover:border-gray-500';
  };

  return (
    <nav className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-900/50 sticky top-0 z-50 font-mono">
      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(234,179,8,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => router.push('/')}
          >
            <span className="text-3xl group-hover:animate-bounce transition-transform">📄</span>
            <span className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] uppercase">
              PixelCV
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push('/models')} className={`${navStyle('/models')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
              <span className="text-lg">👾</span> <span className="text-sm uppercase tracking-wider">Modelos</span>
            </button>
            <button onClick={() => router.push('/games')} className={`${navStyle('/games')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
              <span className="text-lg">🕹️</span> <span className="text-sm uppercase tracking-wider">Juegos</span>
            </button>

            {isAuthenticated ? (
              <>
                <button onClick={() => router.push('/dashboard')} className={`${navStyle('/dashboard')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
                  <span className="text-lg">📊</span> <span className="text-sm uppercase tracking-wider">Dashboard</span>
                </button>
                <button onClick={() => router.push('/editor')} className={`${navStyle('/editor')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
                  <span className="text-lg">✏️</span> <span className="text-sm uppercase tracking-wider">Crear CV</span>
                </button>
                <button onClick={() => router.push('/community')} className={`${navStyle('/community')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
                  <span className="text-lg">👥</span> <span className="text-sm uppercase tracking-wider">Comunidad</span>
                </button>
                <button onClick={() => router.push('/leaderboard')} className={`${navStyle('/leaderboard')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
                  <span className="text-lg">🏆</span> <span className="text-sm uppercase tracking-wider">Ranking</span>
                </button>

                {/* User Section */}
                <div className="flex items-center gap-3 border-l-2 border-yellow-900/50 pl-4 ml-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} alt="Avatar" className="w-8 h-8 rounded-sm border-2 border-yellow-500/50" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
                    </div>
                    <span className="text-yellow-300 text-xs font-bold uppercase hidden lg:block">{user?.username || 'Usuario'}</span>
                  </div>
                  <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider px-2 py-1 border border-red-500/30 rounded-sm hover:bg-red-900/20 transition-all">
                    ✕ Salir
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/community')} className={`${navStyle('/community')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
                  <span className="text-lg">👥</span> <span className="text-sm uppercase tracking-wider">Comunidad</span>
                </button>
                <button onClick={() => router.push('/leaderboard')} className={`${navStyle('/leaderboard')} flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:scale-105 border-b-2`}>
                  <span className="text-lg">🏆</span> <span className="text-sm uppercase tracking-wider">Ranking</span>
                </button>
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => router.push('/login')} className="text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider px-4 py-2 border border-gray-600 rounded-sm hover:bg-gray-800/50 transition-all">
                    Login
                  </button>
                  <button onClick={() => router.push('/register')} className="bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-black uppercase tracking-wider px-4 py-2 border-2 border-yellow-400 rounded-sm transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                    Registro
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-yellow-400 transition-all duration-200 transform hover:scale-110 hover:rotate-90"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="text-2xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t-2 border-yellow-900/50 space-y-2 bg-black/90 backdrop-blur-sm">
            <button onClick={() => {router.push('/models'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
              <span className="text-lg">👾</span> <span className="text-sm uppercase tracking-wider">Modelos</span>
            </button>
            <button onClick={() => {router.push('/games'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
              <span className="text-lg">🕹️</span> <span className="text-sm uppercase tracking-wider">Juegos</span>
            </button>

            {isAuthenticated ? (
              <>
                <button onClick={() => {router.push('/dashboard'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
                  <span className="text-lg">📊</span> <span className="text-sm uppercase tracking-wider">Dashboard</span>
                </button>
                <button onClick={() => {router.push('/editor'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
                  <span className="text-lg">✏️</span> <span className="text-sm uppercase tracking-wider">Crear CV</span>
                </button>
                <button onClick={() => {router.push('/community'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
                  <span className="text-lg">👥</span> <span className="text-sm uppercase tracking-wider">Comunidad</span>
                </button>
                <button onClick={() => {router.push('/leaderboard'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
                  <span className="text-lg">🏆</span> <span className="text-sm uppercase tracking-wider">Ranking</span>
                </button>

                <div className="border-t-2 border-yellow-900/50 pt-3 mt-3 flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} alt="Avatar" className="w-8 h-8 rounded-sm border-2 border-yellow-500/50" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
                    </div>
                    <span className="text-yellow-300 text-xs font-bold uppercase">{user?.username || 'Usuario'}</span>
                  </div>
                  <button onClick={handleLogout} className="text-red-400 text-xs font-bold uppercase tracking-wider">✕ Salir</button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => {router.push('/community'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
                  <span className="text-lg">👥</span> <span className="text-sm uppercase tracking-wider">Comunidad</span>
                </button>
                <button onClick={() => {router.push('/leaderboard'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 flex items-center gap-3 transition-all duration-200 hover:bg-yellow-900/20 hover:pl-6 border-l-2 border-transparent hover:border-yellow-500">
                  <span className="text-lg">🏆</span> <span className="text-sm uppercase tracking-wider">Ranking</span>
                </button>

                <div className="border-t-2 border-yellow-900/50 pt-3 mt-3 space-y-2">
                  <button onClick={() => {router.push('/login'); setMenuOpen(false);}} className="block w-full text-left text-gray-300 py-2 px-3 text-sm font-bold uppercase tracking-wider">
                    Login
                  </button>
                  <button onClick={() => {router.push('/register'); setMenuOpen(false);}} className="block w-full bg-yellow-600 text-black py-2 px-3 text-xs font-black uppercase tracking-wider border-2 border-yellow-400 rounded-sm hover:bg-yellow-500 transition-all">
                    Registro
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
