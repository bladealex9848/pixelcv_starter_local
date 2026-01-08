"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PixelartVariantSelector from './PixelartVariantSelector';

type Tool = 'pencil' | 'eraser' | 'fill' | 'picker';

interface HistoryState {
  pixels: string[];
  title: string;
}

interface PixelArtVariant {
  pixels: string[];
  provider: string;
  source?: string;
  index: number;
  prompt_used: string;
  validation?: {
    is_valid: boolean;
    confidence: number;
    metrics: {
      colored_pixels: number;
      colored_percentage: number;
      unique_colors: number;
      balance: number;
      complexity: number;
    };
  };
}

export default function PixelartEditor() {
  const [pixels, setPixels] = useState<string[]>(Array(1024).fill('#ffffff'));
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [variants, setVariants] = useState<PixelArtVariant[]>([]);
  const [showVariantSelector, setShowVariantSelector] = useState(false);

  // Nuevos estados
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const router = useRouter();

  // Guardar estado en historial
  const saveToHistory = (newPixels: string[], newTitle?: string) => {
    const state: HistoryState = {
      pixels: [...newPixels],
      title: newTitle !== undefined ? newTitle : title
    };

    // Eliminar estados futuros si estamos en medio del historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Inicializar historial
  useEffect(() => {
    if (historyIndex === -1) {
      saveToHistory(pixels, title);
    }
  }, []);

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPixels([...prevState.pixels]);
      setTitle(prevState.title);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPixels([...nextState.pixels]);
      setTitle(nextState.title);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Herramienta: Pincel
  const handlePencil = (index: number) => {
    const newPixels = [...pixels];
    newPixels[index] = selectedColor;
    setPixels(newPixels);
    saveToHistory(newPixels);
  };

  // Herramienta: Borrador
  const handleEraser = (index: number) => {
    const newPixels = [...pixels];
    newPixels[index] = '#ffffff';
    setPixels(newPixels);
    saveToHistory(newPixels);
  };

  // Herramienta: Color Picker (gotero)
  const handlePicker = (index: number) => {
    setSelectedColor(pixels[index]);
    setCurrentTool('pencil'); // Volver a pincel después de picker
  };

  // Herramienta: Fill Bucket (algoritmo flood fill)
  const handleFill = (startIndex: number) => {
    const targetColor = pixels[startIndex];
    if (targetColor === selectedColor) return; // Mismo color, no hacer nada

    const newPixels = [...pixels];
    const stack = [startIndex];
    const visited = new Set<number>();

    while (stack.length > 0) {
      const index = stack.pop()!;

      if (visited.has(index)) continue;
      visited.add(index);

      if (newPixels[index] === targetColor) {
        newPixels[index] = selectedColor;

        // Agregar vecinos (arriba, abajo, izquierda, derecha)
        const row = Math.floor(index / 32);
        const col = index % 32;

        if (row > 0) stack.push(index - 32); // Arriba
        if (row < 31) stack.push(index + 32); // Abajo
        if (col > 0) stack.push(index - 1); // Izquierda
        if (col < 31) stack.push(index + 1); // Derecha
      }
    }

    setPixels(newPixels);
    saveToHistory(newPixels);
  };

  // Manejador unificado de clic
  const handlePixelClick = (index: number) => {
    switch (currentTool) {
      case 'pencil':
        handlePencil(index);
        break;
      case 'eraser':
        handleEraser(index);
        break;
      case 'fill':
        handleFill(index);
        break;
      case 'picker':
        handlePicker(index);
        break;
    }
  };

  // Dibujar con arrastre (solo pincel y borrador)
  const handlePixelEnter = (index: number) => {
    if (isDrawing && (currentTool === 'pencil' || currentTool === 'eraser')) {
      if (currentTool === 'pencil') {
        const newPixels = [...pixels];
        newPixels[index] = selectedColor;
        setPixels(newPixels);
      } else {
        const newPixels = [...pixels];
        newPixels[index] = '#ffffff';
        setPixels(newPixels);
      }
    }
  };

  // Limpiar canvas
  const handleClear = () => {
    const newPixels = Array(1024).fill('#ffffff');
    setPixels(newPixels);
    saveToHistory(newPixels);
  };

  // Exportar a PNG
  const handleExportPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Escalar para export (512x512 = 16px por celda)
    pixels.forEach((color, i) => {
      const x = (i % 32) * 16;
      const y = Math.floor(i / 32) * 16;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 16, 16);
    });

    // Descargar
    const link = document.createElement('a');
    link.download = `${title || 'pixelart'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const generateWithAI = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      // Usar el endpoint de generación múltiple
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pixelart/generate-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          count: 3,
          select_best: true
        })
      });
      const data = await res.json();

      if (data.variants && data.variants.length > 0) {
        // Mostrar selector de variantes
        setVariants(data.variants);
        setShowVariantSelector(true);

        // Seleccionar automáticamente la mejor variante
        const bestVariant = data.variants[data.selected_index];
        if (bestVariant && bestVariant.pixels) {
          setPixels(bestVariant.pixels);
          saveToHistory(bestVariant.pixels);
        }
      } else if (data.pixels) {
        // Fallback a generación simple (si no hay variantes)
        setPixels(data.pixels);
        saveToHistory(data.pixels);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVariantSelect = (index: number) => {
    const variant = variants[index];
    if (variant && variant.pixels) {
      setPixels(variant.pixels);
      saveToHistory(variant.pixels);
    }
  };

  const saveArt = async () => {
    if (isSaving) return;
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Canvas */}
        <div className="flex-1">
          <div className="max-w-[512px] mx-auto">
            <div
              className="grid grid-cols-32 gap-0 border-4 border-orange-900 shadow-2xl overflow-hidden cursor-crosshair aspect-square w-full select-none"
              style={{ gridTemplateColumns: 'repeat(32, 1fr)' }}
              onMouseDown={() => setIsDrawing(true)}
              onMouseUp={() => {
                setIsDrawing(false);
                if (historyIndex < history.length - 1) {
                  saveToHistory(pixels);
                }
              }}
              onMouseLeave={() => setIsDrawing(false)}
            >
              {pixels.map((color, i) => (
                <div
                  key={i}
                  onClick={() => handlePixelClick(i)}
                  onMouseEnter={() => handlePixelEnter(i)}
                  style={{ backgroundColor: color }}
                  className="w-full h-full border-[0.1px] border-gray-200/10 hover:opacity-80"
                />
              ))}
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                  historyIndex <= 0
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                ↩ Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                  historyIndex >= history.length - 1
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                ↪ Redo
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 text-xs font-bold uppercase bg-red-600 hover:bg-red-500 text-white transition-all"
              >
                🗑️ Limpiar
              </button>
              <button
                onClick={handleExportPNG}
                className="px-4 py-2 text-xs font-bold uppercase bg-green-600 hover:bg-green-500 text-white transition-all"
              >
                💾 Exportar PNG
              </button>
            </div>
          </div>
        </div>

        {/* Tools */}
        <div className="flex-1 space-y-6 bg-gray-900/50 p-6 border border-orange-900/30 rounded-lg">
          <div>
            <label className="text-orange-400 text-xs font-bold uppercase block mb-2">Título de la obra</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              onBlur={() => saveToHistory(pixels, title)}
              className="w-full bg-black border border-orange-900/50 p-2 text-white font-mono text-sm"
              placeholder="Ej: Guerrero de Píxeles"
            />
          </div>

          {/* Herramientas de dibujo */}
          <div>
            <label className="text-orange-400 text-xs font-bold uppercase block mb-2">🛠️ Herramientas</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrentTool('pencil')}
                className={`p-3 text-xs font-bold uppercase transition-all ${
                  currentTool === 'pencil'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ✏️ Pincel
              </button>
              <button
                onClick={() => setCurrentTool('eraser')}
                className={`p-3 text-xs font-bold uppercase transition-all ${
                  currentTool === 'eraser'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                🧹 Borrador
              </button>
              <button
                onClick={() => setCurrentTool('fill')}
                className={`p-3 text-xs font-bold uppercase transition-all ${
                  currentTool === 'fill'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                🪣 Relleno
              </button>
              <button
                onClick={() => setCurrentTool('picker')}
                className={`p-3 text-xs font-bold uppercase transition-all ${
                  currentTool === 'picker'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💉 Gotero
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              {currentTool === 'pencil' && 'Clic o arrastrar para pintar'}
              {currentTool === 'eraser' && 'Clic o arrastrar para borrar'}
              {currentTool === 'fill' && 'Clic para rellenar área del mismo color'}
              {currentTool === 'picker' && 'Clic para copiar color'}
            </p>
          </div>

          <div>
            <label className="text-orange-400 text-xs font-bold uppercase block mb-2">Paleta de Color</label>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full h-12 bg-black border border-orange-900/50 cursor-pointer"
            />
            {/* Colores recientes */}
            <div className="flex gap-1 mt-2">
              {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className="w-6 h-6 border border-gray-700 hover:border-orange-500"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <label className="text-purple-400 text-xs font-bold uppercase block mb-2">🤖 Generación por IA</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe lo que quieres crear..."
              className="w-full bg-black border border-purple-900/30 p-2 text-white font-mono text-xs h-20 mb-2"
            />
            <button
              onClick={generateWithAI}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 text-xs transition-all uppercase disabled:opacity-50"
            >
              {isGenerating ? 'Generando...' : 'Generar con IA'}
            </button>
          </div>

          <button
            onClick={saveArt}
            disabled={isSaving}
            className={`w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 transition-all uppercase tracking-widest mt-4 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            {isSaving ? 'Publicando...' : 'Publicar en Galería'}
          </button>
        </div>
      </div>

      {/* Selector de Variantes */}
      {showVariantSelector && variants.length > 0 && (
        <PixelartVariantSelector
          variants={variants}
          selectedIndex={variants.findIndex((_, i) => {
            const bestPixels = pixels;
            const bestVariant = variants.find(v =>
              JSON.stringify(v.pixels) === JSON.stringify(bestPixels)
            );
            return bestVariant ? variants.indexOf(bestVariant) : 0;
          })}
          onSelect={handleVariantSelect}
          onClose={() => setShowVariantSelector(false)}
        />
      )}
    </div>
  );
}
