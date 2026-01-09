"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface PixelRaceProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

interface Enemy {
  z: number;
  lane: number;
  speed: number;
  color: string;
}

interface TrainingMove {
  timestamp: number;
  player_x: number;
  player_speed: number;
  player_lane: number;
  event_type?: 'lane_change' | 'accelerate' | 'decelerate' | 'collision' | 'checkpoint' | 'lap_complete';
}

// Constantes del juego
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const ROAD_WIDTH = 2000;
const SEGMENT_LENGTH = 200;
const CAMERA_DEPTH = 0.84;
const LANES = [-0.7, 0, 0.7]; // Izquierda, Centro, Derecha
const MAX_SPEED = 120;
const ACCELERATION = 30;
const BRAKING = -50;
const DECELERATION = -15;
const ENEMY_SPEED = 25;

// Colores estilo retro PixelCV
const COLORS = {
  sky: ['#1a1a2e', '#16213e'],
  grass: ['#1a5c3a', '#0f4c3a'],
  road: ['#3a3a3a', '#4a4a4a'],
  rumble: ['#cc0000', '#ffffff'],
  player: '#f97316',
  playerGlow: 'rgba(249, 115, 22, 0.5)',
  hud: 'rgba(0, 0, 0, 0.8)',
  hudBorder: '#f97316'
};

