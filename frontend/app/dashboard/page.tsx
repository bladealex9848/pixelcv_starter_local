"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gamification/stats/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-2xl">Cargando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/30 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PixelCV
          </a>
          <div className="flex gap-4">
            <a href="/community" className="text-purple-300">Comunidad</a>
            <a href="/leaderboard" className="text-purple-300">Ranking</a>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">Nivel</div>
            <div className="text-4xl font-bold text-white">{stats?.level || 1}</div>
            <div className="text-purple-300">{stats?.rank_title || 'Novato'}</div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">Puntos totales</div>
            <div className="text-4xl font-bold text-white">{stats?.total_points?.toLocaleString() || 0}</div>
            <div className="text-purple-300">XP ganada</div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">CVs creados</div>
            <div className="text-4xl font-bold text-white">{stats?.cvs_created || 0}</div>
            <div className="text-purple-300">{stats?.cvs_published || 0} publicados</div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">Interacciones</div>
            <div className="text-4xl font-bold text-white">{stats?.total_visits_received || 0}</div>
            <div className="text-purple-300">visitas recibidas</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Progreso al siguiente nivel</h2>
            <div className="relative pt-1">
              <div className="overflow-hidden h-6 mb-4 text-xs flex rounded bg-purple-900/50">
                <div
                  style={{ width: `${stats?.progress_to_next_level || 0}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                ></div>
              </div>
              <div className="text-purple-300 text-sm">
                {stats?.progress_to_next_level?.toFixed(1) || 0}% completado
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Badges</h2>
            {stats?.badges && stats.badges.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {stats.badges.map((badge: any) => (
                  <div key={badge.key} className="bg-purple-900/50 rounded-lg px-4 py-3 flex items-center gap-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <div className="text-white font-semibold">{badge.name}</div>
                      <div className="text-purple-300 text-sm">{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-purple-300">
                Aún no tienes badges. ¡Continúa participando para desbloquearlos!
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a href="/editor" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition inline-flex items-center gap-2">
            ✏️ Crear nuevo CV
          </a>
        </div>
      </main>
    </div>
  );
}
