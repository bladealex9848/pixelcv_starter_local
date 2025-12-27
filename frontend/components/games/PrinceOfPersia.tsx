"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface PrinceOfPersiaProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type TileType = 0 | 1 | 2 | 3 | 4 | 5; // 0=empty, 1=wall, 2=spike, 3=treasure, 4=enemy, 5=prince

interface Position {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 'left' | 'right';
  lives: number;
  health: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'guard' | 'skeleton';
  direction: number; // -1 left, 1 right
  state: 'patrol' | 'chase' | 'attack' | 'dead';
  health: number;
  lastAttackTime: number;
}

interface GameState {
  grid: TileType[][];
  width: number;
  height: number;
  player: Player;
  enemies: Enemy[];
  score: number;
  level: number;
  treasuresCollected: number;
  totalTreasures: number;
  gameOver: boolean;
  won: boolean;
  timeElapsed: number;
  keys: { [key: string]: boolean };
}

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  position: Position;
  timestamp: number;
  grid_state: number[][];
  enemy_positions: Position[];
  treasures_collected: number;
  health: number;
  action: 'jump' | 'move_left' | 'move_right' | 'idle' | 'attack';
}

const LEVELS = [
  // Level 1 - Tutorial
  [
    "111111111111111111",
    "1.................1",
    "1.................1",
    "1....3............1",
    "1.................1",
    "1.........1.......1",
    "1.........1.......1",
    "1.........1....4..1",
    "1.........1.......1",
    "1.................1",
    "1..2..............1",
    "1.................1",
    "1....1......1.....1",
    "1....1......1.....1",
    "1....1......1.....1",
    "1.................1",
    "1.................1",
    "1.................1",
    "111111111111111111",
  ],
  // Level 2 - More complex
  [
    "111111111111111111",
    "1.................1",
    "1....11111........1",
    "1....1...1....3...1",
    "1....1...1........1",
    "1....1...11111....1",
    "1..................1",
    "1..111111111.......1",
    "1..1........1......1",
    "1..1..4.....1...4..1",
    "1..1........1......1",
    "1..111111111.......1",
    "1..................1",
    "1....11111....111..1",
    "1....1...1....1....1",
    "1....1...1....1....1",
    "1....1...1....1....1",
    "1....2........2....1",
    "111111111111111111",
  ],
];

const CELL_SIZE = 32;