export default function PixelRace({ isAuthenticated, onGameEnd }: PixelRaceProps) {
  // Estados del juego
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [lap, setLap] = useState(1);
  const [position, setPosition] = useState(3);

  // Refs para el estado del juego
  const playerXRef = useRef(0);
  const playerZRef = useRef(0);
  const playerSpeedRef = useRef(0);
  const playerLaneRef = useRef(1); // 0=izq, 1=centro, 2=der
  const keysRef = useRef<Record<string, boolean>>({});
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Training data
  const gameEventsRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);
  const lastLapTimeRef = useRef<number>(0);

  // Enemigos
  const [enemies, setEnemies] = useState<Enemy[]>([
    { z: 500, lane: 0, speed: ENEMY_SPEED, color: '#ef4444' },
    { z: 1000, lane: 2, speed: ENEMY_SPEED, color: '#22c55e' },
    { z: 1500, lane: 1, speed: ENEMY_SPEED, color: '#3b82f6' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Proyección 3D pseudo-matemática
  const project = useCallback((worldX: number, worldY: number, worldZ: number) => {
    const cameraZ = playerZRef.current;
    const scale = CAMERA_DEPTH / (worldZ - cameraZ);
    const screenX = (CANVAS_WIDTH / 2) + (scale * worldX * CANVAS_WIDTH / 2);
    const screenY = (CANVAS_HEIGHT / 2) - (scale * worldY * CANVAS_HEIGHT / 2);
    const screenW = scale * ROAD_WIDTH * CANVAS_WIDTH / 2;
    return { screenX, screenY, screenW, scale };
  }, []);

  // Actualizar física del juego
  const update = useCallback((deltaTime: number) => {
    if (gameState !== 'playing') return;

    const keys = keysRef.current;

    // Aceleración / Freno
    if (keys['ArrowUp'] || keys['w']) {
      playerSpeedRef.current = Math.min(MAX_SPEED, playerSpeedRef.current + ACCELERATION * deltaTime);
    } else if (keys['ArrowDown'] || keys['s']) {
      playerSpeedRef.current = Math.max(0, playerSpeedRef.current + BRAKING * deltaTime);
    } else {
      playerSpeedRef.current = Math.max(0, playerSpeedRef.current + DECELERATION * deltaTime);
    }

    // Movimiento lateral (cambio de carril suave)
    const targetLaneX = LANES[playerLaneRef.current];
    const dx = targetLaneX - playerXRef.current;
    playerXRef.current += dx * 5 * deltaTime;

    // Mover hacia adelante
    const moveAmount = playerSpeedRef.current * deltaTime * 10;
    playerZRef.current += moveAmount;
    setDistance(playerZRef.current);
    setSpeed(Math.floor(playerSpeedRef.current));

    // Actualizar tiempo
    const currentTime = Date.now();
    setLapTime(currentTime - gameStartTimeRef.current);

    // Detectar colisiones con enemigos
    const playerLane = playerLaneRef.current;
    enemies.forEach(enemy => {
      // Calcular posición relativa del enemigo
      const relZ = ((enemy.z - playerZRef.current) % 6000 + 6000) % 6000;

      // Si el enemigo está cerca y en el mismo carril
      if (relZ < 100 && relZ > 0 && Math.abs(playerXRef.current - LANES[enemy.lane]) < 0.3) {
        // Colisión - reducir velocidad drásticamente
        playerSpeedRef.current = Math.min(playerSpeedRef.current, 15);

        // Registrar evento de colisión
        if (gameEventsRef.current.length < 5000) {
          const lastEvent = gameEventsRef.current[gameEventsRef.current.length - 1];
          if (!lastEvent || lastEvent.event_type !== 'collision' || currentTime - lastEvent.timestamp > 1000) {
            gameEventsRef.current.push({
              timestamp: currentTime - gameStartTimeRef.current,
              player_x: playerXRef.current,
              player_speed: playerSpeedRef.current,
              player_lane: playerLaneRef.current,
              event_type: 'collision'
            });
          }
        }
      }
    });

    // Actualizar enemigos
    setEnemies(prevEnemies => {
      return prevEnemies.map(enemy => {
        let newZ = enemy.z + ENEMY_SPEED * deltaTime * 10;

        // Cambio aleatorio de carril
        if (Math.random() < 0.002) {
          const newLane = Math.floor(Math.random() * 3);
          if (newLane !== enemy.lane) {
            // Registrar evento de entrenamiento cuando el enemigo cambia de carril
            if (gameEventsRef.current.length < 5000) {
              gameEventsRef.current.push({
                timestamp: currentTime - gameStartTimeRef.current,
                player_x: playerXRef.current,
                player_speed: playerSpeedRef.current,
                player_lane: playerLaneRef.current,
                event_type: 'lane_change'
              });
            }
            return { ...enemy, lane: newLane };
          }
        }

        // Respawn si se queda muy atrás
        const relZ = ((newZ - playerZRef.current) % 6000 + 6000) % 6000;
        if (relZ < 100 && playerSpeedRef.current < 50) {
          newZ = playerZRef.current + 2000;
        }

        return { ...enemy, z: newZ };
      });
    });

    // Calcular posición en carrera (basado en distancia)
    const totalDistance = playerZRef.current;
    const avgEnemyDistance = enemies.reduce((sum, e) => sum + e.z, 0) / enemies.length;
    const pos = Math.max(1, Math.min(4, Math.floor(4 - (playerZRef.current - avgEnemyDistance) / 1000) + 3));
    setPosition(pos);

  }, [gameState, enemies, setEnemies, setPosition]);

  // Renderizar el juego
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas con gradiente de cielo
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT / 2);
    skyGradient.addColorStop(0, COLORS.sky[0]);
    skyGradient.addColorStop(1, COLORS.sky[1]);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dibujar horizonte (pasto)
    ctx.fillStyle = COLORS.grass[0];
    ctx.fillRect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);

    // Función auxiliar para dibujar trapezoide (definida ANTES de drawSegment)
    const drawTrapezoid = (ctx: CanvasRenderingContext2D, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1 - w1 / 2, y1);
      ctx.lineTo(x1 + w1 / 2, y1);
      ctx.lineTo(x2 + w2 / 2, y2);
      ctx.lineTo(x2 - w2 / 2, y2);
      ctx.closePath();
      ctx.fill();
    };

    // Dibujar segmentos de carretera (efecto 3D pseudo)
    const drawSegment = (z: number, isEven: boolean) => {
      const worldX = playerXRef.current * ROAD_WIDTH;
      const { screenX, screenY, screenW } = project(-worldX, 0, z);

      if (screenY > CANVAS_HEIGHT) return null;

      const nextZ = z + SEGMENT_LENGTH;
      const { screenX: nextScreenX, screenY: nextScreenY, screenW: nextScreenW } = project(-worldX, 0, nextZ);

      const h = Math.max(1, nextScreenY - screenY);

      // Pasto a los lados
      ctx.fillStyle = isEven ? COLORS.grass[1] : COLORS.grass[0];
      ctx.fillRect(0, screenY, CANVAS_WIDTH, h);

      // Bordillo (rumble strip)
      const rumbleW1 = screenW * 1.15;
      const rumbleW2 = nextScreenW * 1.15;
      ctx.fillStyle = isEven ? COLORS.rumble[0] : COLORS.rumble[1];
      drawTrapezoid(ctx, screenX - rumbleW1, screenY, rumbleW1 * 2, nextScreenX - rumbleW2, nextScreenY, rumbleW2 * 2);

      // Carretera
      ctx.fillStyle = isEven ? COLORS.road[1] : COLORS.road[0];
      drawTrapezoid(ctx, screenX - screenW, screenY, screenW * 2, nextScreenX - nextScreenW, nextScreenY, nextScreenW * 2);

      // Líneas de carril (carriles)
      if (!isEven) {
        ctx.fillStyle = '#ffffff';
        // Línea izquierda
        drawTrapezoid(ctx, screenX - screenW * 0.33, screenY, screenW * 0.05, nextScreenX - nextScreenW * 0.33, nextScreenY, nextScreenW * 0.05);
        // Línea derecha
        drawTrapezoid(ctx, screenX + screenW * 0.28, screenY, screenW * 0.05, nextScreenX + nextScreenW * 0.28, nextScreenY, nextScreenW * 0.05);
      }

      return { screenX, screenY, screenW, nextScreenY };
    };

    // Dibujar carretera desde cerca hasta lejos
    const startSegment = Math.floor(playerZRef.current / SEGMENT_LENGTH);
    for (let i = 25; i >= 0; i--) {
      const segZ = (startSegment + i) * SEGMENT_LENGTH;
      const isEven = segZ % (SEGMENT_LENGTH * 2) === 0;
      drawSegment(segZ, isEven);
    }

    // Dibujar enemigos (de atrás hacia adelante para correcto z-ordering)
    const sortedEnemies = [...enemies].sort((a, b) => {
      const relA = ((a.z - playerZRef.current) % 6000 + 6000) % 6000;
      const relB = ((b.z - playerZRef.current) % 6000 + 6000) % 6000;
      return relB - relA;
    });

    sortedEnemies.forEach(enemy => {
      const relZ = ((enemy.z - playerZRef.current) % 6000 + 6000) % 6000;
      if (relZ > 50 && relZ < 2000) {
        const enemyScreenX = CANVAS_WIDTH / 2 + (LANES[enemy.lane] - playerXRef.current) * 200;
        const scale = 500 / relZ;
        const enemyW = 40 * scale;
        const enemyH = 25 * scale;
        const enemyY = CANVAS_HEIGHT / 2 + 100 - relZ * 0.3;

        // Sombra del enemigo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(enemyScreenX + 3, enemyY + 3, enemyW / 2, enemyH / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo del enemigo
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemyScreenX - enemyW / 2, enemyY - enemyH / 2, enemyW, enemyH);

        // Detalles del enemigo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(enemyScreenX - enemyW / 3, enemyY - enemyH / 3, enemyW / 2.5, enemyH / 1.5);
      }
    });

    // Dibujar coche del jugador
    const playerScreenX = CANVAS_WIDTH / 2;
    const playerScreenY = CANVAS_HEIGHT - 80;
    const playerW = 50;
    const playerH = 30;

    // Sombra del jugador
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(playerScreenX + 3, playerScreenY + 3, playerW / 2, playerH / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brillo/glow del jugador
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 15;

    // Cuerpo del jugador
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(playerScreenX - playerW / 2, playerScreenY - playerH / 2, playerW, playerH);

    // Parabrisas
    ctx.fillStyle = 'rgba(254, 215, 170, 0.8)';
    ctx.fillRect(playerScreenX - 15, playerScreenY - 10, 12, 20);
    ctx.fillRect(playerScreenX + 3, playerScreenY - 10, 12, 20);

    ctx.shadowBlur = 0;

    // Ruedas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(playerScreenX - 26, playerScreenY - 12, 5, 10);
    ctx.fillRect(playerScreenX + 21, playerScreenY - 12, 5, 10);
    ctx.fillRect(playerScreenX - 26, playerScreenY + 2, 5, 10);
    ctx.fillRect(playerScreenX + 21, playerScreenY + 2, 5, 10);

    // Renderizar HUD
    // Panel del HUD
    ctx.fillStyle = COLORS.hud;
    ctx.strokeStyle = COLORS.hudBorder;
    ctx.lineWidth = 2;
    ctx.fillRect(15, 15, 160, 90);
    ctx.strokeRect(15, 15, 160, 90);

    // Velocidad
    ctx.fillStyle = COLORS.player;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SPEED: ${speed}`, 25, 45);

    // Tiempo
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    const minutes = Math.floor(lapTime / 60000);
    const seconds = Math.floor((lapTime % 60000) / 1000);
    const ms = lapTime % 1000;
    ctx.fillText(`TIME: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, 25, 70);

    // Posición
    ctx.fillText(`POS: ${position}/4`, 25, 95);

    // Indicadores de carril
    const laneIndicatorY = CANVAS_HEIGHT - 30;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 50, laneIndicatorY - 15, 100, 30);

    [-1, 0, 1].forEach((offset, i) => {
      const isActive = playerLaneRef.current === i;
      ctx.fillStyle = isActive ? COLORS.player : '#333';
      ctx.fillRect(CANVAS_WIDTH / 2 - 40 + offset * 35, laneIndicatorY - 10, 30, 20);
    });

  }, [project, enemies, speed, lapTime, lap, position, setDistance, setPosition]);

  // Game loop
  useEffect(() => {
    let lastTime = Date.now();

    const loop = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      update(deltaTime);
      render();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [update, render]);

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;

      if (e.key === ' ' && gameState === 'menu') {
        setGameState('playing');
        gameStartTimeRef.current = Date.now();
        lastLapTimeRef.current = Date.now();
        gameEventsRef.current = [];
        playerZRef.current = 0;
        playerSpeedRef.current = 0;
        playerXRef.current = 0;
        playerLaneRef.current = 1;
      }

      if ((e.key === 'p' || e.key === 'P') && (gameState === 'playing' || gameState === 'paused')) {
        setGameState(gameState === 'playing' ? 'paused' : 'playing');
      }

      if (e.key === 'Escape' && gameState === 'playing') {
        endGame(false);
      }

      // Cambio de carril con A/D o flechas laterales
      if ((e.key === 'ArrowLeft' || e.key === 'a') && gameState === 'playing') {
        if (playerLaneRef.current > 0) {
          playerLaneRef.current--;

          // Registrar evento de entrenamiento
          if (gameEventsRef.current.length < 5000) {
            gameEventsRef.current.push({
              timestamp: Date.now() - gameStartTimeRef.current,
              player_x: playerXRef.current,
              player_speed: playerSpeedRef.current,
              player_lane: playerLaneRef.current,
              event_type: 'lane_change'
            });
          }
        }
      }

      if ((e.key === 'ArrowRight' || e.key === 'd') && gameState === 'playing') {
        if (playerLaneRef.current < 2) {
          playerLaneRef.current++;

          // Registrar evento de entrenamiento
          if (gameEventsRef.current.length < 5000) {
            gameEventsRef.current.push({
              timestamp: Date.now() - gameStartTimeRef.current,
              player_x: playerXRef.current,
              player_speed: playerSpeedRef.current,
              player_lane: playerLaneRef.current,
              event_type: 'lane_change'
            });
          }
        }
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Finalizar juego
  const endGame = useCallback((won: boolean) => {
    setGameState('ended');
    const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

    const score = 5 + (won ? 50 : 10) + Math.floor(distance / 100);

    onGameEnd(score, won, Math.floor(distance / 100), gameTime, {
      distance: Math.floor(distance),
      laps: lap,
      final_position: position,
      training_data: {
        game_id: 'pixel_race',
        moves_sequence: gameEventsRef.current,
        final_board_state: {
          distance: Math.floor(distance),
          time: lapTime,
          position: position
        },
        critical_moments: gameEventsRef.current.filter(e => e.event_type),
        player_won: won
      }
    });
  }, [distance, lap, lapTime, position, onGameEnd]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes}'${seconds.toString().padStart(2, '0')}"${millis.toString().padStart(3, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Menu Screen */}
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl font-black italic uppercase">Pixel Race</p>
          <p className="text-gray-400 text-sm">Carreras 3D Retro</p>
          <div className="space-y-2 text-xs text-gray-500">
            <p>Controles:</p>
            <p>↑/W - Acelerar | ↓/S - Frenar</p>
            <p>←/A - Carril izq | →/D - Carril der</p>
            <p>P - Pausa | ESC - Salir</p>
          </div>
          <button
            onClick={() => {
              setGameState('playing');
              gameStartTimeRef.current = Date.now();
              lastLapTimeRef.current = Date.now();
              gameEventsRef.current = [];
              playerZRef.current = 0;
              playerSpeedRef.current = 0;
              playerXRef.current = 0;
              playerLaneRef.current = 1;
            }}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 transition-colors uppercase text-sm"
          >
            Iniciar Carrera
          </button>
        </div>
      )}

      {/* Canvas - Only show when not in menu */}
      {gameState !== 'menu' && (
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-orange-900 max-w-full h-auto"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* Paused Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <p className="text-yellow-400 text-2xl font-bold mb-4">PAUSA</p>
            <p className="text-gray-400 text-sm">Presiona P para continuar</p>
            <button
              onClick={() => endGame(false)}
              className="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 transition-colors"
            >
              Rendirse
            </button>
          </div>
        </div>
      )}

      {/* Game Ended Overlay */}
      {gameState === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center space-y-4 bg-gray-900 p-8 border-2 border-orange-500 rounded-lg">
            <p className="text-orange-400 text-2xl font-bold">¡CARRERA COMPLETADA!</p>
            <div className="text-gray-400 text-sm space-y-1">
              <p>Distancia: {Math.floor(distance)}m</p>
              <p>Tiempo: {formatTime(lapTime)}</p>
              <p>Posición final: {position}/4</p>
              <p className="text-orange-300 mt-2">Puntos: 5 (base) + 10 (participación) + {Math.floor(distance / 100)} (distancia)</p>
            </div>
            <button
              onClick={() => {
                setGameState('menu');
                playerZRef.current = 0;
                playerSpeedRef.current = 0;
                playerXRef.current = 0;
                playerLaneRef.current = 1;
                setDistance(0);
                setSpeed(0);
                setLapTime(0);
                setLap(1);
                setPosition(3);
              }}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 transition-colors"
            >
              Nueva Carrera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
