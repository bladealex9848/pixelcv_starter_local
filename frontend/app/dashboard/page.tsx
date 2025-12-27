"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '../../components/PrivateRoute';
import Modal from '../../components/Modal';

function DashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);

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
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gamification/stats/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      const cvsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cvsRes.ok) {
        const data = await cvsRes.json();
        setCvs(data.cvs || []);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishCV = async (cvId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/${cvId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadDashboard();
      }
    } catch (error) {
      console.error('Error publicando CV:', error);
    }
  };

  const deleteCV = async (cvId: string) => {
    if (!confirm('¿Estas seguro de eliminar este CV?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/${cvId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadDashboard();
      }
    } catch (error) {
      console.error('Error eliminando CV:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020812] flex items-center justify-center relative overflow-hidden crt-effect">
        {/* Scanlines */}
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
          backgroundSize: '100% 2px'
        }}></div>
        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none grid-background opacity-[0.02]"></div>
        {/* Floating Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-cyan-500 opacity-60 animate-twinkle"></div>
          <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-blue-400 opacity-40 animate-twinkle-delayed"></div>
          <div className="absolute top-[60%] left-[5%] w-1 h-1 bg-teal-400 opacity-50 animate-twinkle"></div>
          <div className="absolute top-[80%] right-[8%] w-2 h-2 bg-cyan-400 opacity-40 animate-twinkle-delayed"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="text-6xl animate-bounce mb-4">📊</div>
          <p className="text-cyan-400 font-mono animate-pulse">Loading Player Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020812] text-white font-mono pt-16 pb-12 px-4 relative overflow-hidden scanline-effect">

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none grid-background opacity-[0.02]"></div>

      {/* Floating Pixel Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-cyan-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-blue-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[60%] left-[5%] w-1 h-1 bg-teal-400 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[80%] right-[8%] w-2 h-2 bg-cyan-400 opacity-40 animate-twinkle-delayed"></div>

        {/* Floating Icons */}
        <div className="absolute top-[20%] left-[5%] text-3xl opacity-15 animate-float-slow">📊</div>
        <div className="absolute top-[50%] right-[5%] text-2xl opacity-10 animate-float-medium">🎯</div>
        <div className="absolute top-[75%] left-[8%] text-2xl opacity-15 animate-float-delayed">⚡</div>
      </div>

      {/* Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[12vw] font-black opacity-[0.015] tracking-widest text-cyan-500 select-none">
          PLAYER HUB
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="relative inline-block">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] uppercase">
              Player Dashboard
            </h1>
            <div className="absolute -top-2 -left-3 w-2 h-2 bg-cyan-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-1 -right-2 w-1 h-1 bg-blue-400 animate-twinkle-delayed hidden md:block"></div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
            <div className="flex items-center gap-2 bg-cyan-900/30 border border-cyan-500/50 px-3 py-1 rounded-sm">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              <span className="text-cyan-300 text-xs font-bold uppercase">{user?.username || 'Player'}</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/50 px-3 py-1 rounded-sm">
              <span>🎮</span>
              <span className="text-blue-300 text-xs font-bold uppercase">Level {stats?.level || 1}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* CVs Created */}
          <div
            className="bg-black border-2 border-cyan-900 p-1 transition-all duration-300 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
          >
            <div className="bg-[#0a0a0a] p-5 text-center">
              <div className="text-3xl mb-2">📄</div>
              <h3 className="text-3xl font-black text-cyan-400">{stats?.total_cvs || 0}</h3>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">CVs Creados</p>
            </div>
          </div>

          {/* Points */}
          <div
            className="bg-black border-2 border-blue-900 p-1 transition-all duration-300 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] relative"
            style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
          >
            {/* Info button */}
            <button
              onClick={() => setShowPointsModal(true)}
              className="absolute top-2 right-2 w-6 h-6 bg-blue-900/50 hover:bg-blue-700 border border-blue-500/50 rounded flex items-center justify-center text-blue-300 text-xs font-bold transition-all hover:scale-110"
              title="¿Cómo ganar puntos?"
            >
              ?
            </button>

            <div className="bg-[#0a0a0a] p-5 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="text-3xl font-black text-blue-400">{stats?.total_points || 0}</h3>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Puntos XP</p>
            </div>
          </div>

          {/* Rank */}
          <div
            className="bg-black border-2 border-teal-900 p-1 transition-all duration-300 hover:border-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]"
            style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
          >
            <div className="bg-[#0a0a0a] p-5 text-center">
              <div className="text-3xl mb-2">🏅</div>
              <h3 className="text-xl font-black text-teal-400">{stats?.rank_title || 'Novato'}</h3>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Rango</p>
            </div>
          </div>
        </div>

        {/* Create CV Card */}
        <div
          className="bg-black border-2 border-cyan-500/50 p-1 mb-8"
          style={{ clipPath: 'polygon(0 12px, 12px 12px, 12px 0, calc(100% - 12px) 0, calc(100% - 12px) 12px, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 12px calc(100% - 12px), 0 calc(100% - 12px))' }}
        >
          <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-8 text-center">
            <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-wider mb-3">New Quest Available</h2>
            <p className="text-gray-400 mb-6 text-sm">Usa nuestro asistente IA para crear un CV profesional</p>
            <button
              onClick={() => router.push('/editor')}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-3 font-black uppercase tracking-wider hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              <span>🚀</span>
              Start Mission
            </button>
          </div>
        </div>

        {/* CVs List */}
        <div
          className="bg-black border-2 border-cyan-900 p-1"
          style={{ clipPath: 'polygon(0 12px, 12px 12px, 12px 0, calc(100% - 12px) 0, calc(100% - 12px) 12px, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 12px calc(100% - 12px), 0 calc(100% - 12px))' }}
        >
          <div className="bg-[#0a0a0a] p-6 md:p-8">
            <h2 className="text-xl font-black text-cyan-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span>📁</span> Inventory (Tus CVs)
            </h2>

            {cvs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-50">📄</div>
                <p className="text-gray-500 uppercase tracking-wider">Inventory Empty</p>
                <p className="text-gray-600 text-sm mt-2">Crea tu primer CV para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cvs.map((cv) => (
                  <div
                    key={cv.id}
                    className="bg-black/50 border border-cyan-900/50 p-4 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-cyan-300 font-bold">{cv.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${
                            cv.is_published
                              ? 'bg-green-900/50 text-green-400 border border-green-500/50'
                              : 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50'
                          }`}>
                            {cv.is_published ? '✓ Published' : '○ Draft'}
                          </span>
                          <span className="text-gray-500 text-xs">
                            👁 {cv.total_visits || 0} | ❤ {cv.total_likes || 0}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {new Date(cv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => router.push(`/editor/${cv.id}`)}
                          className="bg-blue-900/50 border border-blue-500/50 text-blue-300 px-3 py-1.5 text-xs font-bold uppercase hover:bg-blue-900/70 transition"
                        >
                          Edit
                        </button>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/cv/${cv.id}/pdf`}
                          target="_blank"
                          className="bg-teal-900/50 border border-teal-500/50 text-teal-300 px-3 py-1.5 text-xs font-bold uppercase hover:bg-teal-900/70 transition"
                        >
                          PDF
                        </a>
                        <button
                          onClick={() => publishCV(cv.id)}
                          className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                            cv.is_published
                              ? 'bg-yellow-900/50 border border-yellow-500/50 text-yellow-300 hover:bg-yellow-900/70'
                              : 'bg-green-900/50 border border-green-500/50 text-green-300 hover:bg-green-900/70'
                          }`}
                        >
                          {cv.is_published ? 'Hide' : 'Publish'}
                        </button>
                        {cv.is_published && (
                          <a
                            href={`/cv/${cv.slug}`}
                            target="_blank"
                            className="bg-blue-900/50 border border-blue-500/50 text-blue-300 px-3 py-1.5 text-xs font-bold uppercase hover:bg-blue-900/70 transition"
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => deleteCV(cv.id)}
                          className="bg-red-900/50 border border-red-500/50 text-red-300 px-3 py-1.5 text-xs font-bold uppercase hover:bg-red-900/70 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer decoration */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-cyan-600"></div>
            <div className="w-1 h-1 bg-cyan-500"></div>
            <div className="w-1 h-1 bg-cyan-400"></div>
          </div>
          <span className="text-gray-600 text-[10px] uppercase tracking-widest">Player Hub</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-cyan-400"></div>
            <div className="w-1 h-1 bg-cyan-500"></div>
            <div className="w-1 h-1 bg-cyan-600"></div>
          </div>
        </div>
      </div>

      {/* Points Explanation Modal */}
      <Modal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        title="¿Cómo ganar puntos?"
      >
        <div className="space-y-6 text-gray-300">
          {/* Points per action */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wider">🎯 Acciones que dan puntos</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between bg-black/50 border border-cyan-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <span>Crear un CV</span>
                </div>
                <span className="text-cyan-400 font-bold text-lg">+10</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-cyan-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <span>Publicar CV</span>
                </div>
                <span className="text-cyan-400 font-bold text-lg">+50</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-cyan-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👁️</span>
                  <span>Visita recibida</span>
                </div>
                <span className="text-cyan-400 font-bold text-lg">+5</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-cyan-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❤️</span>
                  <span>Like dado</span>
                </div>
                <span className="text-cyan-400 font-bold text-lg">+2</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-cyan-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💝</span>
                  <span>Like recibido</span>
                </div>
                <span className="text-cyan-400 font-bold text-lg">+20</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-cyan-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <span>Comentar</span>
                </div>
                <span className="text-cyan-400 font-bold text-lg">+15</span>
              </div>
            </div>
          </div>

          {/* Levels */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-teal-400 uppercase tracking-wider">🏅 Niveles</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between bg-black/50 border border-teal-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span>🌱</span>
                  <span>Novato</span>
                </div>
                <span className="text-gray-500">0-99 pts</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-teal-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span>📚</span>
                  <span>Aprendiz</span>
                </div>
                <span className="text-teal-400">100-499 pts</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-teal-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span>🎓</span>
                  <span>Maestro</span>
                </div>
                <span className="text-teal-300">500-1499 pts</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-teal-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span>💎</span>
                  <span>Experto</span>
                </div>
                <span className="text-teal-200">1500-4999 pts</span>
              </div>
              <div className="flex items-center justify-between bg-black/50 border border-teal-900 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <span>👑</span>
                  <span>Leyenda</span>
                </div>
                <span className="text-yellow-400 font-bold">5000+ pts</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-700 p-4 rounded-sm">
            <h4 className="font-bold text-cyan-300 mb-2">💡 Tips para subir de nivel rápido</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">▸</span>
                <span>Publica tus CVs para ganar +50 puntos extra</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">▸</span>
                <span>Comparte en redes sociales para obtener visitas y likes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">▸</span>
                <span>Interactúa con la comunidad: comenta y da likes</span>
              </li>
            </ul>
          </div>
        </div>
      </Modal>
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
