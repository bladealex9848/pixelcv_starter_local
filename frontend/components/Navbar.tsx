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
    <nav className="bg-black/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <span className="text-3xl">📄</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              PixelCV
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <button onClick={() => router.push('/dashboard')} className="text-purple-200 hover:text-white">📊 Dashboard</button>
                <button onClick={() => router.push('/editor')} className="text-purple-200 hover:text-white">✏️ Crear CV</button>
                <button onClick={() => router.push('/community')} className="text-purple-200 hover:text-white">👥 Comunidad</button>
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
                <button onClick={() => router.push('/community')} className="text-purple-200 hover:text-white">👥 Comunidad</button>
                <button onClick={() => router.push('/leaderboard')} className="text-purple-200 hover:text-white">🏆 Ranking</button>
                <div className="flex items-center space-x-3">
                  <button onClick={() => router.push('/login')} className="px-4 py-2 text-purple-200 hover:text-white">Iniciar Sesión</button>
                  <button onClick={() => router.push('/register')} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90">Registrarse</button>
                </div>
              </>
            )}
          </div>

          <button className="md:hidden text-purple-200" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="text-2xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-purple-500/20 space-y-3">
            {isAuthenticated ? (
              <>
                <button onClick={() => {router.push('/dashboard'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2">📊 Dashboard</button>
                <button onClick={() => {router.push('/editor'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2">✏️ Crear CV</button>
                <button onClick={() => {router.push('/community'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2">👥 Comunidad</button>
                <button onClick={handleLogout} className="block w-full text-left text-red-400 py-2 border-t border-purple-500/20 pt-3 mt-3">Cerrar Sesión</button>
              </>
            ) : (
              <>
                <button onClick={() => {router.push('/community'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2">👥 Comunidad</button>
                <button onClick={() => {router.push('/leaderboard'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2">🏆 Ranking</button>
                <div className="border-t border-purple-500/20 pt-3 mt-3 space-y-3">
                  <button onClick={() => {router.push('/login'); setMenuOpen(false);}} className="block w-full text-left text-purple-200 py-2">Iniciar Sesión</button>
                  <button onClick={() => {router.push('/register'); setMenuOpen(false);}} className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg">Registrarse</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
