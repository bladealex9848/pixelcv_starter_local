"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface TronGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type CellType = 'EMPTY' | 'PLAYER_TRAIL' | 'AI_TRAIL';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  grid: CellType[][];
  playerPos: Position;
  aiPos: Position;
  playerDir: Direction;
  aiDir: Direction;
  gameOver: boolean;
  winner: 'player' | 'ai' | null;
  moves: number;
  survivalTime: number;
  collisions: number;
}

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  position: Position;
  direction: Direction;
  timestamp: number;
  grid_state: number[][];
  ai_position: Position;
}

const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 150; // ms entre movimientos

export default function TronGame({ isAuthenticated, onGameEnd }: TronGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(0);

  // Estados del juego
  const [gameState, setGameState] = useState<GameState>('menu' as any);
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);

  // Inicializar grid
  const initializeGrid = (): CellType[][] => {
    return Array(GRID_HEIGHT).fill(null).map(() =>
      Array(GRID_WIDTH).fill('EMPTY')
    );
  };

  // Posición inicial
  const getInitialPositions = () => {
    const midY = Math.floor(GRID_HEIGHT / 2);
    return {
      playerPos: { x: Math.floor(GRID_WIDTH * 0.25), y: midY },
      aiPos: { x: Math.floor(GRID_WIDTH * 0.75), y: midY }
    };
  };

  // Crear nuevo juego
  const startNewGame = () => {
    const { playerPos, aiPos } = getInitialPositions();
    const grid = initializeGrid();

    setGameState({
      grid,
      playerPos,
      aiPos,
      playerDir: 'RIGHT',
      aiDir: 'LEFT',
      gameOver: false,
      winner: null,
      moves: 0,
      survivalTime: 0,
      collisions: 0
    });

    setGameStatus('playing');
    movesRef.current = [];
    gameStartTimeRef.current = Date.now();
  };

  // Verificar colisión
  const checkCollision = (pos: Position, direction: Direction, grid: CellType[][]): Position | null => {
    let newPos = { ...pos };

    switch (direction) {
      case 'UP':
        newPos.y -= 1;
        break;
      case 'DOWN':
        newPos.y += 1;
        break;
      case 'LEFT':
        newPos.x -= 1;
        break;
      case 'RIGHT':
        newPos.x += 1;
        break;
    }

    // Verificar límites
    if (newPos.x < 0 || newPos.x >= GRID_WIDTH || newPos.y < 0 || newPos.y >= GRID_HEIGHT) {
      return null;
    }

    // Verificar colisión con trail
    if (grid[newPos.y][newPos.x] !== 'EMPTY') {
      return null;
    }

    return newPos;
  };

  // IA: calcular mejor dirección usando A* pathfinding
  const getAIDirection = useCallback((state: GameState): Direction => {
    const { playerPos, aiPos, grid } = state;

    // Verificar movimientos posibles
    const possibleMoves: { dir: Direction; newPos: Position | null }[] = [
      { dir: 'UP', newPos: checkCollision(aiPos, 'UP', grid) },
      { dir: 'DOWN', newPos: checkCollision(aiPos, 'DOWN', grid) },
      { dir: 'LEFT', newPos: checkCollision(aiPos, 'LEFT', grid) },
      { dir: 'RIGHT', newPos: checkCollision(aiPos, 'RIGHT', grid) }
    ].filter(move => move.newPos !== null);

    if (possibleMoves.length === 0) {
      // Sin movimientos posibles - continuar en la misma dirección
      return aiDir;
    }

    // Estrategia 1: Evitar al jugador si está cerca
    const distanceToPlayer = Math.abs(playerPos.x - aiPos.x) + Math.abs(playerPos.y - aiPos.y);

    if (distanceToPlayer < 5) {
      // Alejarse del jugador
      const awayFromPlayer = possibleMoves.reduce((best, move) => {
        const dist = Math.abs(playerPos.x - move.newPos!.x) + Math.abs(playerPos.y - move.newPos!.y);
        const bestDist = Math.abs(playerPos.x - best.newPos!.x) + Math.abs(playerPos.y - best.newPos!.y);
        return dist > bestDist ? move : best;
      });

      if (awayFromPlayer) {
        // Recolectar movimiento de IA
        movesRef.current.push({
          position: aiPos,
          direction: awayFromPlayer.dir,
          timestamp: Date.now() - gameStartTimeRef.current,
          grid_state: grid.map(row => row.map(cell =>
            cell === 'EMPTY' ? 0 : cell === 'PLAYER_TRAIL' ? 1 : 2
          )),
          ai_position: aiPos
        });
        return awayFromPlayer.dir;
      }
    }

    // Estrategia 2: Maximizar espacio disponible
    let bestMove = possibleMoves[0];
    let maxSpace = 0;

    for (const move of possibleMoves) {
      const space = calculateAvailableSpace(move.newPos!, grid, move.dir);
      if (space > maxSpace) {
        maxSpace = space;
        bestMove = move;
      }
    }

    // Recolectar movimiento de IA
    movesRef.current.push({
      position: aiPos,
      direction: bestMove.dir,
      timestamp: Date.now() - gameStartTimeRef.current,
      grid_state: grid.map(row => row.map(cell =>
        cell === 'EMPTY' ? 0 : cell === 'PLAYER_TRAIL' ? 1 : 2
      )),
      ai_position: aiPos
    });

    return bestMove.dir;
  }, []);

  // Calcular espacio disponible desde una posición
  const calculateAvailableSpace = (pos: Position, grid: CellType[][], direction: Direction): number => {
    const visited = new Set<string>();
    let space = 0;
    const queue: Position[] = [pos];

    while (queue.length > 0 && space < 100) { // Límite para performance
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      for (const dir of directions) {
        let nextPos = { ...current };

        switch (dir) {
          case 'UP':
            nextPos.y -= 1;
            break;
          case 'DOWN':
            nextPos.y += 1;
            break;
          case 'LEFT':
            nextPos.x -= 1;
            break;
          case 'RIGHT':
            nextPos.x += 1;
            break;
        }

        // Verificar límites y colisiones
        if (nextPos.x >= 0 && nextPos.x < GRID_WIDTH &&
            nextPos.y >= 0 && nextPos.y < GRID_HEIGHT &&
            grid[nextPos.y][nextPos.x] === 'EMPTY') {
          queue.push(nextPos);
          space++;
        }
      }
    }

    return space;
  };

  // Mover jugador
  const movePlayer = (direction: Direction) => {
    if (gameStatus !== 'playing' || gameState.gameOver) return;

    setGameState(prev => {
      if (prev.gameOver) return prev;

      const newPos = checkCollision(prev.playerPos, direction, prev.grid);

      if (!newPos) {
        // Colisión - jugador pierde
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setGameStatus('ended');

        onGameEnd(prev.survivalTime, false, prev.moves, gameTime, {
          training_data: {
            game_id: 'tron',
            moves_sequence: movesRef.current,
            final_board_state: prev.grid,
            survival_time: gameTime,
            player_won: false
          }
        });

        return { ...prev, gameOver: true, winner: 'ai' };
      }

      // Actualizar grid
      const newGrid = prev.grid.map(row => [...row]);
      newGrid[newPos.y][newPos.x] = 'PLAYER_TRAIL';

      return {
        ...prev,
        grid: newGrid,
        playerPos: newPos,
        playerDir: direction,
        moves: prev.moves + 1,
        survivalTime: Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
      };
    });
  };

  // Mover IA
  const moveAI = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver || gameStatus !== 'playing') return prev;

      const aiDirection = getAIDirection(prev);
      const newPos = checkCollision(prev.aiPos, aiDirection, prev.grid);

      if (!newPos) {
        // Colisión - IA pierde
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setGameStatus('ended');

        onGameEnd(prev.survivalTime, true, prev.moves, gameTime, {
          training_data: {
            game_id: 'tron',
            moves_sequence: movesRef.current,
            final_board_state: prev.grid,
            survival_time: gameTime,
            player_won: true
          }
        });

        return { ...prev, gameOver: true, winner: 'player' };
      }

      // Actualizar grid
      const newGrid = prev.grid.map(row => [...row]);
      newGrid[newPos.y][newPos.x] = 'AI_TRAIL';

      // Verificar colisión con jugador
      if (newPos.x === prev.playerPos.x && newPos.y === prev.playerPos.y) {
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setGameStatus('ended');

        onGameEnd(prev.survivalTime, false, prev.moves, gameTime, {
          training_data: {
            game_id: 'tron',
            moves_sequence: movesRef.current,
            final_board_state: prev.grid,
            survival_time: gameTime,
            player_won: false
          }
        });

        return { ...prev, gameOver: true, winner: 'ai', collisions: prev.collisions + 1 };
      }

      return {
        ...prev,
        grid: newGrid,
        aiPos: newPos,
        aiDir: aiDirection
      };
    });
  }, [getAIDirection, onGameEnd, gameStatus]);

  // Manejar teclas
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          movePlayer('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePlayer('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          movePlayer('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePlayer('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus]);

  // Bucle del juego
  useEffect(() => {
    if (gameStatus === 'playing' && !gameState.gameOver) {
      gameLoopRef.current = setInterval(() => {
        moveAI();
      }, GAME_SPEED);

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameStatus, gameState.gameOver, moveAI]);

  // Renderizar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);

    // Dibujar grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Dibujar trails
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = gameState.grid[y][x];
        if (cell !== 'EMPTY') {
          ctx.fillStyle = cell === 'PLAYER_TRAIL' ? '#f97316' : '#ef4444';
          ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        }
      }
    }

    // Dibujar jugadores
    if (gameState.playerPos) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(
        gameState.playerPos.x * CELL_SIZE + 2,
        gameState.playerPos.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    }

    if (gameState.aiPos) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(
        gameState.aiPos.x * CELL_SIZE + 2,
        gameState.aiPos.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    }
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameStatus === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Tron</p>
          <p className="text-gray-400 text-sm">Deja un trail y evita chocar con las paredes y trails</p>
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
          <p className="text-orange-400">Supervivencia: {gameState.survivalTime}s</p>
          <p className="text-gray-500 text-xs">Movimientos: {gameState.moves}</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1 bg-purple-900/30 border border-purple-500/50 px-2 py-0.5 rounded-sm">
              <span className="text-purple-400 text-[10px]">🤖 Pathfinding AI</span>
            </div>
          </div>
        </div>
      )}

      {gameStatus === 'ended' && (
        <div className="text-center space-y-4">
          <p className={gameState.winner === 'player' ? 'text-green-400 text-xl' : 'text-red-400 text-xl'}>
            {gameState.winner === 'player' ? '¡GANASTE!' : 'La IA ganó'}
          </p>
          <p className="text-gray-400 text-sm">Supervivencia: {gameState.survivalTime}s | Movimientos: {gameState.moves}</p>
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
            Usa las flechas del teclado para moverte. Deja un trail naranja y evita chocar con cualquier trail o pared.
            ¡El último en sobrevivir gana!
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500"></div>
              <span className="text-gray-400 text-xs">Tu trail</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500"></div>
              <span className="text-gray-400 text-xs">Trail de IA</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