export default function PrinceOfPersia({ isAuthenticated, onGameEnd }: PrinceOfPersiaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const trainingDataRef = useRef<TrainingMove[]>([]);

  // Inicializar nivel
  const initLevel = useCallback((levelIndex: number) => {
    const levelMap = LEVELS[levelIndex];
    const height = levelMap.length;
    const width = levelMap[0].length;
    const grid: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(0));

    let playerStart: Position = { x: 1, y: 1 };
    const enemies: Enemy[] = [];
    let totalTreasures = 0;

    // Parse level map
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const char = levelMap[y][x];
        switch (char) {
          case '1':
            grid[y][x] = 1; // wall
            break;
          case '2':
            grid[y][x] = 0;
            playerStart = { x, y };
            break;
          case '3':
            grid[y][x] = 3; // treasure
            totalTreasures++;
            break;
          case '4':
            grid[y][x] = 4; // enemy
            enemies.push({
              x: x * CELL_SIZE,
              y: y * CELL_SIZE,
              vx: 0,
              vy: 0,
              type: 'guard',
              direction: Math.random() > 0.5 ? 1 : -1,
              state: 'patrol',
              health: 3,
              lastAttackTime: 0,
            });
            break;
          default:
            grid[y][x] = 0;
        }
      }
    }

    const initialState: GameState = {
      grid,
      width,
      height,
      player: {
        x: playerStart.x * CELL_SIZE,
        y: playerStart.y * CELL_SIZE,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 'right',
        lives: 3,
        health: 100,
      },
      enemies,
      score: 0,
      level: levelIndex + 1,
      treasuresCollected: 0,
      totalTreasures,
      gameOver: false,
      won: false,
      timeElapsed: 0,
      keys: {},
    };

    setGameState(initialState);
    trainingDataRef.current = [];
  }, []);

  // Detección de colisiones
  const checkCollision = useCallback((x: number, y: number, gameState: GameState): boolean => {
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    if (gridX < 0 || gridX >= gameState.width || gridY < 0 || gridY >= gameState.height) {
      return true;
    }

    return gameState.grid[gridY][gridX] === 1; // wall
  }, []);

  // Detectar colisiones con spikes
  const checkSpikeCollision = useCallback((x: number, y: number, gameState: GameState): boolean => {
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    if (gridX < 0 || gridX >= gameState.width || gridY < 0 || gridY >= gameState.height) {
      return false;
    }

    return gameState.grid[gridY][gridX] === 2; // spike
  }, []);

  // Actualizar player
  const updatePlayer = useCallback((deltaTime: number, gameState: GameState): GameState => {
    const newState = { ...gameState };
    const player = { ...newState.player };

    // Física - gravedad
    player.vy += 0.5 * deltaTime;

    // Movimiento horizontal
    if (newState.keys['ArrowLeft'] || newState.keys['a']) {
      player.vx = -5;
      player.facing = 'left';
    } else if (newState.keys['ArrowRight'] || newState.keys['d']) {
      player.vx = 5;
      player.facing = 'right';
    } else {
      player.vx *= 0.8; // fricción
    }

    // Salto
    if ((newState.keys['ArrowUp'] || newState.keys['w'] || newState.keys[' ']) && player.onGround) {
      player.vy = -15;
      player.onGround = false;
    }

    // Actualizar posición
    const newX = player.x + player.vx;
    const newY = player.y + player.vy;

    // Verificar colisiones horizontales
    if (!checkCollision(newX, player.y, newState)) {
      player.x = newX;
    } else {
      player.vx = 0;
    }

    // Verificar colisiones verticales
    if (!checkCollision(player.x, newY, newState)) {
      player.y = newY;
      player.onGround = false;
    } else {
      // Colisión - verificar si es con el suelo
      if (player.vy > 0) {
        player.onGround = true;
      }
      player.vy = 0;
    }

    // Verificar spikes
    if (checkSpikeCollision(player.x, player.y, newState)) {
      player.health -= 1;
      player.x = player.x;
      player.y = player.y;
    }

    // Verificar tesoro
    const gridX = Math.floor(player.x / CELL_SIZE);
    const gridY = Math.floor(player.y / CELL_SIZE);
    if (newState.grid[gridY] && newState.grid[gridY][gridX] === 3) {
      newState.grid[gridY][gridX] = 0;
      newState.treasuresCollected++;
      newState.score += 100;
    }

    // Verificar enemigos
    newState.enemies.forEach((enemy, index) => {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30 && enemy.state !== 'dead') {
        if (Date.now() - enemy.lastAttackTime > 1000) {
          player.health -= 10;
          enemy.lastAttackTime = Date.now();
        }
      }
    });

    newState.player = player;

    // Verificar game over
    if (player.health <= 0) {
      player.lives--;
      if (player.lives <= 0) {
        newState.gameOver = true;
      } else {
        // Reiniciar posición
        player.health = 100;
        player.x = CELL_SIZE;
        player.y = CELL_SIZE;
      }
    }

    // Verificar victoria
    if (newState.treasuresCollected >= newState.totalTreasures) {
      if (currentLevel < LEVELS.length - 1) {
        setCurrentLevel(prev => prev + 1);
        initLevel(currentLevel + 1);
      } else {
        newState.won = true;
        newState.gameOver = true;
      }
    }

    return newState;
  }, [checkCollision, checkSpikeCollision, currentLevel, initLevel]);

  // Actualizar enemigos con IA simple
  const updateEnemies = useCallback((deltaTime: number, gameState: GameState): GameState => {
    const newState = { ...gameState };
    const player = newState.player;

    newState.enemies.forEach(enemy => {
      if (enemy.state === 'dead') return;

      // IA simple: patrullar o perseguir al jugador
      const dx = player.x - enemy.x;
      const dy = Math.abs(player.y - enemy.y);

      if (Math.abs(dx) < 200 && dy < 50) {
        enemy.state = 'chase';
        enemy.direction = dx > 0 ? 1 : -1;
      } else {
        enemy.state = 'patrol';
      }

      // Movimiento
      enemy.vx = enemy.direction * 2;

      // Aplicar gravedad
      enemy.vy += 0.5 * deltaTime;

      // Actualizar posición
      const newX = enemy.x + enemy.vx;
      const newY = enemy.y + enemy.vy;

      // Verificar colisiones
      if (!checkCollision(newX, enemy.y, newState)) {
        enemy.x = newX;
      } else {
        enemy.direction *= -1; // Cambiar dirección al chocar
      }

      if (!checkCollision(enemy.x, newY, newState)) {
        enemy.y = newY;
      } else {
        enemy.vy = 0;
      }

      // Verificar si cae en spikes
      if (checkSpikeCollision(enemy.x, enemy.y, newState)) {
        enemy.state = 'dead';
      }
    });

    return newState;
  }, [checkCollision, checkSpikeCollision]);

  // Recolectar datos de entrenamiento
  const collectTrainingData = useCallback((gameState: GameState, action: TrainingMove['action']) => {
    const move: TrainingMove = {
      position: { x: gameState.player.x, y: gameState.player.y },
      timestamp: Date.now(),
      grid_state: gameState.grid.map(row => row.map(cell => cell)),
      enemy_positions: gameState.enemies.map(e => ({ x: e.x, y: e.y })),
      treasures_collected: gameState.treasuresCollected,
      health: gameState.player.health,
      action,
    };
    trainingDataRef.current.push(move);
  }, []);

  // Loop principal del juego
  const gameLoop = useCallback((currentTime: number) => {
    if (!gameState || gameState.gameOver) return;

    const deltaTime = Math.min(currentTime - lastTimeRef.current, 50);
    lastTimeRef.current = currentTime;

    let newState = updatePlayer(deltaTime, gameState);
    newState = updateEnemies(deltaTime, newState);

    // Actualizar tiempo
    newState.timeElapsed = (Date.now() - gameStartTimeRef.current) / 1000;

    // Recolectar datos de entrenamiento cada 100ms
    if (currentTime % 100 < deltaTime) {
      const action: TrainingMove['action'] = newState.keys[' '] || newState.keys['ArrowUp'] || newState.keys['w']
        ? 'jump'
        : newState.keys['ArrowLeft'] || newState.keys['a']
        ? 'move_left'
        : newState.keys['ArrowRight'] || newState.keys['d']
        ? 'move_right'
        : 'idle';
      collectTrainingData(newState, action);
    }

    setGameState(newState);
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updatePlayer, updateEnemies, collectTrainingData]);

  // Renderizar
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderizar tiles
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        const tile = gameState.grid[y][x];
        const drawX = x * CELL_SIZE;
        const drawY = y * CELL_SIZE;

        switch (tile) {
          case 1: // wall
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#654321';
            ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
            break;
          case 2: // spike
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(drawX, drawY + CELL_SIZE);
            ctx.lineTo(drawX + CELL_SIZE / 2, drawY);
            ctx.lineTo(drawX + CELL_SIZE, drawY + CELL_SIZE);
            ctx.closePath();
            ctx.fill();
            break;
          case 3: // treasure
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(drawX + CELL_SIZE / 2, drawY + CELL_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.stroke();
            break;
        }
      }
    }

    // Renderizar player
    const player = gameState.player;
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x, player.y, CELL_SIZE, CELL_SIZE);
    // Cara del príncipe
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 8, player.y + 8, 4, 4);

    // Renderizar enemigos
    gameState.enemies.forEach(enemy => {
      if (enemy.state === 'dead') return;

      ctx.fillStyle = enemy.type === 'guard' ? '#8B0000' : '#800080';
      ctx.fillRect(enemy.x, enemy.y, CELL_SIZE, CELL_SIZE);

      // Estado del enemigo
      if (enemy.state === 'chase') {
        ctx.strokeStyle = '#FF0000';
        ctx.strokeRect(enemy.x - 2, enemy.y - 2, CELL_SIZE + 4, CELL_SIZE + 4);
      }
    });

    // UI
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    ctx.fillText(`Level: ${gameState.level}`, 10, 20);
    ctx.fillText(`Lives: ${player.lives}`, 10, 40);
    ctx.fillText(`Health: ${player.health}`, 10, 60);
    ctx.fillText(`Treasures: ${gameState.treasuresCollected}/${gameState.totalTreasures}`, 10, 80);
    ctx.fillText(`Score: ${gameState.score}`, 10, 100);
  }, [gameState]);

  // Iniciar juego
  const startGame = useCallback(() => {
    setGameStarted(true);
    gameStartTimeRef.current = Date.now();
    lastTimeRef.current = Date.now();
    initLevel(currentLevel);
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [currentLevel, initLevel, gameLoop]);

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState) {
        setGameState(prev => prev ? { ...prev, keys: { ...prev.keys, [e.key]: true } } : null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState) {
        setGameState(prev => prev ? { ...prev, keys: { ...prev.keys, [e.key]: false } } : null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Loop de renderizado
  useEffect(() => {
    if (gameState && !gameState.gameOver) {
      render();
    }
  }, [gameState, render]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Game end
  useEffect(() => {
    if (gameState?.gameOver) {
      const gameData = {
        level_reached: gameState.level,
        treasures_collected: gameState.treasuresCollected,
        total_treasures: gameState.totalTreasures,
        moves_sequence: trainingDataRef.current,
        enemy_defeated: gameState.enemies.filter(e => e.state === 'dead').length,
      };

      onGameEnd(
        gameState.score,
        gameState.won,
        gameState.timeElapsed,
        Math.floor(gameState.timeElapsed),
        gameData
      );
    }
  }, [gameState?.gameOver, gameState?.won, gameState?.score, gameState?.level, gameState?.treasuresCollected, gameState?.totalTreasures, gameState?.enemies, onGameEnd]);

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white">
        <h2 className="text-4xl font-bold mb-4 text-orange-400">👑 Príncipe de Persia</h2>
        <p className="text-gray-300 mb-6 text-center max-w-md">
          Recorre los niveles, evita las trampas, derrota a los guardias y recolecta todos los tesoros.
        </p>
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h3 className="text-orange-400 font-bold mb-3">Controles:</h3>
          <ul className="text-sm space-y-1">
            <li>← → o A D: Mover</li>
            <li>↑ o W o Espacio: Saltar</li>
          </ul>
        </div>
        <button
          onClick={startGame}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 transition-colors"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          Iniciar Aventura
        </button>
      </div>
    );
  }

  if (gameState?.gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white">
        <h2 className="text-4xl font-bold mb-4 text-orange-400">
          {gameState.won ? '¡Victoria!' : 'Game Over'}
        </h2>
        <p className="text-gray-300 mb-2">Puntuación: {gameState.score}</p>
        <p className="text-gray-300 mb-2">Nivel alcanzado: {gameState.level}</p>
        <p className="text-gray-300 mb-2">Tesoros: {gameState.treasuresCollected}/{gameState.totalTreasures}</p>
        <p className="text-gray-300 mb-6">Tiempo: {Math.floor(gameState.timeElapsed)}s</p>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setCurrentLevel(0);
              setGameStarted(false);
              setGameState(null);
            }}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Jugar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={608}
        height={608}
        className="border-2 border-orange-900 bg-black"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
