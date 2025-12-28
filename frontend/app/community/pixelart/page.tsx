"use client";
import PixelartGallery from '../../../components/PixelartGallery';
import Link from 'next/navigation';

export default function PixelArtCommunity() {
  return (
    <div className="min-h-screen bg-[#080505] text-white pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex justify-between items-end border-b-2 border-orange-900 pb-6">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-orange-500 uppercase">Pixel Art</h1>
            <p className="text-gray-500 text-sm font-mono mt-2">GALERÍA DE LA COMUNIDAD & CREACIÓN IA</p>
          </div>
          <a 
            href="/community/pixelart/create"
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 uppercase text-sm transition-all shadow-[0_0_15px_rgba(234,88,12,0.4)]"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Nueva Creación
          </a>
        </header>

        <PixelartGallery />
      </div>
    </div>
  );
}
