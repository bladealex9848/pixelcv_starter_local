"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PublicCVPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/public/${slug}`)
      .then(res => res.json())
      .then(data => {
        setCv(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/public/${slug}/visit?visitor_ip=${Date.now()}`, { method: 'POST' });
  }, [slug]);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para dar like');
      return;
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/${cv?.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setLiked(!liked);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/public/${slug}`)
        .then(res => res.json())
        .then(setCv);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-2xl">Cargando CV...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/30">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{cv?.name}</h1>
              <p className="text-purple-300">por @{cv?.author.username}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleLike} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition">
                ❤️ {cv?.total_likes}
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 text-purple-300">
                👁️ {cv?.total_visits}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 text-purple-300">
                💬 {cv?.total_comments}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl min-h-[500px]">
          {cv?.yaml_content ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono overflow-x-auto">
              {cv.yaml_content}
            </pre>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">El contenido del CV no está disponible</p>
            </div>
          )}
        </div>

        {cv?.pdf_url && (
          <div className="mt-8 flex justify-center">
            <a href={cv.pdf_url} target="_blank" rel="noopener noreferrer" 
               className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition">
              📄 Descargar PDF
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
