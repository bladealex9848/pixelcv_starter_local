/**
 * Constantes y configuraciones para el juego Snake
 * Incluye tipos de comida, power-ups, modos de juego y configuraciones de niveles
 */

// Tipos de celdas del mapa
export enum CellType {
  EMPTY = 0,
  WALL = 1,
  FOOD = 2,
  POWER_UP = 3,
  SNAKE_HEAD = 4,
  SNAKE_BODY = 5,
  OBSTACLE = 6
}

// Direcciones
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

// Modos de juego
export enum GameMode {
  CLASSIC = 'classic',
  ZEN = 'zen',
  TIME_ATTACK = 'time_attack',
  SURVIVAL = 'survival',
  BOSS = 'boss'
}

// Estados del juego
export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  VICTORY = 'victory',
  LEVEL_COMPLETE = 'level_complete'
}

// Tipos de power-ups
export enum PowerUpType {
  SHIELD = 'shield',
  GHOST = 'ghost',
  MAGNET = 'magnet',
  SLOW_TIME = 'slow_time',
  MULTIPLIER = 'multiplier'
}

// Configuración principal del juego
export const GAME_CONFIG = {
  GRID_WIDTH: 30,
  GRID_HEIGHT: 20,
  CELL_SIZE: 20,
  BASE_SPEED: 100,
  MIN_SPEED: 40,
  PARTICLE_COUNT: 20
};

// Emojis de comida (20 tipos)
export const FOOD_TYPES: { emoji: string; points: number; rarity: number }[] = [
  { emoji: '🍎', points: 10, rarity: 1 },
  { emoji: '🍊', points: 10, rarity: 1 },
  { emoji: '🍋', points: 10, rarity: 1 },
  { emoji: '🍇', points: 15, rarity: 1.2 },
  { emoji: '🍓', points: 15, rarity: 1.2 },
  { emoji: '🫐', points: 15, rarity: 1.2 },
  { emoji: '🍒', points: 15, rarity: 1.2 },
  { emoji: '🍑', points: 15, rarity: 1.3 },
  { emoji: '🥝', points: 20, rarity: 1.3 },
  { emoji: '🍆', points: 20, rarity: 1.4 },
  { emoji: '🥕', points: 20, rarity: 1.4 },
  { emoji: '🌽', points: 20, rarity: 1.4 },
  { emoji: '🥒', points: 25, rarity: 1.5 },
  { emoji: '🥬', points: 25, rarity: 1.5 },
  { emoji: '🥦', points: 25, rarity: 1.6 },
  { emoji: '🍄', points: 30, rarity: 1.7 },
  { emoji: '🥜', points: 30, rarity: 1.8 },
  { emoji: '🌰', points: 30, rarity: 1.8 },
  { emoji: '🍉', points: 35, rarity: 2 },
  { emoji: '🥭', points: 35, rarity: 2.2 }
];

// Configuraciones de power-ups
export const POWER_UPS_CONFIG: Record<PowerUpType, {
  duration: number;
  color: string;
  icon: string;
  spawnChance: number;
  name: string;
  description: string;
}> = {
  [PowerUpType.SHIELD]: {
    duration: 8000,
    color: '#00ffff',
    icon: '🛡️',
    spawnChance: 0.05,
    name: 'Escudo',
    description: 'Invulnerabilidad temporal'
  },
  [PowerUpType.GHOST]: {
    duration: 6000,
    color: '#ff00ff',
    icon: '👻',
    spawnChance: 0.04,
    name: 'Fantasma',
    description: 'Atraviesa paredes'
  },
  [PowerUpType.MAGNET]: {
    duration: 10000,
    color: '#ffff00',
    icon: '🧲',
    spawnChance: 0.06,
    name: 'Imán',
    description: 'Atrae comida cercana'
  },
  [PowerUpType.SLOW_TIME]: {
    duration: 5000,
    color: '#00ff00',
    icon: '⏰',
    spawnChance: 0.03,
    name: 'Tiempo Lento',
    description: 'Ralentiza el juego'
  },
  [PowerUpType.MULTIPLIER]: {
    duration: 15000,
    color: '#ff8800',
    icon: '✖️',
    spawnChance: 0.04,
    name: 'Multiplicador',
    description: 'Doble puntos'
  }
};

// Configuración de modos de juego
export const GAME_MODES_CONFIG: Record<GameMode, {
  name: string;
  description: string;
  hasWalls: boolean;
  hasTimeLimit: boolean;
  timeLimit?: number;
  hasObstacles: boolean;
  hasEnemy: boolean;
}> = {
  [GameMode.CLASSIC]: {
    name: 'Classic',
    description: 'El clásico juego de Snake',
    hasWalls: true,
    hasTimeLimit: false,
    hasObstacles: false,
    hasEnemy: false
  },
  [GameMode.ZEN]: {
    name: 'Zen Mode',
    description: 'Sin presión, relájate y juega',
    hasWalls: false,
    hasTimeLimit: false,
    hasObstacles: false,
    hasEnemy: false
  },
  [GameMode.TIME_ATTACK]: {
    name: 'Time Attack',
    description: '¡Come más en 60 segundos!',
    hasWalls: true,
    hasTimeLimit: true,
    timeLimit: 60,
    hasObstacles: false,
    hasEnemy: false
  },
  [GameMode.SURVIVAL]: {
    name: 'Survival',
    description: 'Evita los obstáculos móviles',
    hasWalls: true,
    hasTimeLimit: false,
    hasObstacles: true,
    hasEnemy: false
  },
  [GameMode.BOSS]: {
    name: 'Boss Battle',
    description: 'Derrota a la serpiente enemiga',
    hasWalls: true,
    hasTimeLimit: false,
    hasObstacles: false,
    hasEnemy: true
  }
};

