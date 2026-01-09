"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface OffRoad4x4Props {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

interface Position {
  x: number;
  y: number;
}

interface Vehicle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
}

interface Checkpoint {
  x: number;
  y: number;
  reached: boolean;
}

interface TrainingMove {
  position: Position;
  velocity: { vx: number; vy: number };
  angle: number;
  speed: number;
  timestamp: number;
  event_type?: string;
}

// Configuración del juego
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;
const CELL_SIZE = 20;
const CHECKPOINT_COUNT = 5;
const CHECKPOINT_RADIUS = 25;

// Tipos de terreno
enum TerrainType {
  GRASS = 0,      // Normal
  DIRT = 1,       // Normal
  ROCK = 2,       // Colisión
  WATER = 3,      // Ralentiza
  SAND = 4,       // Derrape
}

// Colores del terreno
const TERRAIN_COLORS: Record<number, string> = {
  [TerrainType.GRASS]: '#2d5a27',      // Verde oscuro
  [TerrainType.DIRT]: '#5c4033',      // Marrón
  [TerrainType.ROCK]: '#6b7280',      // Gris
  [TerrainType.WATER]: '#1e40af',    // Azul
  [TerrainType.SAND]: '#d97706',     // Amarillo
};

// Fricción por tipo de terreno
const TERRAIN_FRICTION: Record<number, number> = {
  [TerrainType.GRASS]: 0.98,
  [TerrainType.DIRT]: 0.97,
  [TerrainType.WATER]: 0.85,  // Ralentiza más
  [TerrainType.SAND]: 0.92,   // Derrape
  [TerrainType.ROCK]: 0.95,
};

// Parámetros de física
const MAX_SPEED = 6;
const ACCELERATION = 0.25;
const TURN_RATE = 0.06;

