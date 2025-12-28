"use client";
import { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';

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

  // Modal states
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; pieceId: string | null; pieceTitle: string }>({
    isOpen: false,
    pieceId: null,
    pieceTitle: ''
  });
  const [avatarModal, setAvatarModal] = useState<{ isOpen: boolean; piece: Piece | null }>({
    isOpen: false,
    piece: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingAvatar, setIsSettingAvatar] = useState(false);

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

  const openAvatarModal = (piece: Piece) => {
    setAvatarModal({ isOpen: true, piece });
  };

  const handleUseAsAvatar = async () => {
    const piece = avatarModal.piece;
    if (!piece) return;

    setIsSettingAvatar(true);

    // Generar DataURL desde los píxeles para el avatar
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsSettingAvatar(false);
      return;
    }

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

    setIsSettingAvatar(false);

    if (res.ok) {
      setAvatarModal({ isOpen: false, piece: null });
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

  const openDeleteModal = (piece: Piece) => {
    setDeleteModal({ isOpen: true, pieceId: piece.id, pieceTitle: piece.title });
  };

  const handleDelete = async () => {
    if (!deleteModal.pieceId) return;

    setIsDeleting(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/${deleteModal.pieceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    setIsDeleting(false);

    if (res.ok) {
      setPieces(pieces.filter(p => p.id !== deleteModal.pieceId));
      setDeleteModal({ isOpen: false, pieceId: null, pieceTitle: '' });
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

              {currentUser && String(currentUser.id) === String(piece.author_id) && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openAvatarModal(piece)}
                    className="flex-1 bg-orange-900/30 border border-orange-500/50 text-[10px] font-bold uppercase py-1 hover:bg-orange-500 hover:text-black transition-all"
                  >
                    👤 Avatar
                  </button>
                  <button
                    onClick={() => openDeleteModal(piece)}
                    className="flex-1 bg-red-900/30 border border-red-500/50 text-[10px] font-bold uppercase py-1 hover:bg-red-500 hover:text-white transition-all"
                  >
                    🗑️ Borrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Modal de confirmación para borrar */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, pieceId: null, pieceTitle: '' })}
        onConfirm={handleDelete}
        title="Borrar obra"
        message={`¿Estás seguro de que quieres borrar "${deleteModal.pieceTitle}"? Esta acción no se puede deshacer.`}
        confirmText="Borrar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Modal de confirmación para avatar */}
      <ConfirmModal
        isOpen={avatarModal.isOpen}
        onClose={() => setAvatarModal({ isOpen: false, piece: null })}
        onConfirm={handleUseAsAvatar}
        title="Usar como avatar"
        message={`¿Deseas usar "${avatarModal.piece?.title || ''}" como tu foto de perfil?`}
        confirmText="Usar como avatar"
        cancelText="Cancelar"
        variant="info"
        isLoading={isSettingAvatar}
      />
    </div>
  );
}
