"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '../../components/PrivateRoute';

function DashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadDashboard();
    }
  }, []);

  const loadDashboard = async () => {
    const token = localStorage.getItem('token');
    try {
      // Cargar estadísticas
      const statsRes = await fetch('http://localhost:8000/gamification/stats/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Aquí podrías cargar los CVs del usuario
      // Por ahora, usamos un array vacío
      setCvs([]);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👋 Bienvenido, {user?.username || 'Usuario'}!</h1>
          <p className="text-purple-300">Gestiona tus CVs y tu perfil profesional</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-4xl mb-2">📄</div>
            <h3 className="text-2xl font-bold text-white">{stats?.total_cvs || 0}</h3>
            <p className="text-purple-300">CVs creados</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-4xl mb-2">⭐</div>
            <h3 className="text-2xl font-bold text-white">{stats?.total_points || 0}</h3>
            <p className="text-purple-300">Puntos</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-4xl mb-2">🏅</div>
            <h3 className="text-2xl font-bold text-white">{stats?.rank_title || 'Novato'}</h3>
            <p className="text-purple-300">Nivel</p>
          </div>
        </div>

        {/* Create CV Card */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">✨ Crea tu primer CV</h2>
            <p className="text-purple-200 mb-6">Usa nuestro asistente inteligente para crear un CV profesional en minutos</p>
            <button
              onClick={() => router.push('/editor')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition"
            >
              🚀 Crear CV con Asistente
            </button>
          </div>
        </div>

        {/* Recent CVs */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Tus CVs</h2>
          {cvs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-purple-300 text-lg">Aún no has creado ningún CV</p>
              <p className="text-purple-400 mt-2">Comienza creando tu primer CV con nuestro asistente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cvs.map((cv) => (
                <div key={cv.id} className="p-4 bg-black/20 rounded-lg border border-purple-500/20">
                  <h3 className="text-white font-semibold">{cv.title}</h3>
                  <p className="text-purple-300 text-sm mt-1">Creado: {new Date(cv.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <PrivateRoute>
      <DashboardContent />
    </PrivateRoute>
  );
}
