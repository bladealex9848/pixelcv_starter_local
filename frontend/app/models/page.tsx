"use client";
import React, { useState, useEffect } from 'react';

interface ModelData {
  name: string;
  provider: string;
  size: string;
  time: string;
  f1: number;
  description: string;
  color: string;
  icon: string;
  url: string;
}

export default function ModelsPage() {
  const models: ModelData[] = [
    {
      name: "Phi-4 Mini",
      provider: "Microsoft",
      size: "3.8B",
      time: "7.08s",
      f1: 1.00,
      description: "Equilibrio avanzado entre eficiencia y razonamiento. Optimizado para tareas complejas.",
      color: "from-blue-500 to-cyan-400",
      icon: "🧠",
      url: "https://ollama.com/library/phi4-mini"
    },
    {
      name: "Gemma 3 1B",
      provider: "Google",
      size: "1B",
      time: "3.76s",
      f1: 1.00,
      description: "La nueva generación de modelos ligeros de Google. Extremadamente rápido y preciso.",
      color: "from-red-500 to-yellow-400",
      icon: "💎",
      url: "https://ollama.com/library/gemma3"
    },
    {
      name: "Gemma 3 270M",
      provider: "Google",
      size: "270M",
      time: "2.14s",
      f1: 0.67,
      description: "Ultra-ligero. Ideal para dispositivos con recursos muy limitados.",
      color: "from-orange-500 to-red-400",
      icon: "⚡",
      url: "https://ollama.com/library/gemma3"
    },
    {
      name: "Granite 3.3 2B",
      provider: "IBM",
      size: "2B",
      time: "5.76s",
      f1: 1.00,
      description: "Entrenado para razonamiento empresarial y seguimiento de instrucciones.",
      color: "from-indigo-600 to-blue-400",
      icon: "🏗️",
      url: "https://ollama.com/library/granite3.3"
    },
    {
      name: "Qwen 3 1.7B",
      provider: "Alibaba",
      size: "1.7B",
      time: "26.63s",
      f1: 1.00,
      description: "Excelente comprensión del lenguaje y habilidades de codificación.",
      color: "from-green-500 to-emerald-400",
      icon: "🐉",
      url: "https://ollama.com/library/qwen3"
    },
    {
      name: "Qwen 3 0.6B",
      provider: "Alibaba",
      size: "0.6B",
      time: "8.61s",
      f1: 1.00,
      description: "Versión comprimida del potente Qwen 3 para baja latencia.",
      color: "from-teal-500 to-green-400",
      icon: "🍃",
      url: "https://ollama.com/library/qwen3"
    },
    {
      name: "Phi-3.5 Mini",
      provider: "Microsoft",
      size: "3.8B",
      time: "8.50s",
      f1: 0.67,
      description: "Modelo clásico optimizado para tareas de lógica y matemáticas.",
      color: "from-purple-500 to-pink-400",
      icon: "🧪",
      url: "https://ollama.com/library/phi3.5"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden pt-16">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 text-4xl animate-bounce">👾</div>
        <div className="absolute bottom-20 right-10 text-4xl animate-pulse">🕹️</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] opacity-5 font-black">PIXEL</div>
      </div>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-purple-900 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] uppercase">
            MODEL_LAB
          </h1>
          <div className="inline-block bg-purple-900/30 border border-purple-500/50 px-4 py-1 rounded-full animate-pulse">
            <span className="text-purple-300 text-sm font-bold">BENCHMARK_STATUS: SYSTEM_READY</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {models.map((model, idx) => (
            <div 
              key={idx} 
              className="group relative bg-black border-2 border-purple-900 hover:border-purple-500 transition-all duration-300 p-1"
              style={{ clipPath: 'polygon(0 5px, 5px 5px, 5px 0, calc(100% - 5px) 0, calc(100% - 5px) 5px, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 5px calc(100% - 5px), 0 calc(100% - 5px))' }}
            >
              <div className="bg-[#111] p-6 h-full space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">{model.provider}</span>
                      <h2 className="text-2xl font-bold mt-1 tracking-tight">{model.name}</h2>
                    </div>
                    <span className="text-4xl group-hover:scale-125 transition-transform duration-300">{model.icon}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-2 flex-1 bg-gray-800 rounded-none overflow-hidden border border-gray-700`}>
                        <div 
                          className={`h-full bg-gradient-to-r ${model.color} transition-all duration-1000 delay-300`} 
                          style={{ width: `${model.f1 * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold w-12 text-right">ACC {Math.round(model.f1 * 100)}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-gray-900/50 p-2 border border-gray-800">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Latency</p>
                        <p className="text-sm font-bold text-cyan-400">{model.time}</p>
                      </div>
                      <div className="bg-gray-900/50 p-2 border border-gray-800">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Params</p>
                        <p className="text-sm font-bold text-pink-400">{model.size}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-purple-900 pl-3">
                    "{model.description}"
                  </p>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-gray-800 mt-auto">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-2 ${i < model.f1 * 5 ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-gray-800'}`}></div>
                    ))}
                  </div>
                  <a 
                    href={model.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase font-black text-purple-400 hover:text-white transition-colors flex items-center gap-1 group/btn"
                  >
                    View Docs <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Stats Chart Section */}
        <section className="mt-24 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-purple-900"></div>
            <h2 className="text-3xl font-bold italic tracking-tighter">PERFORMANCE_MATRIX</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-purple-900"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-gray-900/20 p-8 border border-purple-900/30 rounded-3xl backdrop-blur-sm">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 animate-pulse"></span> Latency Comparison (Lower is Better)
              </h3>
              <div className="space-y-4">
                {models.sort((a, b) => parseFloat(a.time) - parseFloat(b.time)).map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                      <span>{m.name}</span>
                      <span>{m.time}</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800">
                      <div className="h-full bg-cyan-500" style={{ width: `${(parseFloat(m.time) / 30) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-400 animate-pulse"></span> Accuracy Score (Higher is Better)
              </h3>
              <div className="space-y-4">
                {models.sort((a, b) => b.f1 - a.f1).map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                      <span>{m.name}</span>
                      <span>{Math.round(m.f1 * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800">
                      <div className="h-full bg-pink-500" style={{ width: `${m.f1 * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-24 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.5em] leading-loose">
            All benchmarks executed on local hardware via Ollama. <br/>
            Data updated as of {new Date().toLocaleDateString()}.
          </p>
        </footer>
      </main>

      <style jsx>{`
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
