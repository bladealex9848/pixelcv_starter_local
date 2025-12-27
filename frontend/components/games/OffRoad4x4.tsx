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
  maxSpeed: number;
  acceleration: number;
  friction: number;
}

interface GameState {
  vehicle: Vehicle;
  checkpoints: Position[];
  currentCheckpoint: number;
  gameOver: boolean;
  crashed: boolean;
  timeElapsed: number;
  distanceTraveled: number;
  completed: boolean;
}

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  position: Position;
  velocity: { vx: number; vy: number };
  timestamp: number;
  terrain_state: number[][];
  checkpoint_reached: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;
const CELL_SIZE = 20;
const CHECKPOINT_COUNT = 5;

export default function OffRoad4x4({ isAuthenticated, onGameEnd }: OffRoad4x4Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const gameStartTimeRef = useRef<number>(0);

  // Estados del juego
  const [gameState, setGameState] = useState<GameState>('menu' as any);
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);

  // Generar terreno aleatorio
  const generateTerrain = (): number[][] => {
    const terrain: number[][] = [];

    // 0 = camino fácil, 1 = terreno normal, 2 = obstáculo, 3 = checkpoint
    for (let y = 0; y < GRID_HEIGHT; y++) {
      terrain[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        // Bordes como obstáculos
        if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
          terrain[y][x] = 2; // Obstáculo
        } else {
          // Generar terreno aleatorio
          const rand = Math.random();
          if (rand < 0.3) {
            terrain[y][x] = 0; // Camino fácil
          } else if (rand < 0.7) {
            terrain[y][x] = 1; // Terreno normal
          } else {
            terrain[y][x] = 2; // Obstáculo
          }
        }
      }
    }

    return terrain;
  };

  // Generar checkpoints
  const generateCheckpoints = (): Position[] => {
    const checkpoints: Position[] = [];
    const usedPositions = new Set<string>();

    // Punto de inicio
    const startPos = { x: 2, y: 2 };
    checkpoints.push(startPos);
    usedPositions.add(`${startPos.x},${startPos.y}`);

    // Generar checkpoints en posiciones aleatorias
    for (let i = 1; i < CHECKPOINT_COUNT; i++) {
      let pos: Position;
      do {
        pos = {
          x: Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2,
          y: Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2
        };
      } while (usedPositions.has(`${pos.x},${pos.y}`));

      checkpoints.push(pos);
      usedPositions.add(`${pos.x},${pos.y}`);
    }

    return checkpoints;
  };

  // Crear nuevo juego
  const startNewGame = () => {
    const terrain = generateTerrain();
    const checkpoints = generateCheckpoints();

    setGameState({
      vehicle: {
        x: checkpoints[0].x * CELL_SIZE + CELL_SIZE / 2,
        y: checkpoints[0].y * CELL_SIZE + CELL_SIZE / 2,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
        maxSpeed: 5,
        acceleration: 0.3,
        friction: 0.95
      },
      checkpoints,
      currentCheckpoint: 1,
      gameOver: false,
      crashed: false,
      timeElapsed: 0,
      distanceTraveled: 0,
      completed: false
    });

    setGameStatus('playing');
    movesRef.current = [];
    gameStartTimeRef.current = Date.now();
  };

  // Verificar colisión con obstáculos
  const checkCollision = (x: number, y: number, terrain: number[][]): boolean => {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);

    if (cellX < 0 || cellX >= GRID_WIDTH || cellY < 0 || cellY >= GRID_HEIGHT) {
      return true;
    }

    return terrain[cellY][cellX] === 2;
  };

  // Verificar checkpoint alcanzado
  const checkCheckpoint = (vehicle: Vehicle, checkpoints: Position[], currentCheckpoint: number): number => {
    const cellX = Math.floor(vehicle.x / CELL_SIZE);
    const cellY = Math.floor(vehicle.y / CELL_SIZE);

    if (currentCheckpoint < checkpoints.length) {
      const checkpoint = checkpoints[currentCheckpoint];
      const distance = Math.sqrt(
        Math.pow(cellX - checkpoint.x, 2) + Math.pow(cellY - checkpoint.y, 2)
      );

      if (distance < 2) {
        return currentCheckpoint + 1;
      }
    }

    return currentCheckpoint;
  };

  // IA: calcular mejor dirección
  const getAIDirection = useCallback((state: GameState): { throttle: number; turn: number } => {
    const { vehicle, checkpoints, currentCheckpoint } = state;

    // Si no hay más checkpoints, detenerse
    if (currentCheckpoint >= checkpoints.length) {
      return { throttle: 0, turn: 0 };
    }

    const target = checkpoints[currentCheckpoint];
    const targetX = target.x * CELL_SIZE + CELL_SIZE / 2;
    const targetY = target.y * CELL_SIZE + CELL_SIZE / 2;

    // Calcular ángulo hacia el checkpoint
    const dx = targetX - vehicle.x;
    const dy = targetY - vehicle.y;
    const targetAngle = Math.atan2(dy, dx);

    // Calcular diferencia de ángulo
    let angleDiff = targetAngle - vehicle.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // A* Pathfinding simple: verificar obstáculos adelante
    const lookAhead = 3;
    const checkX = vehicle.x + Math.cos(vehicle.angle) * lookAhead * CELL_SIZE;
    const checkY = vehicle.y + Math.sin(vehicle.angle) * lookAhead * CELL_SIZE;

    // Recolectar movimiento de IA
    movesRef.current.push({
      position: { x: Math.floor(vehicle.x / CELL_SIZE), y: Math.floor(vehicle.y / CELL_SIZE) },
      velocity: { vx: vehicle.vx, vy: vehicle.vy },
      timestamp: Date.now() - gameStartTimeRef.current,
      terrain_state: generateTerrain(), // Simplified for now
      checkpoint_reached: currentCheckpoint
    });

    // Verificar si hay obstáculo adelante
    const terrain = generateTerrain();
    if (checkCollision(checkX, checkY, terrain)) {
      // Obstáculo adelante - girar
      return {
        throttle: 0.5,
        turn: angleDiff > 0 ? -1 : 1
      };
    }

    // Normal - dirigir hacia el checkpoint
    return {
      throttle: 1.0,
      turn: Math.max(-1, Math.min(1, angleDiff * 2))
    };
  }, []);

  // Actualizar física del vehículo
  const updateVehicle = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver || gameStatus !== 'playing') return prev;

      const newState = { ...prev };
      const vehicle = { ...newState.vehicle };

      // Obtener input del usuario o IA
      let throttle = 0;
      let turn = 0;

      if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) {
        throttle = 1;
      } else if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) {
        throttle = -0.5;
      }

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
        turn = -1;
      } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
        turn = 1;
      } else {
        // IA controla el vehículo
        const aiInput = getAIDirection(newState);
        throttle = aiInput.throttle;
        turn = aiInput.turn;
      }

      // Aplicar aceleración
      vehicle.speed += throttle * vehicle.acceleration;
      vehicle.speed = Math.max(-vehicle.maxSpeed / 2, Math.min(vehicle.maxSpeed, vehicle.speed));

      // Aplicar fricción
      vehicle.speed *= vehicle.friction;

      // Girar el vehículo
      vehicle.angle += turn * 0.05 * (vehicle.speed / vehicle.maxSpeed);

      // Actualizar posición
      vehicle.x += Math.cos(vehicle.angle) * vehicle.speed;
      vehicle.y += Math.sin(vehicle.angle) * vehicle.speed;

      // Verificar colisiones
      const terrain = generateTerrain();
      if (checkCollision(vehicle.x, vehicle.y, terrain)) {
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setGameStatus('ended');

        onGameEnd(newState.distanceTraveled, false, 0, gameTime, {
          training_data: {
            game_id: '4x4_offroad',
            moves_sequence: movesRef.current,
            final_terrain: terrain,
            checkpoints_reached: newState.currentCheckpoint,
            player_won: false
          }
        });

        return {
          ...newState,
          vehicle,
          gameOver: true,
          crashed: true
        };
      }

      // Verificar checkpoints
      const newCheckpoint = checkCheckpoint(vehicle, newState.checkpoints, newState.currentCheckpoint);

      // Actualizar distancia
      const distance = Math.sqrt(vehicle.vx * vehicle.vx + vehicle.vy * vehicle.vy);
      newState.distanceTraveled += distance;

      // Actualizar tiempo
      newState.timeElapsed = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

      // Verificar completado
      if (newCheckpoint >= newState.checkpoints.length) {
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setGameStatus('ended');

        onGameEnd(newState.distanceTraveled, true, 0, gameTime, {
          training_data: {
            game_id: '4x4_offroad',
            moves_sequence: movesRef.current,
            final_terrain: terrain,
            checkpoints_reached: newState.checkpoints.length,
            player_won: true,
            completion_time: gameTime
          }
        });

        return {
          ...newState,
          vehicle,
          gameOver: true,
          completed: true,
          currentCheckpoint: newCheckpoint
        };
      }

      return {
        ...newState,
        vehicle,
        currentCheckpoint: newCheckpoint
      };
    });
  }, [gameStatus, onGameEnd, getAIDirection]);

  // Manejar teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
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
  }, []);

  // Bucle del juego
  useEffect(() => {
    if (gameStatus === 'playing' && !gameState.gameOver) {
      const gameLoop = () => {
        updateVehicle();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);

      return () => {
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
        }
      };
    }
  }, [gameStatus, gameState.gameOver, updateVehicle]);

  // Renderizar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dibujar terreno
    const terrain = generateTerrain();
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = terrain[y][x];
        let color;

        switch (cell) {
          case 0:
            color = '#4ade80'; // Verde claro - camino fácil
            break;
          case 1:
            color = '#22c55e'; // Verde - terreno normal
            break;
          case 2:
            color = '#7c2d12'; // Marrón oscuro - obstáculo
            break;
          default:
            color = '#1a1a1a';
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Dibujar checkpoints
    gameState.checkpoints.forEach((checkpoint, index) => {
      if (index < gameState.currentCheckpoint) {
        ctx.fillStyle = '#fbbf24'; // Dorado - alcanzado
      } else if (index === gameState.currentCheckpoint) {
        ctx.fillStyle = '#f59e0b'; // Amarillo - actual
      } else {
        ctx.fillStyle = '#6b7280'; // Gris - futuro
      }

      ctx.fillRect(
        checkpoint.x * CELL_SIZE + 2,
        checkpoint.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );

      // Número del checkpoint
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        index.toString(),
        checkpoint.x * CELL_SIZE + CELL_SIZE / 2,
        checkpoint.y * CELL_SIZE + CELL_SIZE / 2
      );
    });

    // Dibujar vehículo
    ctx.save();
    ctx.translate(gameState.vehicle.x, gameState.vehicle.y);
    ctx.rotate(gameState.vehicle.angle);

    // Cuerpo del vehículo
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-10, -15, 20, 30);

    // Cabina
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-8, -10, 16, 15);

    ctx.restore();

    // Dibujar UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Checkpoint: ${gameState.currentCheckpoint}/${gameState.checkpoints.length}`, 10, 25);
    ctx.fillText(`Tiempo: ${gameState.timeElapsed}s`, 10, 45);
    ctx.fillText(`Distancia: ${Math.floor(gameState.distanceTraveled)}`, 10, 65);

    if (gameState.crashed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('¡CRASH!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameStatus === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">4x4 Off-Road</p>
          <p className="text-gray-400 text-sm">Completa el circuito evitando obstáculos</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Comenzar
          </button>
        </div>
      )}

      {gameStatus === 'playing' && (
        <div className="text-center space-y-2">
          <p className="text-orange-400">
            Checkpoint: {gameState.currentCheckpoint}/{gameState.checkpoints.length}
          </p>
          <p className="text-gray-500 text-xs">Tiempo: {gameState.timeElapsed}s</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1 bg-purple-900/30 border border-purple-500/50 px-2 py-0.5 rounded-sm">
              <span className="text-purple-400 text-[10px]">🤖 Pathfinding AI</span>
            </div>
          </div>
        </div>
      )}

      {gameStatus === 'ended' && (
        <div className="text-center space-y-4">
          <p className={gameState.completed ? 'text-green-400 text-xl' : 'text-red-400 text-xl'}>
            {gameState.completed ? '¡COMPLETADO!' : '¡CRASH!'}
          </p>
          <p className="text-gray-400 text-sm">
            Tiempo: {gameState.timeElapsed}s | Distancia: {Math.floor(gameState.distanceTraveled)}
          </p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Canvas */}
      {gameStatus !== 'menu' && (
        <div className="bg-black border-2 border-orange-900 p-4 rounded-lg">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block"
          />
        </div>
      )}

      {/* Instructions */}
      {gameStatus === 'menu' && (
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-xs text-center max-w-md">
            Usa las flechas o WASD para conducir. Llega a todos los checkpoints evitando obstáculos.
            ¡El 4x4 con IA te ayudará a encontrar el mejor camino!
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500"></div>
              <span className="text-gray-400 text-xs">Camino fácil</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600"></div>
              <span className="text-gray-400 text-xs">Terreno normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500"></div>
              <span className="text-gray-400 text-xs">Checkpoint</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-700"></div>
              <span className="text-gray-400 text-xs">Obstáculo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
