"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface RTSGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type EntityType = 'base' | 'worker' | 'soldier' | 'resource';

interface Position {
  x: number;
  y: number;
}

interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  owner: 'player' | 'ai';
  state: 'idle' | 'moving' | 'gathering' | 'attacking' | 'building';
  targetX?: number;
  targetY?: number;
  targetId?: string;
  attackPower: number;
  defense: number;
  gatherRate: number;
}

interface Resources {
  gold: number;
  stone: number;
  wood: number;
}

interface GameState {
  grid: number[][];
  width: number;
  height: number;
  entities: Entity[];
  playerResources: Resources;
  aiResources: Resources;
  selectedEntityId: string | null;
  territories: { [key: string]: number }; // territory_id -> owner
  gamePhase: 'early' | 'mid' | 'late';
  score: number;
  gameOver: boolean;
  won: boolean;
  timeElapsed: number;
  keys: { [key: string]: boolean };
}

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  timestamp: number;
  action: 'build' | 'move' | 'attack' | 'gather';
  entity_id: string;
  position: Position;
  resources: Resources;
  territories_control: number;
  enemy_positions: Position[];
}

const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const CELL_SIZE = 32;
const INITIAL_RESOURCES = { gold: 500, stone: 300, wood: 400 };

const BUILDING_COSTS = {
  base: { gold: 0, stone: 0, wood: 0 },
  worker: { gold: 50, stone: 0, wood: 100 },
  soldier: { gold: 100, stone: 50, wood: 75 },
};

const ENTITY_STATS = {
  base: { health: 500, attackPower: 0, defense: 10, gatherRate: 0 },
  worker: { health: 40, attackPower: 5, defense: 2, gatherRate: 2 },
  soldier: { health: 80, attackPower: 15, defense: 8, gatherRate: 0 },
};

