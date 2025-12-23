"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Guardar la ruta actual para redirigir después del login
      localStorage.setItem('redirectAfterLogin', pathname);
      router.push('/login');
    }
  }, [router, pathname]);

  // En el servidor, siempre renderizamos los hijos
  // En el cliente, el useEffect manejará la redirección si no hay token
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (!token) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-purple-300 text-xl">Verificando autenticación...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
