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

  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-50 scanline-effect">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>
      
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none grid-background-purple opacity-[0.02]"></div>
      
      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[5%] w-1 h-1 bg-purple-500 opacity-40 animate-twinkle"></div>
        <div className="absolute top-[60%] right-[10%] w-1 h-1 bg-pink-400 opacity-30 animate-twinkle-delayed"></div>
        <div className="absolute top-[40%] left-[10%] text-xl opacity-10 animate-float-slow">📄</div>
      </div>
      
      {/* Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[10vw] font-black opacity-[0.01] tracking-widest text-purple-500 select-none">
          NAVBAR
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => router.push('/')}
          >
            <span className="text-3xl group-hover:animate-bounce">📄</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300 group-hover:scale-105">
              PixelCV
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => router.push('/models')} className="text-purple-200 hover:text-white flex items-center gap-1 transition-all duration-200 hover:scale-105">
              <span className="text-lg">👾</span> Modelos
            </button>
            {isAuthenticated ? (
              <>
                <button onClick={() => router.push('/dashboard')} className="text-purple-200 hover:text-white transition-all duration-200 hover:scale-105">
                  <span className="text-lg">📊</span> Dashboard
                </button>
                <button onClick={() => router.push('/editor')} className="text-purple-200 hover:text-white transition-all duration-200 hover:scale-105">
                  <span className="text-lg">✏️</span> Crear CV
                </button>
                <button onClick={() => router.push('/community')} className="text-purple-200 hover:text-white transition-all duration-200 hover:scale-105">
                  <span className="text-lg">👥</span> Comunidad
                </button>
                <button onClick={() => router.push('/leaderboard')} className="text-purple-200 hover:text-white transition-all duration-200 hover:scale-105">
                  <span className="text-lg">🏆</span> Ranking
                </button>
                <div className="flex items-center space-x-3 border-l border-purple-500/30 pl-6">
                  <div className="flex items-center space-x-2">
                    <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} alt="Avatar" className="w-8 h-8 rounded-full" />
                    <span className="text-purple-200 text-sm hidden lg:block">{user?.username || 'Usuario'}</span>
                  </div>
                  <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm">Cerrar Sesión</button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/community')} className="text-purple-200 hover:text-white transition-all duration-200 hover:scale-105">
                  <span className="text-lg">👥</span> Comunidad
                </button>
                <button onClick={() => router.push('/leaderboard')} className="text-purple-200 hover:text-white transition-all duration-200 hover:scale-105">
                  <span className="text-lg">🏆</span> Ranking
                </button>
                <div className="flex items-center space-x-3">
                  <button onClick={() => router.push('/login')} className="px-4 py-2 text-purple-200 hover:text-white">Iniciar Sesión</button>
                  <button onClick={() => router.push('/register')} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/20">
                  Registrarse
                </button>
                </div>
              </>
            )}
          </div>

          <button className="md:hidden text-purple-200 transition-all duration-200 transform hover:scale-110" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="text-3xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-purple-500/20 space-y-3 bg-black/30 backdrop-blur-sm">
            <button onClick={() => {router.push('/models'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-purple-600/20 hover:pl-4">
              <span className="text-lg">👾</span> Modelos
            </button>
            {isAuthenticated ? (
              <>
                <button onClick={() => {router.push('/dashboard'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-purple-600/20 hover:pl-4">
                  <span className="text-lg">📊</span> Dashboard
                </button>
                <button onClick={() => {router.push('/editor'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-purple-600/20 hover:pl-4">
                  <span className="text-lg">✏️</span> Crear CV
                </button>
                <button onClick={() => {router.push('/community'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-purple-600/20 hover:pl-4">
                  <span className="text-lg">👥</span> Comunidad
                </button>
                <button onClick={() => {router.push('/leaderboard'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-purple-600/20 hover:pl-4">
                  <span className="text-lg">🏆</span> Ranking
                </button>
                <button onClick={handleLogout} className="block w-full text-left text-red-400 py-2 border-t border-purple-500/20 pt-3 mt-3">Cerrar Sesión</button>
              </>
            ) : (
              <>
                <button onClick={() => {router.push('/community'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-purple-600/20 hover:pl-4">
                  <span className="text-lg">👥</span> Comunidad
                </button>
                <button onClick={() => {router.push('/leaderboard'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-purple-600/20 hover:pl-4">
                  <span className="text-lg">🏆</span> Ranking
                </button>
                <div className="border-t border-purple-500/20 pt-3 mt-3 space-y-3">
                  <button onClick={() => {router.push('/login'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2">Iniciar Sesión</button>
                  <button onClick={() => {router.push('/register'); setMenuOpen(false);}} className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/20">
                    Registrarse
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
