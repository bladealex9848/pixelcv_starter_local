export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            PixelCV
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 max-w-3xl mx-auto mb-8">
            Crea CVs profesionales con RenderCV, compártelos con la comunidad y gana puntos mientras subes de nivel
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="/editor" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition transform hover:scale-105 shadow-lg shadow-purple-500/30">
            🚀 Crear mi CV
          </a>
          <a href="/community" className="bg-black/40 backdrop-blur-sm text-purple-300 border border-purple-500/50 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-purple-900/30 transition">
            👥 Explorar Comunidad
          </a>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-white mb-2">CVs Profesionales</h3>
            <p className="text-purple-300">Usa RenderCV para crear CVs con tipografía perfecta y múltiples diseños</p>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
            <div className="text-5xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-white mb-2">Landing Pages</h3>
            <p className="text-purple-300">Publica tu CV como landing page y comparte tu link personal</p>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-white mb-2">Gamificación</h3>
            <p className="text-purple-300">Gana puntos, sube de nivel y desbloquea badges mientras construyes tu perfil</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black/30 py-16 border-t border-purple-500/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">¿Listo para empezar?</h2>
          <p className="text-purple-300 mb-8">Únete a miles de profesionales que ya están usando PixelCV</p>
          <div className="flex gap-4 justify-center">
            <a href="/register" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition">
              Registrarse Gratis
            </a>
            <a href="/login" className="bg-transparent border-2 border-purple-500 text-purple-300 px-8 py-3 rounded-lg font-semibold hover:bg-purple-900/30 transition">
              Iniciar Sesión
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
