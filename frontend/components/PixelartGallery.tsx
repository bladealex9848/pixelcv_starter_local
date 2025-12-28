"use client";
import { useState, useEffect } from 'react';

interface Piece {
  id: string;
  title: string;
  author: string;
  author_id: string;
  pixels: { pixels: string[] };
  likes: number;
  comments: number;
}

export default function PixelartGallery() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/`)
      .then(res => res.json())
      .then(data => {
        setPieces(data);
        setLoading(false);
      });
  }, []);

  const handleUseAsAvatar = async (piece: Piece) => {
    // Generar DataURL desde los píxeles para el avatar
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    piece.pixels.pixels.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i % 32, Math.floor(i / 32), 1, 1);
    });

    const dataUrl = canvas.toDataURL();
    const token = localStorage.getItem('token');
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ avatar_url: dataUrl })
    });

    if (res.ok) {
      alert('¡Avatar actualizado con éxito!');
      window.location.reload();
    }
  };

  const handleLike = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/${id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setPieces(pieces.map(p => p.id === id ? { ...p, likes: data.likes } : p));
    }
  };

  if (loading) return <div className="text-center text-orange-400 font-mono animate-pulse">CARGANDO GALERÍA...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {pieces.map((piece) => (
        <div key={piece.id} className="bg-black border-2 border-orange-900/50 p-4 hover:border-orange-500 transition-all group">
          {/* Preview */}
          <div 
            className="grid grid-cols-32 gap-0 w-full aspect-square border border-gray-800"
            style={{ gridTemplateColumns: 'repeat(32, 1fr)' }}
          >
            {piece.pixels.pixels.map((color, i) => (
              <div key={i} style={{ backgroundColor: color }} className="w-full h-full" />
            ))}
          </div>
          
          <div className="mt-4 space-y-2">
            <h3 className="text-orange-400 font-black uppercase truncate">{piece.title}</h3>
            <p className="text-gray-500 text-[10px] uppercase font-mono">Por: {piece.author}</p>
            
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-900">
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => handleLike(piece.id)}
                  className="flex items-center gap-2 text-xs hover:text-red-500 transition-colors"
                >
                  <span>❤️</span> {piece.likes}
                </button>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>💬</span> {piece.comments}
                </div>
              </div>

              {currentUser && currentUser.id === piece.author_id && (
                <button 
                  onClick={() => handleUseAsAvatar(piece)}
                  className="w-full bg-orange-900/30 border border-orange-500/50 text-[10px] font-bold uppercase py-1 hover:bg-orange-500 hover:text-black transition-all mt-2"
                >
                  👤 Usar como Avatar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
