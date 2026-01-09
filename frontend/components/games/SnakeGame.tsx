"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  CellType,
  Direction,
  GameMode,
  GameState,
  PowerUpType,
  GAME_CONFIG,
  FOOD_TYPES,
  GAME_MODES_CONFIG,
  getLevelConfig,
  getRainbowColor,
  calculateScore,
  SNAKE_START,
  SNAKE_INITIAL_LENGTH,
  Position,
  SnakeSegment,
  Food,
  PowerUp,
  Obstacle,
  FloatingText,
  NEON_COLORS,
  KEY_MAP
} from './SnakeConstants';
import { PowerUpManager, ActivePowerUp } from './SnakePowerUps';
import { ParticleSystem } from './SnakeParticles';
import { getSnakeAudio } from './SnakeAudio';

interface SnakeGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

interface EnemySnake {
  segments: Position[];
  direction: Direction;
  lastMoveTime: number;
}

// Algoritmo A* simplificado para pathfinding del enemigo
const aStarPathfinding = (
  start: Position,
  goal: Position,
  gridSize: { width: number; height: number },
  obstacles: Position[]
): Direction => {
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const dirMap: Record<Direction, { dx: number; dy: number }> = {
    'UP': { dx: 0, dy: -1 },
    'DOWN': { dx: 0, dy: 1 },
    'LEFT': { dx: -1, dy: 0 },
    'RIGHT': { dx: 1, dy: 0 },
    'NONE': { dx: 0, dy: 0 }
  };

  let bestDir = directions[0];
  let bestDist = Infinity;

  for (const dir of directions) {
    const delta = dirMap[dir];
    const nx = start.x + delta.dx;
    const ny = start.y + delta.dy;

    if (nx < 0 || nx >= gridSize.width || ny < 0 || ny >= gridSize.height) continue;

    const isObstacle = obstacles.some(o => o.x === nx && o.y === ny);
    if (isObstacle) continue;

    const dist = Math.abs(nx - goal.x) + Math.abs(ny - goal.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestDir = dir;
    }
  }

  return bestDir;
};

