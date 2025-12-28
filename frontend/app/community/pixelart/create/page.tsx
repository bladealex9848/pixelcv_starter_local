"use client";
import PixelartEditor from '../../../../components/PixelartEditor';

export default function CreatePixelArt() {
  return (
    <div className="min-h-screen bg-[#080505] text-white pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-orange-500 uppercase">Editor de Píxeles</h1>
          <p className="text-gray-500 text-sm font-mono mt-2">DIBUJA MANUALMENTE O USA EL PODER DE OLLAMA AI</p>
        </div>
        
        <PixelartEditor />
      </div>
    </div>
  );
}