export default function OffRoad4x4({ isAuthenticated, onGameEnd }: OffRoad4x4Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const gameStartTimeRef = useRef<number>(0);
  const gameEventsRef = useRef<TrainingMove[]>([]);

  // Estados del juego
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');
  const [terrain, setTerrain] = useState<number[][]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle>({ x: 0, y: 0, vx: 0, vy: 0, angle: 0, speed: 0 });
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [touchControls, setTouchControls] = useState({ throttle: 0, steering: 0 });

  // Generar terreno PERSISTENTE (solo una vez)
  const generateTerrain = useCallback((): number[][] => {
    const newTerrain: number[][] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      newTerrain[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        // Bordes como obstáculos
        if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
          newTerrain[y][x] = TerrainType.ROCK;
        } else {
          const rand = Math.random();
          if (rand < 0.4) {
            newTerrain[y][x] = TerrainType.GRASS;
          } else if (rand < 0.7) {
            newTerrain[y][x] = TerrainType.DIRT;
          } else if (rand < 0.85) {
            newTerrain[y][x] = TerrainType.SAND;
          } else if (rand < 0.95) {
            newTerrain[y][x] = TerrainType.WATER;
          } else {
            newTerrain[y][x] = TerrainType.ROCK;
          }
        }
      }
    }

    return newTerrain;
  }, []);

  // Generar checkpoints que eviten obstáculos
  const generateCheckpoints = useCallback((currentTerrain: number[][]): Checkpoint[] => {
    const newCheckpoints: Checkpoint[] = [];

    // Primer checkpoint cerca del inicio
    newCheckpoints.push({
      x: 3 * CELL_SIZE + CELL_SIZE / 2,
      y: 3 * CELL_SIZE + CELL_SIZE / 2,
      reached: false
    });

    // Generar el resto
    for (let i = 1; i < CHECKPOINT_COUNT; i++) {
      let attempts = 0;
      let valid = false;
      let pos: Position;

      while (!valid && attempts < 100) {
        pos = {
          x: Math.floor(Math.random() * (GRID_WIDTH - 6)) + 3,
          y: Math.floor(Math.random() * (GRID_HEIGHT - 6)) + 3
        };

        // Verificar que no es roca y está lejos del anterior
        const terrain = currentTerrain[pos.y][pos.x];
        const prevCheckpoint = newCheckpoints[i - 1];
        const distance = Math.sqrt(
          Math.pow(pos.x - prevCheckpoint.x / CELL_SIZE, 2) +
          Math.pow(pos.y - prevCheckpoint.y / CELL_SIZE, 2)
        );

        if (terrain !== TerrainType.ROCK && distance > 5) {
          valid = true;
        }
        attempts++;
      }

      newCheckpoints.push({
        x: (pos!.x * CELL_SIZE) + CELL_SIZE / 2,
        y: (pos!.y * CELL_SIZE) + CELL_SIZE / 2,
        reached: false
      });
    }

    return newCheckpoints;
  }, []);

  // Iniciar nuevo juego
  const startNewGame = useCallback(() => {
    const newTerrain = generateTerrain();
    const newCheckpoints = generateCheckpoints(newTerrain);
    const firstCheckpoint = newCheckpoints[0];

    setTerrain(newTerrain);
    setCheckpoints(newCheckpoints);
    setVehicle({
      x: firstCheckpoint.x,
      y: firstCheckpoint.y,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0
    });
    setCurrentCheckpoint(1);

    // Tiempo según dificultad
    const initialTime = difficulty === 'easy' ? 90 : difficulty === 'medium' ? 60 : 45;
    setTimeLeft(initialTime);
    setScore(0);

    gameEventsRef.current = [];
    gameStartTimeRef.current = Date.now();
    setGameStatus('playing');
  }, [difficulty, generateTerrain, generateCheckpoints]);

  // Actualizar física del vehículo
  const update = useCallback(() => {
    if (gameStatus !== 'playing') return;

    setVehicle(prev => {
      const newVehicle = { ...prev };

      // Input de teclado
      let throttle = 0;
      let steering = 0;

      if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) throttle = 1;
      else if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) throttle = -0.5;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) steering = -1;
      else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) steering = 1;

      // Input de touch (mobile)
      if (touchControls.throttle !== 0) throttle = touchControls.throttle;
      if (touchControls.steering !== 0) steering = touchControls.steering;

      // Obtener tipo de terreno actual
      const cellX = Math.floor(newVehicle.x / CELL_SIZE);
      const cellY = Math.floor(newVehicle.y / CELL_SIZE);
      const terrainType = terrain[cellY]?.[cellX] ?? TerrainType.ROCK;

      // Colisión con rocas
      if (terrainType === TerrainType.ROCK) {
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        const finalScore = calculateScore(false, currentCheckpoint, 0);

        setGameStatus('ended');
        setScore(finalScore);

        onGameEnd(finalScore, false, 0, gameTime, {
          training_data: {
            game_id: 'offroad_4x4',
            moves_sequence: gameEventsRef.current,
            final_position: { x: cellX, y: cellY },
            checkpoints_reached: currentCheckpoint,
            player_won: false
          }
        });

        return prev;
      }

      // Física arcade
      const friction = TERRAIN_FRICTION[terrainType] ?? 0.98;

      newVehicle.speed += throttle * ACCELERATION;
      newVehicle.speed *= friction;
      newVehicle.speed = Math.max(-MAX_SPEED / 2, Math.min(MAX_SPEED, newVehicle.speed));

      // Giro (solo si hay velocidad)
      if (Math.abs(newVehicle.speed) > 0.1) {
        const turnFactor = newVehicle.speed / MAX_SPEED;
        newVehicle.angle += steering * TURN_RATE * turnFactor;
      }

      // Actualizar posición
      newVehicle.vx = Math.cos(newVehicle.angle) * newVehicle.speed;
      newVehicle.vy = Math.sin(newVehicle.angle) * newVehicle.speed;
      newVehicle.x += newVehicle.vx;
      newVehicle.y += newVehicle.vy;

      // Mantener dentro de los límites
      newVehicle.x = Math.max(CELL_SIZE, Math.min(CANVAS_WIDTH - CELL_SIZE, newVehicle.x));
      newVehicle.y = Math.max(CELL_SIZE, Math.min(CANVAS_HEIGHT - CELL_SIZE, newVehicle.y));

      // Registrar movimiento para training data
      if (gameEventsRef.current.length < 5000) {
        gameEventsRef.current.push({
          position: { x: cellX, y: cellY },
          velocity: { vx: newVehicle.vx, vy: newVehicle.vy },
          angle: newVehicle.angle,
          speed: newVehicle.speed,
          timestamp: Date.now() - gameStartTimeRef.current,
          event_type: 'move'
        });
      }

      // Verificar checkpoint
      const targetCheckpoint = checkpoints[currentCheckpoint];
      if (targetCheckpoint) {
        const dx = newVehicle.x - targetCheckpoint.x;
        const dy = newVehicle.y - targetCheckpoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CHECKPOINT_RADIUS) {
          // Checkpoint alcanzado
          const newCheckpoint = currentCheckpoint + 1;

          if (newCheckpoint >= checkpoints.length) {
            // ¡Ganó!
            const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            const finalScore = calculateScore(true, checkpoints.length, timeLeft);

            setGameStatus('ended');
            setScore(finalScore);

            onGameEnd(finalScore, true, 0, gameTime, {
              training_data: {
                game_id: 'offroad_4x4',
                moves_sequence: gameEventsRef.current,
                final_position: { x: cellX, y: cellY },
                checkpoints_reached: checkpoints.length,
                player_won: true,
                completion_time: gameTime
              }
            });

            return prev;
          } else {
            setCurrentCheckpoint(newCheckpoint);
            setTimeLeft(prev => prev + 10); // +10 segundos por checkpoint
          }
        }
      }

      return newVehicle;
    });
  }, [gameStatus, terrain, checkpoints, currentCheckpoint, timeLeft, touchControls, onGameEnd]);

  // Actualizar tiempo
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Se acabó el tiempo
          const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
          const finalScore = calculateScore(false, currentCheckpoint, 0);

          setGameStatus('ended');
          setScore(finalScore);

          onGameEnd(finalScore, false, 0, gameTime, {
            training_data: {
              game_id: 'offroad_4x4',
              moves_sequence: gameEventsRef.current,
              final_position: { x: Math.floor(vehicle.x / CELL_SIZE), y: Math.floor(vehicle.y / CELL_SIZE) },
              checkpoints_reached: currentCheckpoint,
              player_won: false,
              time_out: true
            }
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, currentCheckpoint, vehicle, onGameEnd]);

  // Renderizar canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Renderizar terreno
    terrain.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx.fillStyle = TERRAIN_COLORS[cell] ?? '#0a0a0a';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });
    });

    // Renderizar checkpoints
    checkpoints.forEach((cp, i) => {
      const isCurrent = i === currentCheckpoint;
      const isReached = i < currentCheckpoint;

      if (!isReached) {
        // Glow para checkpoint actual
        if (isCurrent) {
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 20;
        }

        ctx.fillStyle = isCurrent ? '#f97316' : '#444';
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, CHECKPOINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Número
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), cp.x, cp.y);
      } else {
        // Checkpoint alcanzado - pequeño indicador
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Renderizar vehículo
    ctx.save();
    ctx.translate(vehicle.x, vehicle.y);
    ctx.rotate(vehicle.angle);

    // Cuerpo del vehículo con glow
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f97316';

    // Forma de camioneta 4x4
    ctx.beginPath();
    ctx.moveTo(18, 0);      // Frente
    ctx.lineTo(-12, -12);   // Izquierda
    ctx.lineTo(-12, 12);    // Derecha
    ctx.closePath();
    ctx.fill();

    // Cabina
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-8, -6, 12, 12);

    ctx.restore();
    ctx.shadowBlur = 0;

    // Renderizar HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 70);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 70);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Checkpoint: ${currentCheckpoint}/${checkpoints.length}`, 20, 32);
    ctx.fillText(`Tiempo: ${timeLeft}s`, 20, 52);
    ctx.fillText(`Puntos: ${score}`, 20, 72);
  }, [terrain, checkpoints, currentCheckpoint, vehicle, timeLeft, score]);

  // Game loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const loop = () => {
      update();
      render();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStatus, update, render]);

  // Manejar teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (gameStatus === 'playing') setGameStatus('paused');
        else if (gameStatus === 'paused') setGameStatus('playing');
        return;
      }

      keysRef.current.add(e.code);

      // Prevenir scroll con flechas
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus]);

  // Calcular puntuación
  const calculateScore = (won: boolean, checkpointsReached: number, timeLeft: number): number => {
    let finalScore = 5; // Base

    if (won) {
      finalScore += 50; // Victoria
      finalScore += timeLeft; // Bonus por tiempo
    } else {
      finalScore += 10; // Participación
      finalScore += checkpointsReached * 5; // Por checkpoint
    }

    return finalScore;
  };

  // Manejadores de touch para móvil
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dx = touch.clientX - rect.left - centerX;
    const dy = touch.clientY - rect.top - centerY;

    // Joystick virtual: arriba = acelerar, abajo = frenar, izquierda/derecha = girar
    const maxDist = 50;
    const clampedX = Math.max(-maxDist, Math.min(maxDist, dx));
    const clampedY = Math.max(-maxDist, Math.min(maxDist, dy));

    setTouchControls({
      throttle: -clampedY / maxDist, // Arriba (negativo) = acelerar
      steering: clampedX / maxDist
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dx = touch.clientX - rect.left - centerX;
    const dy = touch.clientY - rect.top - centerY;

    const maxDist = 50;
    const clampedX = Math.max(-maxDist, Math.min(maxDist, dx));
    const clampedY = Math.max(-maxDist, Math.min(maxDist, dy));

    setTouchControls({
      throttle: -clampedY / maxDist,
      steering: clampedX / maxDist
    });
  };

  const handleTouchEnd = () => {
    setTouchControls({ throttle: 0, steering: 0 });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Menú principal */}
      {gameStatus === 'menu' && (
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black italic text-orange-500 uppercase">4x4 Off-Road</h1>
          <p className="text-gray-400">Conduce por el terreno accidentado y alcanza todos los checkpoints</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setDifficulty('easy')}
              className={`px-4 py-2 font-bold transition-all ${difficulty === 'easy' ? 'bg-green-600' : 'bg-gray-700'}`}
            >
              Fácil (90s)
            </button>
            <button
              onClick={() => setDifficulty('medium')}
              className={`px-4 py-2 font-bold transition-all ${difficulty === 'medium' ? 'bg-yellow-600' : 'bg-gray-700'}`}
            >
              Medio (60s)
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={`px-4 py-2 font-bold transition-all ${difficulty === 'hard' ? 'bg-red-600' : 'bg-gray-700'}`}
            >
              Difícil (45s)
            </button>
          </div>

          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 uppercase transition-all"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Comenzar
          </button>

          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.GRASS] }}></div>
              <span className="text-gray-500">Hierba</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.DIRT] }}></div>
              <span className="text-gray-500">Tierra</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.SAND] }}></div>
              <span className="text-gray-500">Arena (derrapa)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.WATER] }}></div>
              <span className="text-gray-500">Agua (lento)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.ROCK] }}></div>
              <span className="text-gray-500">Roca (¡peligro!)</span>
            </div>
          </div>

          <p className="text-gray-600 text-xs">
            Controles: Flechas o WASD | Mobile: Toca y arrastra | P: Pausa
          </p>
        </div>
      )}

      {/* Pausa */}
      {gameStatus === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400 mb-4">PAUSA</p>
            <button
              onClick={() => setGameStatus('playing')}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Fin del juego */}
      {gameStatus === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center space-y-4">
            <p className={score > 50 ? 'text-4xl font-black text-green-400' : 'text-4xl font-black text-red-400'}>
              {score > 50 ? '¡COMPLETADO!' : 'CRASH O TIEMPO AGOTADO'}
            </p>
            <p className="text-gray-300">Puntuación: {score}</p>
            <p className="text-gray-400 text-sm">
              Checkpoints: {currentCheckpoint}/{checkpoints.length}
            </p>
            <button
              onClick={startNewGame}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      {gameStatus !== 'menu' && (
        <div className="bg-black border-2 border-orange-900 rounded-lg overflow-hidden relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block max-w-full h-auto"
            style={{ imageRendering: 'pixelated' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      )}
    </div>
  );
}
