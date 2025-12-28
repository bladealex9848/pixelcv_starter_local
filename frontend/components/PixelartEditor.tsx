"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PixelartEditor() {
  const [pixels, setPixels] = useState<string[]>(Array(1024).fill('#ffffff'));
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const handlePixelClick = (index: number) => {
    const newPixels = [...pixels];
    newPixels[index] = selectedColor;
    setPixels(newPixels);
  };

  const generateWithAI = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.pixels) setPixels(data.pixels);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveArt = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || 'Sin título',
          pixels: { pixels },
          is_ai: prompt.length > 0,
          prompt
        })
      });
      if (res.ok) router.push('/community/pixelart');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Canvas */}
        <div 
          className="grid grid-cols-32 gap-0 border-4 border-orange-900 shadow-2xl overflow-hidden cursor-crosshair"
          style={{ width: '512px', height: '512px', gridTemplateColumns: 'repeat(32, 1fr)' }}
        >
          {pixels.map((color, i) => (
            <div 
              key={i} 
              onClick={() => handlePixelClick(i)}
              style={{ backgroundColor: color }}
              className="w-full h-full border-[0.1px] border-gray-200/10 hover:opacity-80"
            />
          ))}
        </div>

        {/* Tools */}
        <div className="flex-1 space-y-6 bg-gray-900/50 p-6 border border-orange-900/30 rounded-lg">
          <div>
            <label className="text-orange-400 text-xs font-bold uppercase block mb-2">Título de la obra</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-orange-900/50 p-2 text-white font-mono text-sm"
              placeholder="Ej: Guerrero de Píxeles"
            />
          </div>

          <div>
            <label className="text-orange-400 text-xs font-bold uppercase block mb-2">Paleta de Color</label>
            <input 
              type="color" 
              value={selectedColor} 
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full h-12 bg-black border border-orange-900/50 cursor-pointer"
            />
          </div>

          <div className="pt-4 border-t border-gray-800">
            <label className="text-purple-400 text-xs font-bold uppercase block mb-2">🤖 Generación por IA (Ollama)</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe lo que quieres crear..."
              className="w-full bg-black border border-purple-900/30 p-2 text-white font-mono text-xs h-20 mb-2"
            />
            <button 
              onClick={generateWithAI}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 text-xs transition-all uppercase"
            >
              {isGenerating ? 'Generando...' : 'Generar con IA'}
            </button>
          </div>

          <button 
            onClick={saveArt}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 transition-all uppercase tracking-widest mt-4"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Publicar en Galería
          </button>
        </div>
      </div>
    </div>
  );
}
