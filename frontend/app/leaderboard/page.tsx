"use client";
import { useEffect, useState } from 'react';

interface User {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  level: number;
  rank_title: string;
  total_points: number;
  cvs_published: number;
  badges: string[];
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gamification/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setUsers(data.leaderboard || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getBadgeIcon = (badgeKey: string) => {
    const badges: Record<string, string> = {
      early_adopter: '🚀',
      top_creator: '🏆',
      social_butterfly: '💬',
      popular: '⭐',
      viral: '🔥',
      legend: '👑',
      helper: '🤝',
    };
    return badges[badgeKey] || '🏅';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-purple-300';
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-2xl">Cargando ranking...</div>
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🏆 Ranking de Usuarios</h1>
          <p className="text-purple-300">Los creadores más destacados de la comunidad</p>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-900/50 text-left">
                <th className="p-4 text-purple-300">Rank</th>
                <th className="p-4 text-purple-300">Usuario</th>
                <th className="p-4 text-purple-300">Nivel</th>
                <th className="p-4 text-purple-300">Puntos</th>
                <th className="p-4 text-purple-300">CVs</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.user_id} className="border-t border-purple-500/20 hover:bg-purple-900/20 transition">
                  <td className={`p-4 font-bold ${getRankColor(index + 1)}`}>
                    #{index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full border border-purple-400" />
                      <div>
                        <div className="text-white font-semibold">{user.full_name || user.username}</div>
                        <div className="text-purple-300 text-sm">@{user.username}</div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {user.badges.slice(0, 3).map((badge) => (
                          <span key={badge} title={badge} className="text-lg">
                            {getBadgeIcon(badge)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                      Nivel {user.level} - {user.rank_title}
                    </span>
                  </td>
                  <td className="p-4 text-white font-semibold">{user.total_points.toLocaleString()} pts</td>
                  <td className="p-4 text-purple-300">{user.cvs_published}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center text-purple-300 mt-12">
            No hay usuarios en el ranking aún. ¡Comienza a crear CVs para subir de nivel!
          </div>
        )}
      </main>
    </div>
  );
}
