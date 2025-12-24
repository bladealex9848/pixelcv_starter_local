"use client";
import React, { useState, useEffect } from 'react';

interface ModelData {
  name: string;
  id: string;
  provider: string;
  size: string;
  time: string;
  successRate: number;
  description: string;
  color: string;
  icon: string;
  url: string;
  available: boolean;
  recommended?: boolean;
  spanishSupport: boolean;
  useCase: string;
  notAvailableReason?: string;
}

export default function ModelsPage() {
  const models: ModelData[] = [
    // === MODELOS DISPONIBLES ===
    {
      name: "Granite 3.3 2B",
      id: "granite3.3:2b",
      provider: "IBM",
      size: "2.5B",
      time: "1.87s",
      successRate: 100,
      description: "El más rápido y consistente. Excelente para mejorar bullets y análisis de CV en español.",
      color: "from-indigo-600 to-blue-400",
      icon: "🏗️",
      url: "https://ollama.com/library/granite3.3",
      available: true,
      recommended: true,
      spanishSupport: true,
      useCase: "Mejor balance velocidad/calidad"
    },
    {
      name: "Gemma 3 1B",
      id: "gemma3:1b",
      provider: "Google",
      size: "1B",
      time: "3.04s",
      successRate: 100,
      description: "Respuestas detalladas y elaboradas. Muy buena calidad en español.",
      color: "from-red-500 to-yellow-400",
      icon: "💎",
      url: "https://ollama.com/library/gemma3",
      available: true,
      spanishSupport: true,
      useCase: "Respuestas más elaboradas"
    },
    {
      name: "Qwen 3 0.6B",
      id: "qwen3:0.6b",
      provider: "Alibaba",
      size: "0.6B",
      time: "5.27s",
      successRate: 100,
      description: "Modelo compacto con excelente rendimiento. Ideal para dispositivos con recursos limitados.",
      color: "from-teal-500 to-green-400",
      icon: "🍃",
      url: "https://ollama.com/library/qwen3",
      available: true,
      spanishSupport: true,
      useCase: "Recursos limitados"
    },
    {
      name: "Qwen 3 1.7B",
      id: "qwen3:1.7b",
      provider: "Alibaba",
      size: "2B",
      time: "10.55s",
      successRate: 100,
      description: "Mayor capacidad de razonamiento. Produce mejoras más creativas y detalladas.",
      color: "from-green-500 to-emerald-400",
      icon: "🐉",
      url: "https://ollama.com/library/qwen3",
      available: true,
      spanishSupport: true,
      useCase: "Mayor creatividad"
    },
    // === MODELOS NO DISPONIBLES (para referencia) ===
    {
      name: "Phi-4 Mini",
      id: "phi4-mini:latest",
      provider: "Microsoft",
      size: "3.8B",
      time: "16.67s",
      successRate: 80,
      description: "Modelo avanzado de Microsoft. Buen razonamiento pero responde frecuentemente en inglés.",
      color: "from-blue-500 to-cyan-400",
      icon: "🧠",
      url: "https://ollama.com/library/phi4-mini",
      available: false,
      spanishSupport: false,
      useCase: "Razonamiento complejo",
      notAvailableReason: "Responde en inglés"
    },
    {
      name: "Phi-3.5 Mini",
      id: "phi3.5:latest",
      provider: "Microsoft",
      size: "3.8B",
      time: "71.9s",
      successRate: 67,
      description: "Modelo clásico de Microsoft. Buena calidad pero tiempos de respuesta muy altos.",
      color: "from-purple-500 to-pink-400",
      icon: "🧪",
      url: "https://ollama.com/library/phi3.5",
      available: false,
      spanishSupport: true,
      useCase: "Lógica y matemáticas",
      notAvailableReason: "Muy lento (>60s)"
    },
    {
      name: "Gemma 3 270M",
      id: "gemma3:270m",
      provider: "Google",
      size: "270M",
      time: "2.14s",
      successRate: 50,
      description: "Ultra-ligero pero capacidad limitada. No genera mejoras reales en bullets.",
      color: "from-orange-500 to-red-400",
      icon: "⚡",
      url: "https://ollama.com/library/gemma3",
      available: false,
      spanishSupport: true,
      useCase: "Solo pruebas básicas",
      notAvailableReason: "Calidad insuficiente"
    },
    {
      name: "Qwen 3 4B",
      id: "qwen3:4b",
      provider: "Alibaba",
      size: "4B",
      time: ">120s",
      successRate: 0,
      description: "Modelo grande con excelentes capacidades, pero requiere más recursos de servidor.",
      color: "from-emerald-600 to-teal-400",
      icon: "🐲",
      url: "https://ollama.com/library/qwen3",
      available: false,
      spanishSupport: true,
      useCase: "Alta capacidad",
      notAvailableReason: "Timeout en servidor"
    }
  ];

  const availableModels = models.filter(m => m.available);
  const unavailableModels = models.filter(m => !m.available);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-x-hidden pt-16 relative">

      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Floating Pixel Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Pixel stars */}
        <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-purple-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] left-[15%] w-1 h-1 bg-cyan-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[15%] left-[85%] w-2 h-2 bg-pink-500 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[40%] left-[92%] w-1 h-1 bg-yellow-400 opacity-60 animate-twinkle-delayed"></div>
        <div className="absolute top-[60%] left-[8%] w-1 h-1 bg-green-400 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[75%] left-[88%] w-2 h-2 bg-purple-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[85%] left-[25%] w-1 h-1 bg-cyan-300 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[50%] left-[3%] w-1 h-1 bg-pink-400 opacity-50 animate-twinkle-delayed"></div>

        {/* Floating retro icons */}
        <div className="absolute top-[8%] left-[10%] text-3xl opacity-20 animate-float-slow">👾</div>
        <div className="absolute top-[20%] right-[8%] text-2xl opacity-15 animate-float-medium">🎮</div>
        <div className="absolute top-[45%] left-[4%] text-2xl opacity-20 animate-float-delayed">🕹️</div>
        <div className="absolute top-[70%] right-[5%] text-3xl opacity-15 animate-float-slow">👻</div>
        <div className="absolute top-[88%] left-[12%] text-2xl opacity-20 animate-float-medium">🚀</div>
        <div className="absolute top-[35%] right-[3%] text-xl opacity-15 animate-float-delayed">⭐</div>
        <div className="absolute top-[55%] right-[12%] text-2xl opacity-10 animate-float-slow">🎯</div>
        <div className="absolute top-[92%] right-[15%] text-xl opacity-20 animate-float-medium">💎</div>
      </div>

      {/* Large Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[15vw] font-black opacity-[0.02] tracking-widest text-purple-500 select-none animate-pulse-slow">
          MODELS
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="fixed top-20 left-4 pointer-events-none opacity-30">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-500"></div>
            <div className="w-2 h-2 bg-purple-400"></div>
            <div className="w-2 h-2 bg-purple-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-400"></div>
            <div className="w-2 h-2 bg-transparent"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-300"></div>
          </div>
        </div>
      </div>
      <div className="fixed top-20 right-4 pointer-events-none opacity-30 rotate-90">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-500"></div>
            <div className="w-2 h-2 bg-cyan-400"></div>
            <div className="w-2 h-2 bg-cyan-300"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-400"></div>
            <div className="w-2 h-2 bg-transparent"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-300"></div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-12 space-y-4">
          {/* Glitch Title */}
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-purple-900 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] uppercase glitch-text" data-text="MODEL_LAB">
              MODEL_LAB
            </h1>
            {/* Decorative pixels around title */}
            <div className="absolute -top-2 -left-4 w-2 h-2 bg-cyan-400 animate-twinkle hidden md:block"></div>
            <div className="absolute -top-1 -right-3 w-1 h-1 bg-pink-400 animate-twinkle-delayed hidden md:block"></div>
            <div className="absolute -bottom-1 -left-2 w-1 h-1 bg-yellow-400 animate-twinkle hidden md:block"></div>
          </div>

          {/* Retro Status Bar */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-500/50 px-4 py-1 rounded-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className="text-purple-300 text-xs font-bold uppercase tracking-wider">System Online</span>
            </div>
            <div className="bg-gray-900/50 border border-gray-700 px-3 py-1 rounded-sm">
              <span className="text-gray-400 text-xs font-mono">v1.0.0</span>
            </div>
            <div className="bg-cyan-900/30 border border-cyan-700/50 px-3 py-1 rounded-sm">
              <span className="text-cyan-300 text-xs font-bold">24-DIC-2024</span>
            </div>
          </div>

          {/* Subtitle with pixel decorations */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="hidden md:flex gap-1">
              <div className="w-1 h-1 bg-purple-500"></div>
              <div className="w-1 h-1 bg-purple-400"></div>
              <div className="w-1 h-1 bg-purple-300"></div>
              <div className="w-2 h-1 bg-purple-200"></div>
            </div>
            <p className="text-gray-400 text-sm max-w-xl">
              Modelos IA probados para mejorar bullets de CV y generar análisis profesionales en español
            </p>
            <div className="hidden md:flex gap-1">
              <div className="w-2 h-1 bg-purple-200"></div>
              <div className="w-1 h-1 bg-purple-300"></div>
              <div className="w-1 h-1 bg-purple-400"></div>
              <div className="w-1 h-1 bg-purple-500"></div>
            </div>
          </div>
        </header>

        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 text-xs">
          <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-green-300">Disponible</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-500/50 px-3 py-1 rounded-full">
            <span>⭐</span>
            <span className="text-yellow-300">Recomendado</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900/30 border border-gray-500/50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            <span className="text-gray-400">No disponible</span>
          </div>
        </div>

        {/* Modelos Disponibles */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-green-900"></div>
            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              MODELOS_ACTIVOS ({availableModels.length})
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-green-900"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {availableModels.map((model, idx) => (
              <div key={idx} className="relative pt-4 flex flex-col">
                {/* Badge Recomendado - fuera del clipPath */}
                {model.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full z-20 flex items-center gap-1 shadow-lg">
                    ⭐ RECOMENDADO
                  </div>
                )}
                <div
                  className={`group bg-black border-2 ${model.recommended ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-green-900 hover:border-green-500'} transition-all duration-300 p-1 flex-1 flex flex-col`}
                  style={{ clipPath: 'polygon(0 5px, 5px 5px, 5px 0, calc(100% - 5px) 0, calc(100% - 5px) 5px, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 5px calc(100% - 5px), 0 calc(100% - 5px))' }}
              >

                <div className="bg-[#111] p-5 flex-1 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">{model.provider}</span>
                        <h3 className="text-lg font-bold mt-1 tracking-tight">{model.name}</h3>
                        <code className="text-[10px] text-gray-500">{model.id}</code>
                      </div>
                      <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{model.icon}</span>
                    </div>

                    <div className="space-y-3">
                      {/* Barra de éxito */}
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-gray-800 rounded-none overflow-hidden border border-gray-700">
                          <div
                            className={`h-full bg-gradient-to-r ${model.color} transition-all duration-1000 delay-300`}
                            style={{ width: `${model.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold w-10 text-right text-green-400">{model.successRate}%</span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-gray-900/50 p-2 border border-gray-800">
                          <p className="text-[9px] text-gray-500 uppercase font-bold">Latencia</p>
                          <p className="text-sm font-bold text-cyan-400">{model.time}</p>
                        </div>
                        <div className="bg-gray-900/50 p-2 border border-gray-800">
                          <p className="text-[9px] text-gray-500 uppercase font-bold">Params</p>
                          <p className="text-sm font-bold text-pink-400">{model.size}</p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1">
                        {model.spanishSupport && (
                          <span className="text-[9px] bg-blue-900/50 text-blue-300 px-2 py-0.5 border border-blue-800">🇪🇸 Español</span>
                        )}
                        <span className="text-[9px] bg-purple-900/50 text-purple-300 px-2 py-0.5 border border-purple-800">{model.useCase}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed border-l-2 border-green-900 pl-3">
                      {model.description}
                    </p>
                  </div>

                  <div className="pt-3 flex justify-between items-center border-t border-gray-800 mt-auto">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${i < model.successRate / 20 ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-800'}`}></div>
                      ))}
                    </div>
                    <a
                      href={model.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase font-black text-green-400 hover:text-white transition-colors flex items-center gap-1 group/btn"
                    >
                      Docs <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modelos No Disponibles */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-gray-800"></div>
            <h2 className="text-xl font-bold text-gray-500 flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
              OTROS_MODELOS ({unavailableModels.length})
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-gray-800"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-60 items-stretch">
            {unavailableModels.map((model, idx) => (
              <div key={idx} className="relative pt-4 flex flex-col">
                {/* Badge No Disponible - fuera del clipPath */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-700 text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-lg">
                  NO DISPONIBLE
                </div>
                <div
                  className="group bg-black border-2 border-gray-800 p-1 flex-1 flex flex-col"
                  style={{ clipPath: 'polygon(0 5px, 5px 5px, 5px 0, calc(100% - 5px) 0, calc(100% - 5px) 5px, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 5px calc(100% - 5px), 0 calc(100% - 5px))' }}
                >
                <div className="bg-[#0a0a0a] p-5 flex-1 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">{model.provider}</span>
                        <h3 className="text-lg font-bold mt-1 tracking-tight text-gray-400">{model.name}</h3>
                        <code className="text-[10px] text-gray-600">{model.id}</code>
                      </div>
                      <span className="text-3xl opacity-50">{model.icon}</span>
                    </div>

                    <div className="space-y-3">
                      {/* Barra de éxito */}
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-gray-900 rounded-none overflow-hidden border border-gray-800">
                          <div
                            className="h-full bg-gray-600 transition-all duration-1000 delay-300"
                            style={{ width: `${model.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold w-10 text-right text-gray-500">{model.successRate}%</span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-gray-900/30 p-2 border border-gray-800">
                          <p className="text-[9px] text-gray-600 uppercase font-bold">Latencia</p>
                          <p className="text-sm font-bold text-gray-500">{model.time}</p>
                        </div>
                        <div className="bg-gray-900/30 p-2 border border-gray-800">
                          <p className="text-[9px] text-gray-600 uppercase font-bold">Params</p>
                          <p className="text-sm font-bold text-gray-500">{model.size}</p>
                        </div>
                      </div>

                      {/* Razón de no disponibilidad */}
                      {model.notAvailableReason && (
                        <div className="bg-red-900/20 border border-red-900/50 px-2 py-1 text-center">
                          <span className="text-[9px] text-red-400">{model.notAvailableReason}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-600 leading-relaxed border-l-2 border-gray-800 pl-3">
                      {model.description}
                    </p>
                  </div>

                  <div className="pt-3 flex justify-between items-center border-t border-gray-800 mt-auto">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${i < model.successRate / 20 ? 'bg-gray-600' : 'bg-gray-900'}`}></div>
                      ))}
                    </div>
                    <a
                      href={model.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase font-black text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 group/btn"
                    >
                      Docs <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Performance Matrix */}
        <section className="mb-16 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-purple-900"></div>
            <h2 className="text-2xl font-bold italic tracking-tighter">BENCHMARK_RESULTS</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-purple-900"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-900/20 p-6 border border-purple-900/30 rounded-xl backdrop-blur-sm">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 animate-pulse"></span> Latencia (menor es mejor)
              </h3>
              <div className="space-y-3">
                {availableModels.sort((a, b) => parseFloat(a.time) - parseFloat(b.time)).map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-2">
                        {m.recommended && <span className="text-yellow-400">⭐</span>}
                        {m.name}
                      </span>
                      <span className="text-cyan-400">{m.time}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-sm">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-sm" style={{ width: `${Math.min((parseFloat(m.time) / 15) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 animate-pulse"></span> Tasa de Éxito JSON (mayor es mejor)
              </h3>
              <div className="space-y-3">
                {availableModels.sort((a, b) => b.successRate - a.successRate).map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-2">
                        {m.recommended && <span className="text-yellow-400">⭐</span>}
                        {m.name}
                      </span>
                      <span className="text-green-400">{m.successRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-sm">
                      <div className="h-full bg-gradient-to-r from-green-500 to-green-300 rounded-sm" style={{ width: `${m.successRate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Metodología */}
          <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-lg text-xs text-gray-400 space-y-2">
            <h4 className="font-bold text-gray-300 uppercase tracking-wider">Metodología del Benchmark</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>improve-bullets:</strong> Prueba de generación JSON válido para mejorar bullets de CV</li>
              <li><strong>review-cv:</strong> Prueba de generación de análisis en Markdown profesional en español</li>
              <li><strong>Consistencia:</strong> 3 intentos por modelo para medir estabilidad</li>
              <li><strong>Servidor:</strong> ollama.alexanderoviedofadul.dev (remoto)</li>
            </ul>
          </div>
        </section>

        {/* Retro Footer */}
        <footer className="text-center space-y-6 mt-8">
          {/* Pixel Art Divider */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-purple-600"></div>
              <div className="w-1 h-1 bg-purple-500"></div>
              <div className="w-1 h-1 bg-purple-400"></div>
            </div>
            <div className="w-16 h-[2px] bg-gradient-to-r from-purple-600 to-transparent"></div>
            <span className="text-purple-500 text-lg">👾</span>
            <div className="w-16 h-[2px] bg-gradient-to-l from-purple-600 to-transparent"></div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-purple-400"></div>
              <div className="w-1 h-1 bg-purple-500"></div>
              <div className="w-1 h-1 bg-purple-600"></div>
            </div>
          </div>

          {/* Arcade Style Message */}
          <div className="inline-block bg-gray-900/50 border border-gray-800 px-6 py-3 rounded-sm">
            <p className="text-xs text-gray-500 font-mono tracking-wider">
              <span className="text-cyan-400">$</span> ollama benchmark --models=4 --tests=3
            </p>
            <p className="text-[10px] text-gray-600 mt-1">
              Server: ollama.alexanderoviedofadul.dev
            </p>
          </div>

          {/* Credits */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
              POWERED BY OLLAMA
            </span>
            <span>|</span>
            <span>PIXELCV 2024</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              INSERT COIN TO CONTINUE
              <span className="animate-pulse">_</span>
            </span>
          </div>
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

        /* Twinkle animations for pixel stars */
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-twinkle-delayed {
          animation: twinkle 2.5s ease-in-out infinite 0.5s;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        /* Float animations for retro icons */
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float 6s ease-in-out infinite 1s;
        }
        .animate-float-delayed {
          animation: float 7s ease-in-out infinite 2s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(3deg); }
          50% { transform: translateY(-5px) rotate(-2deg); }
          75% { transform: translateY(-15px) rotate(2deg); }
        }

        /* Slow pulse for background text */
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }

        /* Glitch effect for title */
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -2px 0 #ff00ff;
          clip-path: inset(0 0 50% 0);
          animation: glitch-top 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: 2px 0 #00ffff;
          clip-path: inset(50% 0 0 0);
          animation: glitch-bottom 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch-top {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-2px, 1px); }
          94% { transform: translate(2px, -1px); }
          96% { transform: translate(-1px, 2px); }
          98% { transform: translate(1px, -2px); }
        }
        @keyframes glitch-bottom {
          0%, 90%, 100% { transform: translate(0); }
          91% { transform: translate(2px, 1px); }
          93% { transform: translate(-2px, -1px); }
          95% { transform: translate(1px, 2px); }
          97% { transform: translate(-1px, -2px); }
        }
      `}</style>
    </div>
  );
}
