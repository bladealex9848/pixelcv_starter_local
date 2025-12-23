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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          full_name: fullName || username
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al registrarse');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Crear Cuenta</h1>
          <p className="text-purple-300">Únete a PixelCV y crea CVs profesionales</p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-purple-300 mb-2">Nombre de usuario *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu_usuario"
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                required
              />
            </div>

            <div>
              <label className="block text-purple-300 mb-2">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-purple-300 mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                required
              />
            </div>

            <div>
              <label className="block text-purple-300 mb-2">Contraseña *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                required
              />
              <p className="text-purple-400 text-xs mt-1">
                La contraseña será truncada automáticamente si es muy larga
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-purple-300">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => router.push('/login')} className="text-purple-400 hover:text-purple-300 font-semibold">
                Inicia sesión
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => router.push('/')} className="text-purple-400 hover:text-purple-300">
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
