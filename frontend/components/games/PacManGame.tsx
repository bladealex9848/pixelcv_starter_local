"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface PacManGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type CellType = 0 | 1 | 2 | 3 | 4 | 5; // 0=empty, 1=wall, 2=dot, 3=power_pellet, 4=ghost, 5=pacman

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  color: string;
  mode: 'chase' | 'scatter' | 'frightened' | 'eaten';
  direction: Direction;
  targetX: number;
  targetY: number;
  lastMoveTime: number;
}

interface GameState {
  grid: CellType[][];
  pacman: { x: number; y: number; direction: Direction; nextDirection: Direction };
  ghosts: Ghost[];
  score: number;
  lives: number;
  dotsEaten: number;
  powerPelletActive: boolean;
  powerPelletTimer: number;
  gameOver: boolean;
  won: boolean;
  timeElapsed: number;
}

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  position: Position;
  direction: Direction;
  timestamp: number;
  grid_state: number[][];
  ghost_positions: Position[];
  power_pellet_active: boolean;
}

const GRID_WIDTH = 28;
const GRID_HEIGHT = 31;
const CELL_SIZE = 20;
const PACMAN_SPEED = 150; // ms entre movimientos
const GHOST_SPEED = 200; // ms entre movimientos
const POWER_PELLET_DURATION = 8000; // 8 segundos