// Configuración de niveles
export interface LevelConfig {
  level: number;
  speed: number;
  powerUpSpawnRate: number;
  obstacleCount: number;
  scoreMultiplier: number;
  gridSize: { width: number; height: number };
  unlockedAchievement?: string;
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    speed: 120,
    powerUpSpawnRate: 0.02,
    obstacleCount: 0,
    scoreMultiplier: 1,
    gridSize: { width: 25, height: 18 }
  },
  {
    level: 2,
    speed: 110,
    powerUpSpawnRate: 0.025,
    obstacleCount: 0,
    scoreMultiplier: 1.2,
    gridSize: { width: 28, height: 19 }
  },
  {
    level: 3,
    speed: 100,
    powerUpSpawnRate: 0.03,
    obstacleCount: 2,
    scoreMultiplier: 1.5,
    gridSize: { width: 30, height: 20 }
  },
  {
    level: 4,
    speed: 95,
    powerUpSpawnRate: 0.035,
    obstacleCount: 3,
    scoreMultiplier: 1.8,
    gridSize: { width: 30, height: 20 }
  },
  {
    level: 5,
    speed: 90,
    powerUpSpawnRate: 0.04,
    obstacleCount: 4,
    scoreMultiplier: 2,
    gridSize: { width: 32, height: 22 }
  },
  {
    level: 6,
    speed: 85,
    powerUpSpawnRate: 0.045,
    obstacleCount: 5,
    scoreMultiplier: 2.3,
    gridSize: { width: 32, height: 22 }
  },
  {
    level: 7,
    speed: 80,
    powerUpSpawnRate: 0.05,
    obstacleCount: 6,
    scoreMultiplier: 2.6,
    gridSize: { width: 35, height: 24 }
  },
  {
    level: 8,
    speed: 75,
    powerUpSpawnRate: 0.055,
    obstacleCount: 7,
    scoreMultiplier: 3,
    gridSize: { width: 35, height: 24 }
  },
  {
    level: 9,
    speed: 70,
    powerUpSpawnRate: 0.06,
    obstacleCount: 8,
    scoreMultiplier: 3.5,
    gridSize: { width: 38, height: 26 }
  },
  {
    level: 10,
    speed: 65,
    powerUpSpawnRate: 0.07,
    obstacleCount: 10,
    scoreMultiplier: 4,
    gridSize: { width: 40, height: 28 }
  }
];

// Colores neón
export const NEON_COLORS = {
  primary: '#00ff87',
  secondary: '#ff00ff',
  accent: '#00ffff',
  warning: '#ff0000',
  glow: '#ffff00',
  grid: '#1a1a2e',
  gridLine: '#16213e'
};

// Sistema de puntuación
export const SCORE_CONFIG = {
  BASE_FOOD_SCORE: 10,
  COMBO_MULTIPLIER: 0.1,
  SPEED_BONUS_FACTOR: 200,
  POWER_UP_MULTIPLIER: 2,
  LEVEL_MULTIPLIER: 0.1
};

// Posición inicial de la serpiente
export const SNAKE_START = { x: 5, y: 10 };
export const SNAKE_INITIAL_LENGTH = 3;

// Interfaces
export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment {
  x: number;
  y: number;
  color: string;
  glowIntensity: number;
}

export interface Snake {
  segments: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  growing: number;
}

export interface PowerUp {
  type: PowerUpType;
  position: Position;
  duration: number;
  color: string;
  icon: string;
  spawnTime: number;
}

export interface Food {
  emoji: string;
  position: Position;
  points: number;
  spawnTime: number;
  animationPhase: number;
}

export interface Obstacle {
  position: Position;
  direction: Direction;
  speed: number;
  lastMoveTime: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  velocityY: number;
}

// Controles de teclado
export const KEY_MAP: { [key: string]: Direction } = {
  'ArrowUp': 'UP',
  'ArrowDown': 'DOWN',
  'ArrowLeft': 'LEFT',
  'ArrowRight': 'RIGHT',
  'KeyW': 'UP',
  'KeyS': 'DOWN',
  'KeyA': 'LEFT',
  'KeyD': 'RIGHT'
};

// Obtener configuración de nivel
export const getLevelConfig = (level: number): LevelConfig => {
  const index = Math.min(level - 1, LEVELS.length - 1);
  return LEVELS[Math.max(0, index)];
};

// Obtener color arcoíris para segmento
export const getRainbowColor = (index: number, total: number): string => {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 100%, 50%)`;
};

// Calcular puntuación con combo
export const calculateScore = (
  basePoints: number,
  combo: number,
  speed: number,
  hasMultiplier: boolean,
  level: number
): number => {
  let score = basePoints;

  // Combo multiplier
  score *= (1 + combo * SCORE_CONFIG.COMBO_MULTIPLIER);

  // Speed bonus
  const speedBonus = (SCORE_CONFIG.SPEED_BONUS_FACTOR - speed) / SCORE_CONFIG.SPEED_BONUS_FACTOR;
  score *= (1 + speedBonus * 0.5);

  // Power-up multiplier
  if (hasMultiplier) {
    score *= SCORE_CONFIG.POWER_UP_MULTIPLIER;
  }

  // Level multiplier
  score *= (1 + level * SCORE_CONFIG.LEVEL_MULTIPLIER);

  return Math.floor(score);
};
