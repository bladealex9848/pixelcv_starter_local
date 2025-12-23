"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          username, 
          password, 
          full_name: fullName || undefined 
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.detail || 'Error al registrarse');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-8">
      <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-purple-500/30">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          PixelCV
        </h1>
        <p className="text-purple-300 text-center mb-8">Únete a la comunidad</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-purple-300 mb-2 text-sm">Nombre completo (opcional)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/30 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400 focus:outline-none focus:border-purple-400 transition"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-purple-300 mb-2 text-sm">Nombre de usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/30 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400 focus:outline-none focus:border-purple-400 transition"
              placeholder="username"
              required
            />
          </div>

          <div>
            <label className="block text-purple-300 mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400 focus:outline-none focus:border-purple-400 transition"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-purple-300 mb-2 text-sm">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400 focus:outline-none focus:border-purple-400 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center text-purple-300 text-sm">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-purple-400 hover:text-purple-300 underline">
            Inicia sesión
          </a>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-purple-400 hover:text-purple-300 text-sm">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