export default function PacManGame({ isAuthenticated, onGameEnd }: PacManGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);

  // Estados del juego
  const [gameState, setGameState] = useState<GameState>('menu' as any);
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);

  // Generar mapa del juego (simplificado)
  const generateMap = (): CellType[][] => {
    const grid: CellType[][] = Array(GRID_HEIGHT).fill(null).map(() =>
      Array(GRID_WIDTH).fill(0)
    );

    // Paredes exteriores
    for (let x = 0; x < GRID_WIDTH; x++) {
      grid[0][x] = 1;
      grid[GRID_HEIGHT - 1][x] = 1;
    }
    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y][0] = 1;
      grid[y][GRID_WIDTH - 1] = 1;
    }

    // Paredes internas (patrón simple)
    for (let x = 2; x < GRID_WIDTH - 2; x++) {
      grid[5][x] = 1;
      grid[GRID_HEIGHT - 6][x] = 1;
    }
    for (let y = 8; y < GRID_HEIGHT - 8; y++) {
      grid[y][5] = 1;
      grid[y][GRID_WIDTH - 6] = 1;
    }

    // Dots y power pellets
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
      for (let x = 1; x < GRID_WIDTH - 1; x++) {
        if (grid[y][x] === 0) {
          grid[y][x] = 2; // dot
        }
      }
    }

    // Power pellets en las esquinas
    grid[1][1] = 3;
    grid[1][GRID_WIDTH - 2] = 3;
    grid[GRID_HEIGHT - 2][1] = 3;
    grid[GRID_HEIGHT - 2][GRID_WIDTH - 2] = 3;

    // Posición inicial de Pac-Man
    grid[GRID_HEIGHT - 2][Math.floor(GRID_WIDTH / 2)] = 5;

    // Posiciones iniciales de fantasmas
    grid[8][Math.floor(GRID_WIDTH / 2)] = 4;
    grid[8][Math.floor(GRID_WIDTH / 2) - 2] = 4;
    grid[8][Math.floor(GRID_WIDTH / 2) + 2] = 4;

    return grid;
  };

  // Crear nuevo juego
  const startNewGame = () => {
    const grid = generateMap();

    setGameState({
      grid,
      pacman: {
        x: Math.floor(GRID_WIDTH / 2),
        y: GRID_HEIGHT - 2,
        direction: 'NONE',
        nextDirection: 'NONE'
      },
      ghosts: [
        {
          x: Math.floor(GRID_WIDTH / 2),
          y: 8,
          color: '#ff0000',
          mode: 'chase',
          direction: 'NONE',
          targetX: Math.floor(GRID_WIDTH / 2),
          targetY: 1,
          lastMoveTime: 0
        },
        {
          x: Math.floor(GRID_WIDTH / 2) - 2,
          y: 8,
          color: '#ff00ff',
          mode: 'chase',
          direction: 'NONE',
          targetX: 1,
          targetY: 1,
          lastMoveTime: 0
        },
        {
          x: Math.floor(GRID_WIDTH / 2) + 2,
          y: 8,
          color: '#00ffff',
          mode: 'chase',
          direction: 'NONE',
          targetX: GRID_WIDTH - 2,
          targetY: 1,
          lastMoveTime: 0
        }
      ],
      score: 0,
      lives: 3,
      dotsEaten: 0,
      powerPelletActive: false,
      powerPelletTimer: 0,
      gameOver: false,
      won: false,
      timeElapsed: 0
    });

    setGameStatus('playing');
    movesRef.current = [];
    gameStartTimeRef.current = Date.now();
  };

  // Verificar colisión con paredes
  const checkWall = (x: number, y: number, grid: CellType[][]): boolean => {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return true;
    }
    return grid[y][x] === 1;
  };

  // Mover Pac-Man
  const movePacman = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver || gameStatus !== 'playing') return prev;

      const newState = { ...prev };
      const pacman = { ...newState.pacman };

      // Cambiar dirección si es posible
      if (pacman.nextDirection !== 'NONE') {
        const nextX = pacman.x + (pacman.nextDirection === 'LEFT' ? -1 : pacman.nextDirection === 'RIGHT' ? 1 : 0);
        const nextY = pacman.y + (pacman.nextDirection === 'UP' ? -1 : pacman.nextDirection === 'DOWN' ? 1 : 0);
        if (!checkWall(nextX, nextY, newState.grid)) {
          pacman.direction = pacman.nextDirection;
        }
      }

      // Mover en la dirección actual
      if (pacman.direction !== 'NONE') {
        const newX = pacman.x + (pacman.direction === 'LEFT' ? -1 : pacman.direction === 'RIGHT' ? 1 : 0);
        const newY = pacman.y + (pacman.direction === 'UP' ? -1 : pacman.direction === 'DOWN' ? 1 : 0);

        if (!checkWall(newX, newY, newState.grid)) {
          pacman.x = newX;
          pacman.y = newY;

          // Comer dots
          if (newState.grid[newY][newX] === 2) {
            newState.grid[newY][newX] = 0;
            newState.score += 10;
            newState.dotsEaten += 1;
          }
          // Comer power pellets
          else if (newState.grid[newY][newX] === 3) {
            newState.grid[newY][newX] = 0;
            newState.score += 50;
            newState.powerPelletActive = true;
            newState.powerPelletTimer = POWER_PELLET_DURATION;
            // Cambiar fantasmas a modo frightened
            newState.ghosts = newState.ghosts.map(ghost => ({
              ...ghost,
              mode: 'frightened'
            }));
          }
        }
      }

      // Verificar victoria (todos los dots comidos)
      if (newState.dotsEaten >= (GRID_WIDTH * GRID_HEIGHT - 50)) { // Estimación
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setGameStatus('ended');

        onGameEnd(newState.score, true, newState.dotsEaten, gameTime, {
          training_data: {
            game_id: 'pacman',
            moves_sequence: movesRef.current,
            final_grid: newState.grid,
            dots_eaten: newState.dotsEaten,
            power_pellets_eaten: Math.floor(newState.score / 50),
            player_won: true
          }
        });

        return { ...newState, pacman, gameOver: true, won: true };
      }

      return { ...newState, pacman };
    });
  }, [gameStatus, onGameEnd]);

  // IA: calcular movimiento de fantasma
  const getGhostMove = useCallback((ghost: Ghost, pacman: any, grid: CellType[][], ghosts: Ghost[]): Direction => {
    const possibleMoves: Direction[] = [];
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    // Verificar movimientos posibles
    for (const dir of directions) {
      const dx = dir === 'LEFT' ? -1 : dir === 'RIGHT' ? 1 : 0;
      const dy = dir === 'UP' ? -1 : dir === 'DOWN' ? 1 : 0;
      const newX = ghost.x + dx;
      const newY = ghost.y + dy;

      if (!checkWall(newX, newY, grid)) {
        possibleMoves.push(dir);
      }
    }

    if (possibleMoves.length === 0) {
      return 'NONE';
    }

    // Estrategia según modo
    if (ghost.mode === 'frightened') {
      // Modo frightened - moverse aleatoriamente
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    // Modo chase o scatter - calcular mejor movimiento
    let bestMove = possibleMoves[0];
    let bestDistance = Infinity;

    for (const move of possibleMoves) {
      const dx = move === 'LEFT' ? -1 : move === 'RIGHT' ? 1 : 0;
      const dy = move === 'UP' ? -1 : move === 'DOWN' ? 1 : 0;
      const newX = ghost.x + dx;
      const newY = ghost.y + dy;

      let targetX, targetY;

      if (ghost.mode === 'chase') {
        // Perseguir a Pac-Man
        targetX = pacman.x;
        targetY = pacman.y;
      } else {
        // Scatter - ir a esquina
        if (ghost.color === '#ff0000') { // Rojo - esquina superior derecha
          targetX = GRID_WIDTH - 2;
          targetY = 1;
        } else if (ghost.color === '#ff00ff') { // Magenta - esquina superior izquierda
          targetX = 1;
          targetY = 1;
        } else { // Cian - esquina inferior derecha
          targetX = GRID_WIDTH - 2;
          targetY = GRID_HEIGHT - 2;
        }
      }

      const distance = Math.abs(newX - targetX) + Math.abs(newY - targetY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMove = move;
      }
    }

    return bestMove;
  }, []);

  // Mover fantasmas
  const moveGhosts = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver || gameStatus !== 'playing') return prev;

      const newState = { ...prev };
      const currentTime = Date.now();

      // Actualizar timer de power pellet
      if (newState.powerPelletActive) {
        newState.powerPelletTimer -= 100;
        if (newState.powerPelletTimer <= 0) {
          newState.powerPelletActive = false;
          // Cambiar fantasmas de vuelta a chase
          newState.ghosts = newState.ghosts.map(ghost => ({
            ...ghost,
            mode: ghost.mode === 'frightened' ? 'chase' : ghost.mode
          }));
        }
      }

      // Mover cada fantasma
      newState.ghosts = newState.ghosts.map(ghost => {
        if (currentTime - ghost.lastMoveTime < GHOST_SPEED) {
          return ghost;
        }

        const direction = getGhostMove(ghost, newState.pacman, newState.grid, newState.ghosts);
        let newX = ghost.x;
        let newY = ghost.y;

        if (direction === 'LEFT') newX -= 1;
        else if (direction === 'RIGHT') newX += 1;
        else if (direction === 'UP') newY -= 1;
        else if (direction === 'DOWN') newY += 1;

        // Verificar colisión con Pac-Man
        if (newX === newState.pacman.x && newY === newState.pacman.y) {
          if (ghost.mode === 'frightened') {
            // Pac-Man come al fantasma
            newState.score += 200;
            return {
              ...ghost,
              x: Math.floor(GRID_WIDTH / 2),
              y: 8,
              mode: 'eaten',
              direction,
              lastMoveTime: currentTime
            };
          } else {
            // Fantasma come a Pac-Man
            newState.lives -= 1;
            if (newState.lives <= 0) {
              const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
              setGameStatus('ended');

              onGameEnd(newState.score, false, newState.dotsEaten, gameTime, {
                training_data: {
                  game_id: 'pacman',
                  moves_sequence: movesRef.current,
                  final_grid: newState.grid,
                  dots_eaten: newState.dotsEaten,
                  power_pellets_eaten: Math.floor(newState.score / 50),
                  player_won: false
                }
              });

              return { ...ghost, gameOver: true };
            } else {
              // Reiniciar posiciones
              return {
                ...ghost,
                x: Math.floor(GRID_WIDTH / 2),
                y: 8,
                mode: 'chase',
                direction: 'NONE',
                lastMoveTime: currentTime
              };
            }
          }
        }

        return {
          ...ghost,
          x: newX,
          y: newY,
          direction,
          lastMoveTime: currentTime
        };
      });

      return newState;
    });
  }, [gameStatus, onGameEnd, getGhostMove]);

  // Manejar teclas
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing' || gameState.gameOver) return;

      const directions: { [key: string]: Direction } = {
        'ArrowUp': 'UP',
        'ArrowDown': 'DOWN',
        'ArrowLeft': 'LEFT',
        'ArrowRight': 'RIGHT',
        'KeyW': 'UP',
        'KeyS': 'DOWN',
        'KeyA': 'LEFT',
        'KeyD': 'RIGHT'
      };

      const direction = directions[e.code];
      if (direction) {
        setGameState(prev => ({
          ...prev,
          pacman: {
            ...prev.pacman,
            nextDirection: direction
          }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, gameState.gameOver]);

  // Bucle del juego
  useEffect(() => {
    if (gameStatus === 'playing' && !gameState.gameOver) {
      const gameLoop = () => {
        const currentTime = Date.now();

        if (currentTime - lastMoveTimeRef.current >= PACMAN_SPEED) {
          movePacman();
          moveGhosts();
          lastMoveTimeRef.current = currentTime;

          // Recolectar movimiento de Pac-Man
          movesRef.current.push({
            position: { x: gameState.pacman.x, y: gameState.pacman.y },
            direction: gameState.pacman.direction,
            timestamp: Date.now() - gameStartTimeRef.current,
            grid_state: gameState.grid.map(row => row.map(cell =>
              cell === 0 ? 0 : cell === 1 ? 1 : cell === 2 ? 2 : cell === 3 ? 3 : cell === 4 ? 4 : 5
            )),
            ghost_positions: gameState.ghosts.map(g => ({ x: g.x, y: g.y })),
            power_pellet_active: gameState.powerPelletActive
          });
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);

      return () => {
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
        }
      };
    }
  }, [gameStatus, gameState.gameOver, movePacman, moveGhosts]);

  // Renderizar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);

    // Dibujar grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = gameState.grid[y][x];

        if (cell === 1) {
          // Pared
          ctx.fillStyle = '#0000ff';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = '#0000ff';
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell === 2) {
          // Dot
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            3,
            0,
            2 * Math.PI
          );
          ctx.fill();
        } else if (cell === 3) {
          // Power pellet
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            8,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }
    }

    // Dibujar Pac-Man
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(
      gameState.pacman.x * CELL_SIZE + CELL_SIZE / 2,
      gameState.pacman.y * CELL_SIZE + CELL_SIZE / 2,
      8,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Dibujar fantasmas
    gameState.ghosts.forEach(ghost => {
      let color = ghost.color;
      if (ghost.mode === 'frightened') {
        color = '#0000ff';
      } else if (ghost.mode === 'eaten') {
        color = '#666666';
      }

      ctx.fillStyle = color;
      ctx.fillRect(
        ghost.x * CELL_SIZE + 2,
        ghost.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    });

    // Dibujar UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 20);
    ctx.fillText(`Lives: ${gameState.lives}`, 10, 40);
    ctx.fillText(`Dots: ${gameState.dotsEaten}`, 10, 60);

    if (gameState.powerPelletActive) {
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Power: ${Math.ceil(gameState.powerPelletTimer / 1000)}`, 10, 80);
    }

    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);

      ctx.fillStyle = gameState.won ? '#00ff00' : '#ff0000';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        gameState.won ? '¡WIN!' : 'GAME OVER',
        (GRID_WIDTH * CELL_SIZE) / 2,
        (GRID_HEIGHT * CELL_SIZE) / 2
      );
    }
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameStatus === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Pac-Man</p>
          <p className="text-gray-400 text-sm">Come todos los dots evitando a los fantasmas</p>
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
          <p className="text-orange-400">Score: {gameState.score}</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-500 text-xs">Lives: {gameState.lives}</p>
            <p className="text-gray-500 text-xs">Dots: {gameState.dotsEaten}</p>
            <div className="flex items-center gap-1 bg-purple-900/30 border border-purple-500/50 px-2 py-0.5 rounded-sm">
              <span className="text-purple-400 text-[10px]">🤖 Multi-Agent AI</span>
            </div>
          </div>
        </div>
      )}

      {gameStatus === 'ended' && (
        <div className="text-center space-y-4">
          <p className={gameState.won ? 'text-green-400 text-xl' : 'text-red-400 text-xl'}>
            {gameState.won ? '¡GANASTE!' : 'GAME OVER'}
          </p>
          <p className="text-gray-400 text-sm">Score: {gameState.score} | Dots: {gameState.dotsEaten}</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 transition-colors"
          >
            Jugar de nuevo
          </button>
        </div>
      )}

      {/* Canvas */}
      {gameStatus !== 'menu' && (
        <div className="bg-black border-2 border-orange-900 p-4 rounded-lg">
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            className="block"
          />
        </div>
      )}

      {/* Instructions */}
      {gameStatus === 'menu' && (
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-xs text-center max-w-md">
            Usa las flechas o WASD para moverte. Come todos los dots y power pellets.
            Los power pellets te permiten comer fantasmas temporalmente.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-400 text-xs">Dot (+10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full" style={{ fontSize: '10px' }}>●</div>
              <span className="text-gray-400 text-xs">Power Pellet (+50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500"></div>
              <span className="text-gray-400 text-xs">Fantasma</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