export default function SnakeGame({ isAuthenticated, onGameEnd }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CLASSIC);
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [food, setFood] = useState<Food | null>(null);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [enemySnake, setEnemySnake] = useState<EnemySnake | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [gridSize, setGridSize] = useState({ width: GAME_CONFIG.GRID_WIDTH, height: GAME_CONFIG.GRID_HEIGHT });
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Systems
  const powerUpManagerRef = useRef<PowerUpManager>(new PowerUpManager());
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const audioRef = useRef(getSnakeAudio());

  // Timing
  const [currentTime, setCurrentTime] = useState(0);
  const levelConfigRef = useRef(getLevelConfig(1));

  // Initialize game
  const initGame = useCallback((mode: GameMode) => {
    const config = GAME_MODES_CONFIG[mode];
    const levelCfg = getLevelConfig(1);

    setGridSize(levelCfg.gridSize);
    levelConfigRef.current = levelCfg;

    // Create initial snake
    const initialSnake: SnakeSegment[] = [];
    for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
      initialSnake.push({
        x: SNAKE_START.x - i,
        y: SNAKE_START.y,
        color: getRainbowColor(i, SNAKE_INITIAL_LENGTH),
        glowIntensity: 1
      });
    }
    setSnake(initialSnake);
    setDirection('RIGHT');
    setNextDirection('RIGHT');

    // Spawn food
    const newFood = spawnFood(initialSnake, levelCfg.gridSize);
    setFood(newFood);

    // Reset state
    setScore(0);
    setLevel(1);
    setCombo(0);
    setPowerUps([]);
    setActivePowerUps([]);
    setObstacles([]);

    // Time limit for Time Attack mode
    if (config.hasTimeLimit && config.timeLimit) {
      setTimeRemaining(config.timeLimit);
    } else {
      setTimeRemaining(0);
    }

    // Enemy snake for Boss mode
    if (config.hasEnemy) {
      setEnemySnake({
        segments: [
          { x: levelCfg.gridSize.width - 5, y: Math.floor(levelCfg.gridSize.height / 2) },
          { x: levelCfg.gridSize.width - 6, y: Math.floor(levelCfg.gridSize.height / 2) },
          { x: levelCfg.gridSize.width - 7, y: Math.floor(levelCfg.gridSize.height / 2) }
        ],
        direction: 'LEFT',
        lastMoveTime: 0
      });
    } else {
      setEnemySnake(null);
    }

    // Reset systems
    powerUpManagerRef.current.clear();
    particleSystemRef.current.clear();

    setGameState(GameState.PLAYING);
    setCurrentTime(Date.now());

    // Audio
    if (audioRef.current) {
      audioRef.current.init();
      audioRef.current.playGameStartSound();
    }
  }, []);

  // Spawn food in valid position
  const spawnFood = useCallback((snakeSegments: SnakeSegment[], size: { width: number; height: number }): Food => {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const pos = {
        x: Math.floor(Math.random() * size.width),
        y: Math.floor(Math.random() * size.height)
      };

      const onSnake = snakeSegments.some(seg => seg.x === pos.x && seg.y === pos.y);
      if (!onSnake) {
        const foodType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
        return {
          emoji: foodType.emoji,
          position: pos,
          points: foodType.points,
          spawnTime: Date.now(),
          animationPhase: Math.random() * Math.PI * 2
        };
      }

      attempts++;
    }

    // Fallback
    const foodType = FOOD_TYPES[0];
    return {
      emoji: foodType.emoji,
      position: { x: Math.floor(size.width / 2), y: Math.floor(size.height / 2) },
      points: foodType.points,
      spawnTime: Date.now(),
      animationPhase: 0
    };
  }, []);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP', 'KeyM'].includes(e.code)) {
      e.preventDefault();
    }

    // Audio toggle
    if (e.code === 'KeyM') {
      setAudioEnabled(prev => {
        const newEnabled = !prev;
        if (audioRef.current) {
          audioRef.current.toggle(newEnabled);
        }
        return newEnabled;
      });
      return;
    }

    // Pause
    if (e.code === 'KeyP' && gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      if (audioRef.current) audioRef.current.playPauseSound();
      return;
    }

    if (e.code === 'KeyP' && gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
      setCurrentTime(Date.now());
      return;
    }

    // Direction controls
    if (gameState !== GameState.PLAYING) return;

    const newDir = KEY_MAP[e.code];
    if (!newDir) return;

    // Prevent 180-degree turns
    const opposites: Record<Direction, Direction> = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT',
      'NONE': 'NONE'
    };

    if (opposites[newDir] !== direction) {
      setNextDirection(newDir);
    }
  }, [gameState, direction]);

  // Handle touch for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState !== GameState.PLAYING) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    const opposites: Record<Direction, Direction> = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT',
      'NONE': 'NONE'
    };

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipe) {
        const newDir = dx > 0 ? 'RIGHT' : 'LEFT';
        if (opposites[newDir] !== direction) {
          setNextDirection(newDir);
        }
      }
    } else {
      if (Math.abs(dy) > minSwipe) {
        const newDir = dy > 0 ? 'DOWN' : 'UP';
        if (opposites[newDir] !== direction) {
          setNextDirection(newDir);
        }
      }
    }

    touchStartRef.current = null;
  }, [gameState, direction]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== GameState.PLAYING) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const dt = timestamp - lastUpdateTimeRef.current;
    const now = Date.now();

    // Get current level config
    const levelCfg = levelConfigRef.current;
    const modeConfig = GAME_MODES_CONFIG[gameMode];

    // Update timer for Time Attack mode
    if (modeConfig.hasTimeLimit && timeRemaining > 0) {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setGameState(GameState.GAME_OVER);
          return 0;
        }
        return prev - dt / 1000;
      });
    }

    // Snake movement
    const moveInterval = powerUpManagerRef.current.getModifiedSpeed(levelCfg.speed);

    if (dt >= moveInterval) {
      lastUpdateTimeRef.current = timestamp;

      setSnake(prevSnake => {
        if (prevSnake.length === 0) return prevSnake;

        const dir = nextDirection;
        const head = prevSnake[0];
        const dirMap: Record<Direction, { dx: number; dy: number }> = {
          'UP': { dx: 0, dy: -1 },
          'DOWN': { dx: 0, dy: 1 },
          'LEFT': { dx: -1, dy: 0 },
          'RIGHT': { dx: 1, dy: 0 },
          'NONE': { dx: 0, dy: 0 }
        };

        const delta = dirMap[dir];
        let newHead: Position = {
          x: head.x + delta.dx,
          y: head.y + delta.dy
        };

        // Wall collision or wrap (Zen mode)
        if (modeConfig.hasWalls) {
          if (newHead.x < 0 || newHead.x >= gridSize.width ||
              newHead.y < 0 || newHead.y >= gridSize.height) {
            // Check shield
            if (powerUpManagerRef.current.hasShield()) {
              // Bounce back
              newHead = head;
            } else {
              // Game over
              setGameState(GameState.GAME_OVER);
              if (audioRef.current) audioRef.current.playDeathSound();
              particleSystemRef.current.createDeathParticles(prevSnake);
              onGameEnd(score, false, 0, 0, { mode: gameMode, level });
              return prevSnake;
            }
          }
        } else {
          // Wrap around
          newHead.x = (newHead.x + gridSize.width) % gridSize.width;
          newHead.y = (newHead.y + gridSize.height) % gridSize.height;
        }

        // Ghost mode - pass through walls
        if (!powerUpManagerRef.current.isGhost() && modeConfig.hasWalls) {
          // Check wall collision (already handled above)
        }

        // Self collision
        const hitSelf = prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y);
        if (hitSelf && !powerUpManagerRef.current.hasShield()) {
          setGameState(GameState.GAME_OVER);
          if (audioRef.current) audioRef.current.playDeathSound();
          particleSystemRef.current.createDeathParticles(prevSnake);
          onGameEnd(score, false, 0, 0, { mode: gameMode, level });
          return prevSnake;
        }

        // Obstacle collision
        const hitObstacle = obstacles.some(o => o.position.x === newHead.x && o.position.y === newHead.y);
        if (hitObstacle && !powerUpManagerRef.current.hasShield()) {
          setGameState(GameState.GAME_OVER);
          if (audioRef.current) audioRef.current.playDeathSound();
          particleSystemRef.current.createDeathParticles(prevSnake);
          onGameEnd(score, false, 0, 0, { mode: gameMode, level });
          return prevSnake;
        }

        // Create new snake with new head
        const newSnake: SnakeSegment[] = [
          {
            ...newHead,
            color: getRainbowColor(0, prevSnake.length + 1),
            glowIntensity: 1
          },
          ...prevSnake.map((seg, i) => ({
            ...seg,
            color: getRainbowColor(i + 1, prevSnake.length + 1)
          }))
        ];

        // Food collision
        if (food && newHead.x === food.position.x && newHead.y === food.position.y) {
          // Calculate score
          const newScore = calculateScore(
            food.points,
            combo,
            levelCfg.speed,
            powerUpManagerRef.current.hasMultiplier(),
            level
          );

          setScore(s => s + newScore);
          setCombo(c => c + 1);

          // Audio
          if (audioRef.current) {
            if (combo >= 5) {
              audioRef.current.playComboSound(combo);
            } else {
              audioRef.current.playEatSound(combo);
            }
          }

          // Particles
          particleSystemRef.current.createEatParticles(food.position.x, food.position.y, NEON_COLORS.primary);
          if (combo >= 3) {
            particleSystemRef.current.createComboParticles(food.position.x, food.position.y, combo);
          }
          particleSystemRef.current.createFloatingText(food.position.x, food.position.y, `+${newScore}`, NEON_COLORS.glow);

          // Spawn new food
          const newFood = spawnFood(newSnake, gridSize);
          setFood(newFood);

          // Check for power-up spawn
          const spawnedPowerUp = powerUpManagerRef.current.spawnPowerUp(
            newSnake.map(s => ({ x: s.x, y: s.y })),
            newFood.position,
            gridSize,
            levelCfg.powerUpSpawnRate
          );

          if (spawnedPowerUp) {
            setPowerUps(prev => [...prev, spawnedPowerUp]);
          }

          // Update level progress
          const scoreForNextLevel = level * 500;
          if (score >= scoreForNextLevel && level < 10) {
            const newLevel = level + 1;
            setLevel(newLevel);
            const newLevelCfg = getLevelConfig(newLevel);
            levelConfigRef.current = newLevelCfg;
            setGridSize(newLevelCfg.gridSize);

            if (audioRef.current) audioRef.current.playLevelCompleteSound();
            particleSystemRef.current.createLevelCompleteText(
              gridSize.width * GAME_CONFIG.CELL_SIZE,
              gridSize.height * GAME_CONFIG.CELL_SIZE
            );
          }

          // Snake grows (don't remove tail)
          setDirection(dir);
          return newSnake;
        }

        // Power-up collision
        const collectedPowerUp = powerUpManagerRef.current.checkCollision(newHead);
        if (collectedPowerUp) {
          powerUpManagerRef.current.activatePowerUp(collectedPowerUp.type);
          setPowerUps(powerUpManagerRef.current.getPowerUps());

          if (audioRef.current) audioRef.current.playPowerUpSound();
          particleSystemRef.current.createPowerUpParticles(collectedPowerUp.position.x, collectedPowerUp.position.y, collectedPowerUp.color);
          particleSystemRef.current.createFloatingText(collectedPowerUp.position.x, collectedPowerUp.position.y, collectedPowerUp.icon, collectedPowerUp.color);
        }

        // Remove tail (snake didn't grow)
        newSnake.pop();

        // Trail particles
        if (Math.random() < 0.3) {
          const tail = newSnake[newSnake.length - 1];
          particleSystemRef.current.createTrailParticles(tail.x, tail.y, tail.color);
        }

        setDirection(dir);
        return newSnake;
      });

      // Update obstacles
      if (modeConfig.hasObstacles) {
        setObstacles(prev => prev.map(obs => {
          if (now - obs.lastMoveTime < obs.speed * 10) return obs;

          const dirMap: Record<Direction, { dx: number; dy: number }> = {
            'UP': { dx: 0, dy: -1 },
            'DOWN': { dx: 0, dy: 1 },
            'LEFT': { dx: -1, dy: 0 },
            'RIGHT': { dx: 1, dy: 0 },
            'NONE': { dx: 0, dy: 0 }
          };

          const delta = dirMap[obs.direction];
          const newPos = {
            x: obs.position.x + delta.dx,
            y: obs.position.y + delta.dy
          };

          // Bounce off walls
          if (newPos.x < 0 || newPos.x >= gridSize.width ||
              newPos.y < 0 || newPos.y >= gridSize.height) {
            const oppositeDir: Record<Direction, Direction> = {
              'UP': 'DOWN',
              'DOWN': 'UP',
              'LEFT': 'RIGHT',
              'RIGHT': 'LEFT',
              'NONE': 'NONE'
            };
            return {
              ...obs,
              direction: oppositeDir[obs.direction]
            };
          }

          return {
            ...obs,
            position: newPos,
            lastMoveTime: now
          };
        }));
      }

      // Update enemy snake (Boss mode)
      if (modeConfig.hasEnemy && enemySnake && snake.length > 0) {
        const playerHead = snake[0];
        const enemyHead = enemySnake.segments[0];

        const enemyDir = aStarPathfinding(
          enemyHead,
          playerHead,
          gridSize,
          [...obstacles.map(o => o.position), ...snake.map(s => ({ x: s.x, y: s.y }))]
        );

        const dirMap: Record<Direction, { dx: number; dy: number }> = {
          'UP': { dx: 0, dy: -1 },
          'DOWN': { dx: 0, dy: 1 },
          'LEFT': { dx: -1, dy: 0 },
          'RIGHT': { dx: 1, dy: 0 },
          'NONE': { dx: 0, dy: 0 }
        };

        const delta = dirMap[enemyDir];
        const newEnemyHead = {
          x: enemyHead.x + delta.dx,
          y: enemyHead.y + delta.dy
        };

        const newEnemySegments = [
          newEnemyHead,
          ...enemySnake.segments.slice(0, -1)
        ];

        setEnemySnake({
          segments: newEnemySegments,
          direction: enemyDir,
          lastMoveTime: now
        });

        // Check collision with enemy (calculate where player head will be)
        const playerDelta = dirMap[nextDirection];
        const playerNewHead = {
          x: playerHead.x + playerDelta.dx,
          y: playerHead.y + playerDelta.dy
        };

        // Handle wrap for player head calculation
        if (!modeConfig.hasWalls) {
          playerNewHead.x = (playerNewHead.x + gridSize.width) % gridSize.width;
          playerNewHead.y = (playerNewHead.y + gridSize.height) % gridSize.height;
        }

        const hitEnemy = newEnemySegments.some(seg => seg.x === playerNewHead.x && seg.y === playerNewHead.y);
        if (hitEnemy && !powerUpManagerRef.current.hasShield()) {
          setGameState(GameState.GAME_OVER);
          if (audioRef.current) audioRef.current.playDeathSound();
          particleSystemRef.current.createDeathParticles(snake);
          onGameEnd(score, false, 0, 0, { mode: gameMode, level });
        }
      }
    }

    // Update active power-ups
    const active = powerUpManagerRef.current.updateActivePowerUps();
    setActivePowerUps(active);

    // Apply magnet effect
    if (food && powerUpManagerRef.current.hasMagnet() && snake.length > 0) {
      const head = snake[0];
      const magnetPos = powerUpManagerRef.current.applyMagnetEffect(food.position, head);

      if (magnetPos) {
        setFood(prev => prev ? { ...prev, position: magnetPos } : null);
      }
    }

    // Update particles
    particleSystemRef.current.update();

    // Reset combo if too long without eating
    const timeSinceLastEat = food ? now - food.spawnTime : 0;
    if (timeSinceLastEat > 5000) {
      setCombo(0);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, nextDirection, food, obstacles, enemySnake, snake, gridSize, score, level, combo, gameMode, timeRemaining, onGameEnd, spawnFood]);

  // Effects
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      lastUpdateTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = gridSize.width * GAME_CONFIG.CELL_SIZE;
    const height = gridSize.height * GAME_CONFIG.CELL_SIZE;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = NEON_COLORS.grid;
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = NEON_COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= gridSize.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GAME_CONFIG.CELL_SIZE, 0);
      ctx.lineTo(x * GAME_CONFIG.CELL_SIZE, height);
      ctx.stroke();
    }
    for (let y = 0; y <= gridSize.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GAME_CONFIG.CELL_SIZE);
      ctx.lineTo(width, y * GAME_CONFIG.CELL_SIZE);
      ctx.stroke();
    }

    // Draw obstacles
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    for (const obs of obstacles) {
      const x = obs.position.x * GAME_CONFIG.CELL_SIZE;
      const y = obs.position.y * GAME_CONFIG.CELL_SIZE;
      ctx.fillRect(x + 2, y + 2, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4);
    }
    ctx.shadowBlur = 0;

    // Draw enemy snake
    if (enemySnake) {
      ctx.fillStyle = '#ff0044';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      for (let i = 0; i < enemySnake.segments.length; i++) {
        const seg = enemySnake.segments[i];
        const x = seg.x * GAME_CONFIG.CELL_SIZE;
        const y = seg.y * GAME_CONFIG.CELL_SIZE;
        const size = i === 0 ? GAME_CONFIG.CELL_SIZE - 2 : GAME_CONFIG.CELL_SIZE - 4;
        const offset = i === 0 ? 1 : 2;
        ctx.globalAlpha = 1 - i * 0.15;
        ctx.fillRect(x + offset, y + offset, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Draw food
    if (food) {
      const x = food.position.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const y = food.position.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const pulse = Math.sin((Date.now() - food.spawnTime) / 200 + food.animationPhase) * 0.2 + 1;

      ctx.font = `${GAME_CONFIG.CELL_SIZE * pulse}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(food.emoji, x, y);
    }

    // Draw power-ups
    for (const pu of powerUps) {
      const x = pu.position.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const y = pu.position.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const pulse = Math.sin((Date.now() - pu.spawnTime) / 300) * 0.15 + 1;

      ctx.shadowColor = pu.color;
      ctx.shadowBlur = 20;
      ctx.font = `${GAME_CONFIG.CELL_SIZE * pulse}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.icon, x, y);
    }
    ctx.shadowBlur = 0;

    // Draw snake
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const x = seg.x * GAME_CONFIG.CELL_SIZE;
      const y = seg.y * GAME_CONFIG.CELL_SIZE;
      const size = i === 0 ? GAME_CONFIG.CELL_SIZE - 2 : GAME_CONFIG.CELL_SIZE - 4;
      const offset = i === 0 ? 1 : 2;

      ctx.fillStyle = seg.color;
      ctx.shadowColor = seg.color;
      ctx.shadowBlur = 15 * seg.glowIntensity;

      if (i === 0) {
        // Draw head with eyes
        ctx.fillRect(x + offset, y + offset, size, size);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        const eyeSize = 3;
        const eyeOffset = 5;

        if (direction === 'RIGHT') {
          ctx.fillRect(x + size - eyeOffset, y + 4, eyeSize, eyeSize);
          ctx.fillRect(x + size - eyeOffset, y + size - 7, eyeSize, eyeSize);
        } else if (direction === 'LEFT') {
          ctx.fillRect(x + eyeOffset - eyeSize, y + 4, eyeSize, eyeSize);
          ctx.fillRect(x + eyeOffset - eyeSize, y + size - 7, eyeSize, eyeSize);
        } else if (direction === 'UP') {
          ctx.fillRect(x + 4, y + eyeOffset - eyeSize, eyeSize, eyeSize);
          ctx.fillRect(x + size - 7, y + eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (direction === 'DOWN') {
          ctx.fillRect(x + 4, y + size - eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(x + size - 7, y + size - eyeOffset, eyeSize, eyeSize);
        }
      } else {
        ctx.fillRect(x + offset, y + offset, size, size);
      }
    }
    ctx.shadowBlur = 0;

    // Draw particles
    particleSystemRef.current.render(ctx);

    // Draw shield effect
    if (powerUpManagerRef.current.hasShield() && snake.length > 0) {
      const head = snake[0];
      const hx = head.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const hy = head.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

      ctx.strokeStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, GAME_CONFIG.CELL_SIZE, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw ghost effect
    if (powerUpManagerRef.current.isGhost() && snake.length > 0) {
      for (const seg of snake) {
        const x = seg.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
        const y = seg.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

        ctx.strokeStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y, GAME_CONFIG.CELL_SIZE / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Draw game over overlay
    if (gameState === GameState.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.fillText('GAME OVER', width / 2, height / 2 - 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.shadowBlur = 0;
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
      ctx.fillText(`Level: ${level}`, width / 2, height / 2 + 50);
    }

    // Draw pause overlay
    if (gameState === GameState.PAUSED) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 20;
      ctx.fillText('PAUSA', width / 2, height / 2);
    }
  }, [snake, food, powerUps, obstacles, enemySnake, direction, gridSize, gameState, score, level]);

  useEffect(() => {
    render();
  }, [render]);

  // Virtual D-Pad for mobile
  const DPad = () => (
    <div className="grid grid-cols-3 gap-1 mt-4">
      <div></div>
      <button
        onTouchStart={() => {
          if (direction !== 'DOWN') setNextDirection('UP');
        }}
        className="bg-gray-800 hover:bg-gray-700 text-white w-12 h-12 rounded-lg text-2xl active:scale-95 transition-transform"
      >
        ↑
      </button>
      <div></div>
      <button
        onTouchStart={() => {
          if (direction !== 'RIGHT') setNextDirection('LEFT');
        }}
        className="bg-gray-800 hover:bg-gray-700 text-white w-12 h-12 rounded-lg text-2xl active:scale-95 transition-transform"
      >
        ←
      </button>
      <div></div>
      <button
        onTouchStart={() => {
          if (direction !== 'LEFT') setNextDirection('RIGHT');
        }}
        className="bg-gray-800 hover:bg-gray-700 text-white w-12 h-12 rounded-lg text-2xl active:scale-95 transition-transform"
      >
        →
      </button>
      <div></div>
      <button
        onTouchStart={() => {
          if (direction !== 'UP') setNextDirection('DOWN');
        }}
        className="bg-gray-800 hover:bg-gray-700 text-white w-12 h-12 rounded-lg text-2xl active:scale-95 transition-transform"
      >
        ↓
      </button>
      <div></div>
    </div>
  );

  // Menu UI
  if (gameState === GameState.MENU) {
    return (
      <div className="flex flex-col items-center gap-6 p-4">
        <h1 className="text-5xl font-bold" style={{ color: NEON_COLORS.primary, textShadow: `0 0 20px ${NEON_COLORS.primary}` }}>
          SNAKE
        </h1>
        <p className="text-gray-400 text-center">El mejor juego de Snake de la historia</p>

        <div className="grid gap-3 w-full max-w-xs">
          <button
            onClick={() => initGame(GameMode.CLASSIC)}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            🐍 Classic Mode
          </button>
          <button
            onClick={() => initGame(GameMode.ZEN)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            🧘 Zen Mode
          </button>
          <button
            onClick={() => initGame(GameMode.TIME_ATTACK)}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            ⏱️ Time Attack
          </button>
          <button
            onClick={() => initGame(GameMode.SURVIVAL)}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            💀 Survival
          </button>
          <button
            onClick={() => initGame(GameMode.BOSS)}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            👹 Boss Battle
          </button>
        </div>

        <div className="text-center text-gray-500 text-sm mt-4">
          <p>Controles: Flechas / WASD / Swipe</p>
          <p>P: Pausa | M: Audio On/Off</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* HUD */}
      {gameState === GameState.PLAYING && (
        <div className="w-full flex justify-between items-center text-white">
          <div className="flex gap-4">
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-gray-400">Score:</span>
              <span className="font-bold ml-2" style={{ color: NEON_COLORS.glow }}>{score}</span>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-gray-400">Level:</span>
              <span className="font-bold ml-2">{level}</span>
            </div>
            {combo > 0 && (
              <div className="bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-gray-400">Combo:</span>
                <span className="font-bold ml-2" style={{ color: NEON_COLORS.secondary }}>x{combo}</span>
              </div>
            )}
            {timeRemaining > 0 && (
              <div className="bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-gray-400">Time:</span>
                <span className={`font-bold ml-2 ${timeRemaining < 10 ? 'text-red-500' : ''}`}>
                  {Math.ceil(timeRemaining)}s
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAudioEnabled(prev => {
                  const newEnabled = !prev;
                  if (audioRef.current) audioRef.current.toggle(newEnabled);
                  return newEnabled;
                });
              }}
              className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg"
            >
              {audioEnabled ? '🔊' : '🔇'}
            </button>
            <button
              onClick={() => {
                setGameState(GameState.PAUSED);
                if (audioRef.current) audioRef.current.playPauseSound();
              }}
              className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg"
            >
              ⏸️
            </button>
          </div>
        </div>
      )}

      {/* Active power-ups */}
      {activePowerUps.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {activePowerUps.map(pu => (
            <div
              key={pu.type}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-white text-sm"
              style={{
                backgroundColor: pu.color + '40',
                border: `1px solid ${pu.color}`
              }}
            >
              <span>{pu.icon}</span>
              <span>{Math.ceil((pu.endTime - Date.now()) / 1000)}s</span>
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          className="border-2 rounded-lg shadow-2xl"
          style={{
            borderColor: NEON_COLORS.gridLine,
            boxShadow: `0 0 30px ${NEON_COLORS.primary}40`
          }}
        />
      </div>

      {/* Virtual D-Pad for mobile */}
      <DPad />

      {/* Game Over UI */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-red-500">GAME OVER</h2>
            <p className="text-white text-xl">Score: {score}</p>
            <p className="text-gray-400">Level: {level}</p>
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={() => initGame(gameMode)}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  setGameState(GameState.MENU);
                  particleSystemRef.current.clear();
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause UI */}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-yellow-500">PAUSA</h2>
            <button
              onClick={() => {
                setGameState(GameState.PLAYING);
                setCurrentTime(Date.now());
              }}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg"
            >
              Reanudar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
