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
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-2xl">Cargando comunidad...</div>
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Explora CVs de la Comunidad</h1>
          <p className="text-purple-300">Descubre CVs increíbles creados por otros profesionales</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setSortBy('created')} className={`px-6 py-2 rounded-lg transition ${sortBy === 'created' ? 'bg-purple-600 text-white' : 'bg-black/30 text-purple-300 hover:bg-purple-600/30'}`}>
            Recientes
          </button>
          <button onClick={() => setSortBy('popular')} className={`px-6 py-2 rounded-lg transition ${sortBy === 'popular' ? 'bg-purple-600 text-white' : 'bg-black/30 text-purple-300 hover:bg-purple-600/30'}`}>
            Populares
          </button>
          <button onClick={() => setSortBy('visited')} className={`px-6 py-2 rounded-lg transition ${sortBy === 'visited' ? 'bg-purple-600 text-white' : 'bg-black/30 text-purple-300 hover:bg-purple-600/30'}`}>
            Más visitados
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map((cv) => (
            <a key={cv.id} href={`/cv/${cv.slug}`} className="block group">
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400 transition transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <img src={cv.author.avatar_url} alt={cv.author.username} className="w-10 h-10 rounded-full border border-purple-400" />
                  <span className="text-purple-300">@{cv.author.username}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-400 transition">
                  {cv.name}
                </h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-purple-300">❤️ {cv.total_likes}</span>
                  <span className="text-purple-300">👁️ {cv.total_visits}</span>
                  <span className="text-purple-300">💬 {cv.total_comments}</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {cvs.length === 0 && (
          <div className="text-center text-purple-300 mt-12">
            No hay CVs públicos aún. ¡Sé el primero en publicar el tuyo!
          </div>
        )}
      </main>
    </div>
  );
}
