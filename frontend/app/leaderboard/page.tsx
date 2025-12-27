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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]' };
    if (rank === 2) return { color: 'text-gray-300', bg: 'bg-gray-500/20', border: 'border-gray-400', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.2)]' };
    if (rank === 3) return { color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' };
    return { color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-900', glow: '' };
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center pt-16">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">🏆</div>
          <div className="text-yellow-400 text-xl font-mono animate-pulse">LOADING_RANKINGS...</div>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 animate-ping"></div>
            <div className="w-2 h-2 bg-yellow-400 animate-ping" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-yellow-300 animate-ping" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden pt-16 relative">

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

      {/* Floating Pixel Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-yellow-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[20%] left-[90%] w-1 h-1 bg-amber-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[40%] left-[3%] w-2 h-2 bg-orange-500 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[60%] left-[95%] w-1 h-1 bg-yellow-400 opacity-60 animate-twinkle-delayed"></div>
        <div className="absolute top-[80%] left-[8%] w-1 h-1 bg-amber-300 opacity-50 animate-twinkle"></div>

        {/* Floating retro icons */}
        <div className="absolute top-[12%] left-[8%] text-3xl opacity-20 animate-float-slow">🏆</div>
        <div className="absolute top-[28%] right-[6%] text-2xl opacity-15 animate-float-medium">⭐</div>
        <div className="absolute top-[50%] left-[5%] text-2xl opacity-20 animate-float-delayed">🎮</div>
        <div className="absolute top-[72%] right-[4%] text-3xl opacity-15 animate-float-slow">👑</div>
        <div className="absolute top-[90%] left-[10%] text-2xl opacity-20 animate-float-medium">🔥</div>
      </div>

      {/* Large Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[15vw] font-black opacity-[0.02] tracking-widest text-yellow-500 select-none animate-pulse-slow">
          RANKING
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="fixed top-20 left-4 pointer-events-none opacity-30 hidden md:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-yellow-500"></div>
            <div className="w-2 h-2 bg-yellow-400"></div>
            <div className="w-2 h-2 bg-yellow-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-yellow-400"></div>
          </div>
        </div>
      </div>
      <div className="fixed top-20 right-4 pointer-events-none opacity-30 rotate-90 hidden md:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-amber-500"></div>
            <div className="w-2 h-2 bg-amber-400"></div>
            <div className="w-2 h-2 bg-amber-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-amber-400"></div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-amber-600 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] uppercase glitch-text" data-text="LEADERBOARD">
              LEADERBOARD
            </h1>
            <div className="absolute -top-2 -left-4 w-2 h-2 bg-yellow-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-1 -right-3 w-1 h-1 bg-amber-400 animate-twinkle-delayed hidden md:block"></div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-500/50 px-4 py-1 rounded-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Live Rankings</span>
            </div>
            <div className="bg-gray-900/50 border border-gray-700 px-3 py-1 rounded-sm">
              <span className="text-gray-400 text-xs font-mono">{users.length} Players</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="hidden md:flex gap-1">
              <div className="w-1 h-1 bg-yellow-500"></div>
              <div className="w-1 h-1 bg-yellow-400"></div>
              <div className="w-1 h-1 bg-yellow-300"></div>
              <div className="w-2 h-1 bg-yellow-200"></div>
            </div>
            <p className="text-gray-400 text-sm max-w-xl">
              Los creadores más destacados de la comunidad PixelCV
            </p>
            <div className="hidden md:flex gap-1">
              <div className="w-2 h-1 bg-yellow-200"></div>
              <div className="w-1 h-1 bg-yellow-300"></div>
              <div className="w-1 h-1 bg-yellow-400"></div>
              <div className="w-1 h-1 bg-yellow-500"></div>
            </div>
          </div>
        </header>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="flex justify-center items-end gap-4 mb-12">
            {/* 2nd Place */}
            <div className="text-center group">
              <div className="relative">
                <img
                  src={users[1]?.avatar_url}
                  alt={users[1]?.username}
                  className="w-16 h-16 rounded-sm border-2 border-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform"
                />
                <div className="absolute -top-2 -right-2 text-2xl">🥈</div>
              </div>
              <div className="bg-gray-500/20 border border-gray-500/50 px-4 py-3 h-20 flex flex-col justify-end">
                <div className="text-gray-300 font-bold text-sm truncate max-w-[100px]">@{users[1]?.username}</div>
                <div className="text-gray-400 text-xs">{users[1]?.total_points.toLocaleString()} pts</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center group -mt-8">
              <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
                <img
                  src={users[0]?.avatar_url}
                  alt={users[0]?.username}
                  className="w-20 h-20 rounded-sm border-2 border-yellow-500 mx-auto mb-2 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                />
                <div className="absolute -top-2 -right-2 text-3xl">🥇</div>
              </div>
              <div className="bg-yellow-500/20 border border-yellow-500/50 px-6 py-4 h-28 flex flex-col justify-end shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <div className="text-yellow-300 font-bold truncate max-w-[120px]">@{users[0]?.username}</div>
                <div className="text-yellow-400 text-sm font-bold">{users[0]?.total_points.toLocaleString()} pts</div>
                <div className="text-yellow-500/70 text-xs mt-1">CHAMPION</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center group">
              <div className="relative">
                <img
                  src={users[2]?.avatar_url}
                  alt={users[2]?.username}
                  className="w-16 h-16 rounded-sm border-2 border-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform"
                />
                <div className="absolute -top-2 -right-2 text-2xl">🥉</div>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/50 px-4 py-3 h-16 flex flex-col justify-end">
                <div className="text-amber-300 font-bold text-sm truncate max-w-[100px]">@{users[2]?.username}</div>
                <div className="text-amber-400 text-xs">{users[2]?.total_points.toLocaleString()} pts</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings Table */}
        <div
          className="bg-black border-2 border-yellow-900 p-1"
          style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
        >
          <div className="bg-[#0a0a0a]">
            {/* Table Header */}
            <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-2 p-4 bg-yellow-900/30 border-b border-yellow-900/50 text-xs uppercase tracking-wider text-yellow-400 font-bold">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-3">Rango</div>
              <div className="col-span-2">Level</div>
              <div className="col-span-2 text-right">Points</div>
              <div className="col-span-1 text-right">CVs</div>
            </div>

            {/* Table Body */}
            {users.map((user, index) => {
              const style = getRankStyle(index + 1);
              return (
                <div
                  key={user.user_id}
                  className={`grid grid-cols-[repeat(13,minmax(0,1fr))] gap-2 p-4 border-b border-gray-800/50 hover:bg-yellow-900/10 transition-all duration-300 ${style.glow} group`}
                >
                  {/* Rank */}
                  <div className={`col-span-1 font-black text-lg ${style.color}`}>
                    {index < 3 ? (
                      <span className="text-xl">{getRankIcon(index + 1)}</span>
                    ) : (
                      <span className="text-gray-500">#{index + 1}</span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className={`w-10 h-10 rounded-sm border-2 ${style.border} group-hover:scale-110 transition-transform`}
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-bold truncate">{user.full_name || user.username}</div>
                      <div className="text-gray-500 text-xs">@{user.username}</div>
                    </div>
                    <div className="flex gap-1 ml-auto">
                      {user.badges.slice(0, 3).map((badge) => (
                        <span key={badge} title={badge} className="text-sm hover:scale-125 transition-transform cursor-pointer">
                          {getBadgeIcon(badge)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rango (Rank Title) */}
                  <div className="col-span-3 flex items-center">
                    <span className={`${style.bg} ${style.color} border ${style.border} px-3 py-1 text-xs font-bold truncate`}>
                      {user.rank_title}
                    </span>
                  </div>

                  {/* Level */}
                  <div className="col-span-2 flex items-center">
                    <span className={`${style.bg} ${style.color} border ${style.border} px-2 py-1 text-xs font-bold`}>
                      LVL {user.level}
                    </span>
                  </div>

                  {/* Points */}
                  <div className={`col-span-2 text-right font-bold ${style.color} flex items-center justify-end gap-1`}>
                    <span>{user.total_points.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs">pts</span>
                  </div>

                  {/* CVs */}
                  <div className="col-span-1 text-right text-gray-400 flex items-center justify-end gap-1">
                    <span className="text-sm">📄</span>
                    <span className="text-xs">{user.cvs_published}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <div className="text-center py-20 space-y-6">
            <div className="text-6xl animate-bounce">🏆</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-400">NO PLAYERS YET</h3>
              <p className="text-gray-500 text-sm">Sé el primero en subir al ranking</p>
            </div>
            <a
              href="/register"
              className="inline-block bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 py-3 transition-colors"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              JOIN THE GAME
            </a>
          </div>
        )}

        {/* Retro Footer */}
        <footer className="text-center space-y-6 mt-16">
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-yellow-600"></div>
              <div className="w-1 h-1 bg-yellow-500"></div>
              <div className="w-1 h-1 bg-yellow-400"></div>
            </div>
            <div className="w-16 h-[2px] bg-gradient-to-r from-yellow-600 to-transparent"></div>
            <span className="text-yellow-500 text-lg">🏆</span>
            <div className="w-16 h-[2px] bg-gradient-to-l from-yellow-600 to-transparent"></div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-yellow-400"></div>
              <div className="w-1 h-1 bg-yellow-500"></div>
              <div className="w-1 h-1 bg-yellow-600"></div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
            <span>PIXELCV RANKINGS</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              COMPETE & CONQUER
              <span className="animate-pulse">_</span>
            </span>
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
          25% { transform: translateY(-10px) rotate(3deg); }
          50% { transform: translateY(-5px) rotate(-2deg); }
          75% { transform: translateY(-15px) rotate(2deg); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }

        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -2px 0 #ff6600;
          clip-path: inset(0 0 50% 0);
          animation: glitch-top 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: 2px 0 #ffcc00;
          clip-path: inset(50% 0 0 0);
          animation: glitch-bottom 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch-top {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-2px, 1px); }
          94% { transform: translate(2px, -1px); }
          96% { transform: translate(-1px, 2px); }
          98% { transform: translate(1px, -2px); }
        }
        @keyframes glitch-bottom {
          0%, 90%, 100% { transform: translate(0); }
          91% { transform: translate(2px, 1px); }
          93% { transform: translate(-2px, -1px); }
          95% { transform: translate(1px, 2px); }
          97% { transform: translate(-1px, -2px); }
        }
      `}</style>
    </div>
  );
}
