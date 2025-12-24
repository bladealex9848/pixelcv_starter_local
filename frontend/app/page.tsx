"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden pt-16 relative">

      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Animated Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(168,85,247,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.4) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}></div>

      {/* Floating Pixel Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Stars */}
        <div className="absolute top-[5%] left-[10%] w-2 h-2 bg-purple-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[15%] left-[80%] w-1 h-1 bg-cyan-400 opacity-50 animate-twinkle-delayed"></div>
        <div className="absolute top-[25%] left-[5%] w-1 h-1 bg-pink-400 opacity-40 animate-twinkle"></div>
        <div className="absolute top-[35%] left-[90%] w-2 h-2 bg-yellow-400 opacity-50 animate-twinkle-delayed"></div>
        <div className="absolute top-[50%] left-[3%] w-1 h-1 bg-green-400 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[60%] left-[95%] w-2 h-2 bg-purple-300 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[75%] left-[8%] w-1 h-1 bg-cyan-300 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[85%] left-[88%] w-1 h-1 bg-pink-300 opacity-60 animate-twinkle-delayed"></div>

        {/* Floating Retro Icons */}
        <div className="absolute top-[8%] left-[15%] text-4xl opacity-10 animate-float-slow">👾</div>
        <div className="absolute top-[20%] right-[10%] text-3xl opacity-10 animate-float-medium">🕹️</div>
        <div className="absolute top-[40%] left-[5%] text-3xl opacity-10 animate-float-delayed">🎮</div>
        <div className="absolute top-[55%] right-[8%] text-4xl opacity-10 animate-float-slow">🚀</div>
        <div className="absolute top-[70%] left-[12%] text-3xl opacity-10 animate-float-medium">⭐</div>
        <div className="absolute top-[82%] right-[15%] text-3xl opacity-10 animate-float-delayed">💎</div>
      </div>

      {/* Large Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="text-[20vw] font-black opacity-[0.015] tracking-widest text-purple-500 select-none animate-pulse-slow whitespace-nowrap">
          PIXELCV
        </div>
      </div>

      {/* Corner Pixel Decorations */}
      <div className="fixed top-20 left-4 pointer-events-none opacity-40 hidden lg:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-purple-500"></div>
            <div className="w-3 h-3 bg-purple-400"></div>
            <div className="w-3 h-3 bg-purple-300"></div>
            <div className="w-3 h-3 bg-purple-200"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-purple-400"></div>
            <div className="w-3 h-3 bg-purple-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-purple-300"></div>
          </div>
        </div>
      </div>
      <div className="fixed top-20 right-4 pointer-events-none opacity-40 rotate-90 hidden lg:block">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-pink-500"></div>
            <div className="w-3 h-3 bg-pink-400"></div>
            <div className="w-3 h-3 bg-pink-300"></div>
            <div className="w-3 h-3 bg-pink-200"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-pink-400"></div>
            <div className="w-3 h-3 bg-pink-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-pink-300"></div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center relative z-10">
        <div className="mb-12">
          {/* Glitch Title */}
          <div className="relative inline-block mb-6">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-purple-400 via-pink-400 to-purple-600 drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] uppercase glitch-text" data-text="PixelCV">
              PixelCV
            </h1>
            {/* Decorative pixels */}
            <div className="absolute -top-4 -left-6 w-3 h-3 bg-cyan-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-2 -right-4 w-2 h-2 bg-pink-400 animate-twinkle-delayed hidden md:block"></div>
            <div className="absolute -bottom-2 -left-3 w-2 h-2 bg-yellow-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -bottom-3 -right-5 w-3 h-3 bg-green-400 animate-twinkle-delayed hidden md:block"></div>
          </div>

          {/* Tagline with pixel decorations */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="hidden md:flex gap-1 items-center">
              <div className="w-8 h-1 bg-gradient-to-r from-transparent to-purple-500"></div>
              <div className="w-2 h-2 bg-purple-500"></div>
              <div className="w-1 h-1 bg-purple-400"></div>
            </div>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Crea CVs profesionales con IA, comparte con la comunidad y <span className="text-purple-400 font-bold">sube de nivel</span>
            </p>
            <div className="hidden md:flex gap-1 items-center">
              <div className="w-1 h-1 bg-purple-400"></div>
              <div className="w-2 h-2 bg-purple-500"></div>
              <div className="w-8 h-1 bg-gradient-to-l from-transparent to-purple-500"></div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/50 px-4 py-1.5 rounded-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
              <span className="text-green-300 text-xs font-bold uppercase tracking-wider">System Online</span>
            </div>
            <div className="bg-purple-900/30 border border-purple-500/50 px-4 py-1.5 rounded-sm">
              <span className="text-purple-300 text-xs font-bold uppercase tracking-wider">Free to Play</span>
            </div>
            <div className="bg-cyan-900/30 border border-cyan-500/50 px-4 py-1.5 rounded-sm">
              <span className="text-cyan-300 text-xs font-bold uppercase tracking-wider">AI Powered</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <a
            href="/register"
            className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 font-black text-lg uppercase tracking-wider hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🚀</span>
              Crear mi CV
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </a>
          <a
            href="/community"
            className="group relative bg-black/50 text-purple-300 border-2 border-purple-500/50 px-10 py-4 font-bold text-lg uppercase tracking-wider hover:border-purple-400 hover:text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">👥</span>
              Explorar Comunidad
            </span>
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div
            className="group relative bg-black border-2 border-purple-900 hover:border-purple-500 transition-all duration-300 p-1 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
          >
            <div className="bg-[#111] p-8 h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📄</div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">CVs Profesionales</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Usa RenderCV para crear CVs con tipografía perfecta y múltiples diseños LaTeX</p>
              <div className="mt-4 flex gap-1">
                <div className="w-2 h-2 bg-purple-500"></div>
                <div className="w-2 h-2 bg-purple-400"></div>
                <div className="w-2 h-2 bg-purple-300"></div>
                <div className="w-2 h-2 bg-gray-700"></div>
                <div className="w-2 h-2 bg-gray-700"></div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div
            className="group relative bg-black border-2 border-cyan-900 hover:border-cyan-500 transition-all duration-300 p-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
          >
            <div className="bg-[#111] p-8 h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">Asistente con IA</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Nuestro asistente inteligente te guía paso a paso y mejora tu contenido automáticamente</p>
              <div className="mt-4 flex gap-1">
                <div className="w-2 h-2 bg-cyan-500"></div>
                <div className="w-2 h-2 bg-cyan-400"></div>
                <div className="w-2 h-2 bg-cyan-300"></div>
                <div className="w-2 h-2 bg-cyan-200"></div>
                <div className="w-2 h-2 bg-gray-700"></div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div
            className="group relative bg-black border-2 border-pink-900 hover:border-pink-500 transition-all duration-300 p-1 hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]"
            style={{ clipPath: 'polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))' }}
          >
            <div className="bg-[#111] p-8 h-full">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎮</div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-400 transition-colors">Gamificación</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Gana puntos, sube de nivel y desbloquea badges mientras construyes tu perfil profesional</p>
              <div className="mt-4 flex gap-1">
                <div className="w-2 h-2 bg-pink-500"></div>
                <div className="w-2 h-2 bg-pink-400"></div>
                <div className="w-2 h-2 bg-pink-300"></div>
                <div className="w-2 h-2 bg-pink-200"></div>
                <div className="w-2 h-2 bg-pink-100"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 py-16 border-t border-purple-900/50">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-purple-500"></div>
            <h2 className="text-3xl md:text-4xl font-black italic text-center uppercase tracking-tight">
              <span className="text-purple-400">Como</span> <span className="text-white">Funciona</span>
            </h2>
            <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-purple-500"></div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { step: "01", icon: "📝", title: "Regístrate", desc: "Crea tu cuenta gratis en segundos", color: "purple" },
              { step: "02", icon: "✨", title: "Crea tu CV", desc: "Usa el editor asistido por IA", color: "cyan" },
              { step: "03", icon: "🌐", title: "Comparte", desc: "Publica tu CV con un link único", color: "pink" },
              { step: "04", icon: "🏆", title: "Sube de Nivel", desc: "Gana puntos y desbloquea badges", color: "yellow" },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                {/* Step number */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-${item.color}-500 text-black text-[10px] font-black px-2 py-0.5 rounded-sm z-10`}>
                  STEP {item.step}
                </div>
                <div className="bg-black/50 border border-gray-800 group-hover:border-purple-500/50 p-6 pt-8 transition-all duration-300">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
                {/* Connector line */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[2px] bg-gradient-to-r from-purple-500 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 border-t border-purple-900/50">
        <div className="container mx-auto px-4 text-center">
          {/* Decorative element */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`w-3 h-3 ${i === 3 ? 'bg-purple-400' : i === 2 || i === 4 ? 'bg-purple-500' : i === 1 || i === 5 ? 'bg-purple-600' : 'bg-purple-700'} animate-pulse`} style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
            ¿Listo para <span className="text-purple-400">empezar</span>?
          </h2>
          <p className="text-gray-400 mb-10 max-w-md mx-auto">
            Únete a la comunidad de profesionales que ya están usando PixelCV
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-4 font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              Registrarse Gratis
            </a>
            <a
              href="/login"
              className="bg-transparent border-2 border-purple-500/50 text-purple-300 px-10 py-4 font-bold uppercase tracking-wider hover:border-purple-400 hover:text-white transition-all duration-300"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-gray-900">
        <div className="container mx-auto px-4">
          {/* Pixel Art Divider */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-purple-600"></div>
              <div className="w-1 h-1 bg-purple-500"></div>
              <div className="w-1 h-1 bg-purple-400"></div>
            </div>
            <div className="w-20 h-[2px] bg-gradient-to-r from-purple-600 to-transparent"></div>
            <span className="text-2xl">👾</span>
            <div className="w-20 h-[2px] bg-gradient-to-l from-purple-600 to-transparent"></div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-purple-400"></div>
              <div className="w-1 h-1 bg-purple-500"></div>
              <div className="w-1 h-1 bg-purple-600"></div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-6">
            <a href="/community" className="hover:text-purple-400 transition-colors">Comunidad</a>
            <span className="text-gray-700">|</span>
            <a href="/leaderboard" className="hover:text-purple-400 transition-colors">Ranking</a>
            <span className="text-gray-700">|</span>
            <a href="/models" className="hover:text-purple-400 transition-colors">Modelos IA</a>
            <span className="text-gray-700">|</span>
            <a href="/editor" className="hover:text-purple-400 transition-colors">Editor</a>
          </div>

          {/* Credits */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600 uppercase tracking-widest">
            <span>PixelCV 2024</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              Press Start to Begin
              <span className="animate-pulse">_</span>
            </span>
          </div>
        </div>
      </footer>

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
          25% { transform: translateY(-15px) rotate(3deg); }
          50% { transform: translateY(-8px) rotate(-2deg); }
          75% { transform: translateY(-20px) rotate(2deg); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.015; }
          50% { opacity: 0.03; }
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
          text-shadow: -3px 0 #ff00ff;
          clip-path: inset(0 0 50% 0);
          animation: glitch-top 2.5s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: 3px 0 #00ffff;
          clip-path: inset(50% 0 0 0);
          animation: glitch-bottom 3s infinite linear alternate-reverse;
        }
        @keyframes glitch-top {
          0%, 85%, 100% { transform: translate(0); }
          87% { transform: translate(-3px, 2px); }
          90% { transform: translate(3px, -2px); }
          93% { transform: translate(-2px, 3px); }
          96% { transform: translate(2px, -3px); }
        }
        @keyframes glitch-bottom {
          0%, 85%, 100% { transform: translate(0); }
          86% { transform: translate(3px, 2px); }
          89% { transform: translate(-3px, -2px); }
          92% { transform: translate(2px, 3px); }
          95% { transform: translate(-2px, -3px); }
        }
      `}</style>
    </main>
  )
}