export default function RTSGame({ isAuthenticated, onGameEnd }: RTSGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const trainingDataRef = useRef<TrainingMove[]>([]);

  // Generar mapa aleatorio
  const generateMap = useCallback((): number[][] => {
    const grid: number[][] = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(0));

    // Recursos aleatorios
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * GRID_WIDTH);
      const y = Math.floor(Math.random() * GRID_HEIGHT);
      if (grid[y][x] === 0) {
        grid[y][x] = Math.random() > 0.5 ? 2 : 3; // 2=oro, 3=piedra
      }
    }

    // Base del jugador (esquina inferior izquierda)
    grid[GRID_HEIGHT - 2][2] = 1; // 1=obstaculo/base
    // Base de la IA (esquina superior derecha)
    grid[1][GRID_WIDTH - 3] = 1;

    return grid;
  }, []);

  // Inicializar juego
  const initGame = useCallback(() => {
    const grid = generateMap();

    const entities: Entity[] = [
      // Base del jugador
      {
        id: 'player_base',
        type: 'base',
        x: 2 * CELL_SIZE,
        y: (GRID_HEIGHT - 2) * CELL_SIZE,
        health: ENTITY_STATS.base.health,
        maxHealth: ENTITY_STATS.base.health,
        owner: 'player',
        state: 'idle',
        attackPower: ENTITY_STATS.base.attackPower,
        defense: ENTITY_STATS.base.defense,
        gatherRate: ENTITY_STATS.base.gatherRate,
      },
      // Workers iniciales
      {
        id: 'worker_1',
        type: 'worker',
        x: 3 * CELL_SIZE,
        y: (GRID_HEIGHT - 2) * CELL_SIZE,
        health: ENTITY_STATS.worker.health,
        maxHealth: ENTITY_STATS.worker.health,
        owner: 'player',
        state: 'idle',
        attackPower: ENTITY_STATS.worker.attackPower,
        defense: ENTITY_STATS.worker.defense,
        gatherRate: ENTITY_STATS.worker.gatherRate,
      },
      {
        id: 'worker_2',
        type: 'worker',
        x: 4 * CELL_SIZE,
        y: (GRID_HEIGHT - 2) * CELL_SIZE,
        health: ENTITY_STATS.worker.health,
        maxHealth: ENTITY_STATS.worker.health,
        owner: 'player',
        state: 'idle',
        attackPower: ENTITY_STATS.worker.attackPower,
        defense: ENTITY_STATS.worker.defense,
        gatherRate: ENTITY_STATS.worker.gatherRate,
      },
      // Base de la IA
      {
        id: 'ai_base',
        type: 'base',
        x: (GRID_WIDTH - 3) * CELL_SIZE,
        y: 1 * CELL_SIZE,
        health: ENTITY_STATS.base.health,
        maxHealth: ENTITY_STATS.base.health,
        owner: 'ai',
        state: 'idle',
        attackPower: ENTITY_STATS.base.attackPower,
        defense: ENTITY_STATS.base.defense,
        gatherRate: ENTITY_STATS.base.gatherRate,
      },
      {
        id: 'ai_worker_1',
        type: 'worker',
        x: (GRID_WIDTH - 4) * CELL_SIZE,
        y: 1 * CELL_SIZE,
        health: ENTITY_STATS.worker.health,
        maxHealth: ENTITY_STATS.worker.health,
        owner: 'ai',
        state: 'idle',
        attackPower: ENTITY_STATS.worker.attackPower,
        defense: ENTITY_STATS.worker.defense,
        gatherRate: ENTITY_STATS.worker.gatherRate,
      },
    ];

    const initialState: GameState = {
      grid,
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      entities,
      playerResources: { ...INITIAL_RESOURCES },
      aiResources: { ...INITIAL_RESOURCES },
      selectedEntityId: null,
      territories: {},
      gamePhase: 'early',
      score: 0,
      gameOver: false,
      won: false,
      timeElapsed: 0,
      keys: {},
    };

    setGameState(initialState);
    trainingDataRef.current = [];
  }, [generateMap]);

  // Verificar colisiones
  const checkCollision = useCallback((x: number, y: number, gameState: GameState): boolean => {
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    if (gridX < 0 || gridX >= gameState.width || gridY < 0 || gridY >= gameState.height) {
      return true;
    }

    return gameState.grid[gridY][gridX] === 1;
  }, []);

  // Encontrar entidad en posición
  const findEntityAt = useCallback((x: number, y: number, entities: Entity[]): Entity | null => {
    for (const entity of entities) {
      const dist = Math.sqrt((entity.x - x) ** 2 + (entity.y - y) ** 2);
      if (dist < CELL_SIZE / 2) {
        return entity;
      }
    }
    return null;
  }, []);

  // IA para unidades enemigas
  const updateAI = useCallback((gameState: GameState): GameState => {
    const newState = { ...gameState };
    const aiEntities = newState.entities.filter(e => e.owner === 'ai');

    // Estrategia simple: producir soldados y atacar
    const aiBase = aiEntities.find(e => e.type === 'base');
    const aiWorkers = aiEntities.filter(e => e.type === 'worker');
    const aiSoldiers = aiEntities.filter(e => e.type === 'soldier');

    // Producir workers si hay recursos
    if (aiBase && newState.aiResources.gold >= BUILDING_COSTS.worker.gold) {
      newState.aiResources.gold -= BUILDING_COSTS.worker.gold;
      newState.aiResources.wood -= BUILDING_COSTS.worker.wood;

      const newWorker: Entity = {
        id: `ai_worker_${Date.now()}`,
        type: 'worker',
        x: aiBase.x + CELL_SIZE,
        y: aiBase.y,
        health: ENTITY_STATS.worker.health,
        maxHealth: ENTITY_STATS.worker.health,
        owner: 'ai',
        state: 'idle',
        attackPower: ENTITY_STATS.worker.attackPower,
        defense: ENTITY_STATS.worker.defense,
        gatherRate: ENTITY_STATS.worker.gatherRate,
      };
      newState.entities.push(newWorker);
    }

    // Producir soldados
    if (aiBase && newState.aiResources.gold >= BUILDING_COSTS.soldier.gold) {
      newState.aiResources.gold -= BUILDING_COSTS.soldier.gold;
      newState.aiResources.stone -= BUILDING_COSTS.soldier.stone;
      newState.aiResources.wood -= BUILDING_COSTS.soldier.wood;

      const newSoldier: Entity = {
        id: `ai_soldier_${Date.now()}`,
        type: 'soldier',
        x: aiBase.x - CELL_SIZE,
        y: aiBase.y,
        health: ENTITY_STATS.soldier.health,
        maxHealth: ENTITY_STATS.soldier.health,
        owner: 'ai',
        state: 'idle',
        attackPower: ENTITY_STATS.soldier.attackPower,
        defense: ENTITY_STATS.soldier.defense,
        gatherRate: ENTITY_STATS.soldier.gatherRate,
      };
      newState.entities.push(newSoldier);
    }

    // Workers recolectan recursos
    aiWorkers.forEach(worker => {
      if (worker.state === 'idle') {
        // Buscar recurso cercano
        let nearestResource: Position | null = null;
        let minDist = Infinity;

        for (let y = 0; y < newState.height; y++) {
          for (let x = 0; x < newState.width; x++) {
            if (newState.grid[y][x] === 2 || newState.grid[y][x] === 3) {
              const dist = Math.abs(worker.x / CELL_SIZE - x) + Math.abs(worker.y / CELL_SIZE - y);
              if (dist < minDist) {
                minDist = dist;
                nearestResource = { x: x * CELL_SIZE, y: y * CELL_SIZE };
              }
            }
          }
        }

        if (nearestResource) {
          worker.targetX = nearestResource.x;
          worker.targetY = nearestResource.y;
          worker.state = 'moving';
        }
      }
    });

    // Soldados atacan
    const playerBase = newState.entities.find(e => e.id === 'player_base');
    if (playerBase) {
      aiSoldiers.forEach(soldier => {
        if (soldier.state === 'idle') {
          soldier.targetX = playerBase.x;
          soldier.targetY = playerBase.y;
          soldier.state = 'moving';
        }
      });
    }

    return newState;
  }, []);

  // Actualizar entidades
  const updateEntities = useCallback((deltaTime: number, gameState: GameState): GameState => {
    const newState = { ...gameState };

    newState.entities.forEach(entity => {
      if (entity.owner === 'ai') {
        // IA actualiza estado
        if (entity.state === 'moving' && entity.targetX !== undefined && entity.targetY !== undefined) {
          const dx = entity.targetX - entity.x;
          const dy = entity.targetY - entity.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 5) {
            entity.state = 'idle';
            entity.targetX = undefined;
            entity.targetY = undefined;

            // Verificar si llegó a un recurso
            const gridX = Math.floor(entity.x / CELL_SIZE);
            const gridY = Math.floor(entity.y / CELL_SIZE);
            if (newState.grid[gridY] && (newState.grid[gridY][gridX] === 2 || newState.grid[gridY][gridX] === 3)) {
              entity.state = 'gathering';
            }
          } else {
            // Movimiento hacia el objetivo
            const speed = entity.type === 'worker' ? 2 : 1.5;
            entity.x += (dx / dist) * speed;
            entity.y += (dy / dist) * speed;
          }
        }
      }
    });

    return newState;
  }, []);

  // Verificar victoria/derrota
  const checkWinCondition = useCallback((gameState: GameState): GameState => {
    const newState = { ...gameState };
    const playerBase = newState.entities.find(e => e.id === 'player_base');
    const aiBase = newState.entities.find(e => e.id === 'ai_base');

    if (!playerBase || playerBase.health <= 0) {
      newState.gameOver = true;
      newState.won = false;
    } else if (!aiBase || aiBase.health <= 0) {
      newState.gameOver = true;
      newState.won = true;
      newState.score = newState.playerResources.gold + newState.playerResources.stone + newState.playerResources.wood;
    }

    return newState;
  }, []);

  // Recolectar datos de entrenamiento
  const collectTrainingData = useCallback((gameState: GameState, action: TrainingMove['action']) => {
    const playerEntities = gameState.entities.filter(e => e.owner === 'player');
    const aiEntities = gameState.entities.filter(e => e.owner === 'ai');

    const move: TrainingMove = {
      timestamp: Date.now(),
      action,
      entity_id: gameState.selectedEntityId || 'none',
      position: { x: 0, y: 0 },
      resources: { ...gameState.playerResources },
      territories_control: Object.values(gameState.territories).filter(v => v === 1).length,
      enemy_positions: aiEntities.map(e => ({ x: e.x, y: e.y })),
    };
    trainingDataRef.current.push(move);
  }, []);

  // Loop principal del juego
  const gameLoop = useCallback((currentTime: number) => {
    if (!gameState || gameState.gameOver) return;

    const deltaTime = Math.min(currentTime - lastTimeRef.current, 50);
    lastTimeRef.current = currentTime;

    let newState = updateAI(gameState);
    newState = updateEntities(deltaTime, newState);
    newState = checkWinCondition(newState);

    // Actualizar tiempo
    newState.timeElapsed = (Date.now() - gameStartTimeRef.current) / 1000;

    // Recolectar datos de entrenamiento cada 500ms
    if (currentTime % 500 < deltaTime) {
      collectTrainingData(newState, 'move');
    }

    setGameState(newState);
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updateAI, updateEntities, checkWinCondition, collectTrainingData]);

  // Renderizar
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderizar grid
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        const tile = gameState.grid[y][x];
        const drawX = x * CELL_SIZE;
        const drawY = y * CELL_SIZE;

        if (tile === 1) {
          // Base/obstáculos
          ctx.fillStyle = '#666';
          ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
        } else if (tile === 2) {
          // Oro
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(drawX + CELL_SIZE / 2, drawY + CELL_SIZE / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 3) {
          // Piedra
          ctx.fillStyle = '#808080';
          ctx.fillRect(drawX + 8, drawY + 8, 16, 16);
        }
      }
    }

    // Renderizar entidades
    gameState.entities.forEach(entity => {
      const drawX = entity.x - CELL_SIZE / 2;
      const drawY = entity.y - CELL_SIZE / 2;

      // Color según owner
      if (entity.owner === 'player') {
        ctx.fillStyle = '#00AAFF';
      } else {
        ctx.fillStyle = '#FF0000';
      }

      // Forma según tipo
      if (entity.type === 'base') {
        ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
      } else if (entity.type === 'worker') {
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (entity.type === 'soldier') {
        ctx.beginPath();
        ctx.moveTo(entity.x, drawY);
        ctx.lineTo(drawX, drawY + CELL_SIZE);
        ctx.lineTo(drawX + CELL_SIZE, drawY + CELL_SIZE);
        ctx.closePath();
        ctx.fill();
      }

      // Barra de vida
      if (entity.health < entity.maxHealth) {
        const barWidth = CELL_SIZE;
        const barHeight = 4;
        const healthPercent = entity.health / entity.maxHealth;

        ctx.fillStyle = '#FF0000';
        ctx.fillRect(drawX, drawY - 8, barWidth, barHeight);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(drawX, drawY - 8, barWidth * healthPercent, barHeight);
      }

      // Selección
      if (gameState.selectedEntityId === entity.id) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX - 2, drawY - 2, CELL_SIZE + 4, CELL_SIZE + 4);
      }
    });

    // UI
    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.fillText(`Oro: ${gameState.playerResources.gold}`, 10, 20);
    ctx.fillText(`Piedra: ${gameState.playerResources.stone}`, 10, 40);
    ctx.fillText(`Madera: ${gameState.playerResources.wood}`, 10, 60);
    ctx.fillText(`Tiempo: ${Math.floor(gameState.timeElapsed)}s`, 10, 80);
    ctx.fillText(`Unidades: ${gameState.entities.filter(e => e.owner === 'player').length}`, 10, 100);

    // Fase del juego
    ctx.fillText(`Fase: ${gameState.gamePhase}`, canvas.width - 100, 20);

    // Controles
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, canvas.height - 120, 300, 110);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px monospace';
    ctx.fillText('Controles:', 20, canvas.height - 100);
    ctx.fillText('Click: Seleccionar unidad', 20, canvas.height - 85);
    ctx.fillText('W: Producir Worker (50 oro, 100 madera)', 20, canvas.height - 70);
    ctx.fillText('S: Producir Soldier (100 oro, 50 piedra, 75 madera)', 20, canvas.height - 55);
    ctx.fillText('Objetivo: Destruir la base enemiga', 20, canvas.height - 40);
  }, [gameState]);

  // Manejo de clics
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedEntity = findEntityAt(x, y, gameState.entities.filter(e => e.owner === 'player'));

    if (clickedEntity) {
      setGameState(prev => prev ? { ...prev, selectedEntityId: clickedEntity.id } : null);
    }
  }, [findEntityAt]);

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState || gameState.gameOver) return;

      if (e.key === 'w' || e.key === 'W') {
        // Producir worker
        const playerBase = gameState.entities.find(e => e.id === 'player_base');
        if (playerBase &&
            gameState.playerResources.gold >= BUILDING_COSTS.worker.gold &&
            gameState.playerResources.wood >= BUILDING_COSTS.worker.wood) {

          const newState = { ...gameState };
          newState.playerResources.gold -= BUILDING_COSTS.worker.gold;
          newState.playerResources.wood -= BUILDING_COSTS.worker.wood;

          const newWorker: Entity = {
            id: `worker_${Date.now()}`,
            type: 'worker',
            x: playerBase.x + CELL_SIZE,
            y: playerBase.y,
            health: ENTITY_STATS.worker.health,
            maxHealth: ENTITY_STATS.worker.health,
            owner: 'player',
            state: 'idle',
            attackPower: ENTITY_STATS.worker.attackPower,
            defense: ENTITY_STATS.worker.defense,
            gatherRate: ENTITY_STATS.worker.gatherRate,
          };
          newState.entities.push(newWorker);
          setGameState(newState);
          collectTrainingData(newState, 'build');
        }
      } else if (e.key === 's' || e.key === 'S') {
        // Producir soldier
        const playerBase = gameState.entities.find(e => e.id === 'player_base');
        if (playerBase &&
            gameState.playerResources.gold >= BUILDING_COSTS.soldier.gold &&
            gameState.playerResources.stone >= BUILDING_COSTS.soldier.stone &&
            gameState.playerResources.wood >= BUILDING_COSTS.soldier.wood) {

          const newState = { ...gameState };
          newState.playerResources.gold -= BUILDING_COSTS.soldier.gold;
          newState.playerResources.stone -= BUILDING_COSTS.soldier.stone;
          newState.playerResources.wood -= BUILDING_COSTS.soldier.wood;

          const newSoldier: Entity = {
            id: `soldier_${Date.now()}`,
            type: 'soldier',
            x: playerBase.x - CELL_SIZE,
            y: playerBase.y,
            health: ENTITY_STATS.soldier.health,
            maxHealth: ENTITY_STATS.soldier.health,
            owner: 'player',
            state: 'idle',
            attackPower: ENTITY_STATS.soldier.attackPower,
            defense: ENTITY_STATS.soldier.defense,
            gatherRate: ENTITY_STATS.soldier.gatherRate,
          };
          newState.entities.push(newSoldier);
          setGameState(newState);
          collectTrainingData(newState, 'build');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, collectTrainingData]);

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
        units_created: gameState.entities.filter(e => e.owner === 'player').length,
        resources_collected: gameState.playerResources.gold + gameState.playerResources.stone + gameState.playerResources.wood,
        moves_sequence: trainingDataRef.current,
        territories_control: Object.values(gameState.territories).filter(v => v === 1).length,
        game_phase: gameState.gamePhase,
      };

      onGameEnd(
        gameState.score,
        gameState.won,
        gameState.timeElapsed,
        Math.floor(gameState.timeElapsed),
        gameData
      );
    }
  }, [gameState?.gameOver, gameState?.won, gameState?.score, gameState?.timeElapsed, gameState?.entities, gameState?.playerResources, gameState?.territories, onGameEnd]);

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white">
        <h2 className="text-4xl font-bold mb-4 text-orange-400">⚔️ RTS - Estrategia en Tiempo Real</h2>
        <p className="text-gray-300 mb-6 text-center max-w-md">
          Construye tu base, recolecta recursos, crea unidades y destruye la base enemiga.
        </p>
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h3 className="text-orange-400 font-bold mb-3">Controles:</h3>
          <ul className="text-sm space-y-1">
            <li>Click: Seleccionar unidad</li>
            <li>W: Producir Worker (50 oro, 100 madera)</li>
            <li>S: Producir Soldier (100 oro, 50 piedra, 75 madera)</li>
          </ul>
        </div>
        <button
          onClick={() => {
            setGameStarted(true);
            gameStartTimeRef.current = Date.now();
            lastTimeRef.current = Date.now();
            initGame();
            animationFrameRef.current = requestAnimationFrame(gameLoop);
          }}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 transition-colors"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          Iniciar Batalla
        </button>
      </div>
    );
  }

  if (gameState?.gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white">
        <h2 className="text-4xl font-bold mb-4 text-orange-400">
          {gameState.won ? '¡Victoria!' : 'Derrota'}
        </h2>
        <p className="text-gray-300 mb-2">Puntuación: {gameState.score}</p>
        <p className="text-gray-300 mb-2">Tiempo: {Math.floor(gameState.timeElapsed)}s</p>
        <p className="text-gray-300 mb-2">
          Recursos: {gameState.playerResources.gold + gameState.playerResources.stone + gameState.playerResources.wood}
        </p>
        <p className="text-gray-300 mb-6">
          Unidades creadas: {gameState.entities.filter(e => e.owner === 'player').length}
        </p>
        <button
          onClick={() => {
            setGameStarted(false);
            setGameState(null);
          }}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 transition-colors"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          Jugar de Nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={GRID_WIDTH * CELL_SIZE}
        height={GRID_HEIGHT * CELL_SIZE}
        className="border-2 border-orange-900 bg-black cursor-pointer"
        onClick={handleCanvasClick}
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
