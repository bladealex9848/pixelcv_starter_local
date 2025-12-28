"use client";
import { useState, useEffect } from 'react';

interface Piece {
  id: string;
  title: string;
  author: string;
  pixels: { pixels: string[] };
  likes: number;
  comments: number;
}

export default function PixelartGallery() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/`)
      .then(res => res.json())
      .then(data => {
        setPieces(data);
        setLoading(false);
      });
  }, []);

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
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-900">
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
          </div>
        </div>
      ))}
    </div>
  );
}
