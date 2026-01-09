// Sprites de Pixel Race - Arrays de 32x32 para renderizado
// Cada sprite es un array de 1024 colores (32x32 grid)

// Importar sprites generados con pygame
import { TREE_SPRITES_DETAILED } from './tree_sprites_generated';

export type Sprite = {
  id: string;
  name: string;
  pixels: string[];
  width: number;
  height: number;
};

// Paleta de colores para Pixel Race
export const COLORS = {
  TRANSPARENT: '#00000000', // Transparente
  BLACK: '#000000',
  WHITE: '#ffffff',
  GRAY: '#808080',
  DARK_GRAY: '#404040',
  LIGHT_GRAY: '#c0c0c0',

  // Colores del jugador (naranja/rojo)
  PLAYER_BODY: '#ff4500',
  PLAYER_BODY_LIGHT: '#ff6b35',
  PLAYER_BODY_DARK: '#d62d20',
  PLAYER_WINDOW: '#87ceeb',
  PLAYER_WHEEL: '#2d2d2d',
  PLAYER_LIGHT: '#ffd700',

  // Colores enemigos (azul, verde, amarillo)
  ENEMY1_BODY: '#0066cc',
  ENEMY1_BODY_LIGHT: '#3385d6',
  ENEMY1_WINDOW: '#87ceeb',

  ENEMY2_BODY: '#00cc66',
  ENEMY2_BODY_LIGHT: '#33d67a',
  ENEMY2_WINDOW: '#87ceeb',

  ENEMY3_BODY: '#ffcc00',
  ENEMY3_BODY_LIGHT: '#ffd633',
  ENEMY3_WINDOW: '#87ceeb',

  // Árboles
  TREE_LEAVES: '#228b22',
  TREE_LEAVES_LIGHT: '#32cd32',
  TREE_LEAVES_DARK: '#006400',
  TREE_TRUNK: '#8b4513',
  TREE_TRUNK_DARK: '#654321',

  // Meta
  CHECKER_WHITE: '#ffffff',
  CHECKER_BLACK: '#000000',
  FINISH_POST: '#404040',

  // Carretera
  ROAD: '#404040',
  ROAD_DARK: '#2a2a2a',
  ROAD_LIGHT: '#555555',

  // Suelo
  GRASS: '#6b8e23',
  GRASS_LIGHT: '#7fb237',
  GRASS_DARK: '#556b2f',

  // UI
  UI_ORANGE: '#ff6600',
  UI_ORANGE_LIGHT: '#ff8533',
  UI_BACKGROUND: '#1a1a2e',
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
};

// Función helper para crear un sprite vacío
export const createEmptySprite = (width = 32, height = 32): string[] => {
  return Array(width * height).fill(COLORS.TRANSPARENT);
};

// Función helper para setear un pixel
export const setPixel = (pixels: string[], x: number, y: number, color: string, width = 32): string[] => {
  if (x >= 0 && x < width && y >= 0 && y < 32) {
    pixels[y * width + x] = color;
  }
  return pixels;
};

// Sprite: Coche deportivo del jugador (vista lateral)
export const createPlayerCarSprite = (): Sprite => {
  const pixels = createEmptySprite();

  // Cuerpo del coche (naranja)
  for (let y = 12; y < 20; y++) {
    for (let x = 8; x < 24; x++) {
      setPixel(pixels, x, y, COLORS.PLAYER_BODY);
    }
  }

  // Ventanas
  for (let y = 13; y < 16; y++) {
    for (let x = 10; x < 14; x++) {
      setPixel(pixels, x, y, COLORS.PLAYER_WINDOW);
    }
  }
  for (let y = 13; y < 16; y++) {
    for (let x = 18; x < 22; x++) {
      setPixel(pixels, x, y, COLORS.PLAYER_WINDOW);
    }
  }

  // Luces delanteras
  setPixel(pixels, 7, 14, COLORS.PLAYER_LIGHT);
  setPixel(pixels, 7, 15, COLORS.PLAYER_LIGHT);

  // Llantas
  setPixel(pixels, 9, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 10, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 21, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 22, 18, COLORS.PLAYER_WHEEL);

  // Detalles del cuerpo
  setPixel(pixels, 11, 12, COLORS.PLAYER_BODY_LIGHT);
  setPixel(pixels, 19, 12, COLORS.PLAYER_BODY_LIGHT);

  return {
    id: 'player_car',
    name: 'Coche Jugador',
    pixels,
    width: 32,
    height: 32,
  };
};

// Sprite: Coche enemigo azul
export const createEnemyCar1Sprite = (): Sprite => {
  const pixels = createEmptySprite();

  // Cuerpo del coche (azul)
  for (let y = 12; y < 20; y++) {
    for (let x = 8; x < 24; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY1_BODY);
    }
  }

  // Ventanas
  for (let y = 13; y < 16; y++) {
    for (let x = 10; x < 14; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY1_WINDOW);
    }
  }
  for (let y = 13; y < 16; y++) {
    for (let x = 18; x < 22; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY1_WINDOW);
    }
  }

  // Llantas
  setPixel(pixels, 9, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 10, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 21, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 22, 18, COLORS.PLAYER_WHEEL);

  return {
    id: 'enemy_car_1',
    name: 'Coche Enemigo Azul',
    pixels,
    width: 32,
    height: 32,
  };
};

// Sprite: Coche enemigo verde
export const createEnemyCar2Sprite = (): Sprite => {
  const pixels = createEmptySprite();

  // Cuerpo del coche (verde)
  for (let y = 12; y < 20; y++) {
    for (let x = 8; x < 24; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY2_BODY);
    }
  }

  // Ventanas
  for (let y = 13; y < 16; y++) {
    for (let x = 10; x < 14; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY2_WINDOW);
    }
  }
  for (let y = 13; y < 16; y++) {
    for (let x = 18; x < 22; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY2_WINDOW);
    }
  }

  // Llantas
  setPixel(pixels, 9, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 10, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 21, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 22, 18, COLORS.PLAYER_WHEEL);

  return {
    id: 'enemy_car_2',
    name: 'Coche Enemigo Verde',
    pixels,
    width: 32,
    height: 32,
  };
};

// Sprite: Coche enemigo amarillo
export const createEnemyCar3Sprite = (): Sprite => {
  const pixels = createEmptySprite();

  // Cuerpo del coche (amarillo)
  for (let y = 12; y < 20; y++) {
    for (let x = 8; x < 24; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY3_BODY);
    }
  }

  // Ventanas
  for (let y = 13; y < 16; y++) {
    for (let x = 10; x < 14; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY3_WINDOW);
    }
  }
  for (let y = 13; y < 16; y++) {
    for (let x = 18; x < 22; x++) {
      setPixel(pixels, x, y, COLORS.ENEMY3_WINDOW);
    }
  }

  // Llantas
  setPixel(pixels, 9, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 10, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 21, 18, COLORS.PLAYER_WHEEL);
  setPixel(pixels, 22, 18, COLORS.PLAYER_WHEEL);

  return {
    id: 'enemy_car_3',
    name: 'Coche Enemigo Amarillo',
    pixels,
    width: 32,
    height: 32,
  };
};

// Sprite: Árbol grande (Pine) - generado con pygame
export const createTreeSprite = (): Sprite => {
  return TREE_SPRITES_DETAILED.pine;
};

// Sprite: Árbol pequeño (Oak) - generado con pygame
export const createSmallTreeSprite = (): Sprite => {
  return TREE_SPRITES_DETAILED.oak;
};

// Sprite: Meta (checkered flag)
export const createFinishFlagSprite = (): Sprite => {
  const pixels = createEmptySprite();

  // Postes
  for (let y = 8; y < 24; y++) {
    setPixel(pixels, 6, y, COLORS.FINISH_POST);
    setPixel(pixels, 25, y, COLORS.FINISH_POST);
  }

  // Bandera con patrón a cuadros
  for (let y = 10; y < 22; y++) {
    for (let x = 8; x < 24; x++) {
      const isWhite = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
      setPixel(pixels, x, y, isWhite ? COLORS.CHECKER_WHITE : COLORS.CHECKER_BLACK);
    }
  }

  return {
    id: 'finish_flag',
    name: 'Meta',
    pixels,
    width: 32,
    height: 32,
  };
};

// Exportar todos los sprites
export const CAR_SPRITES = [
  createPlayerCarSprite(),
  createEnemyCar1Sprite(),
  createEnemyCar2Sprite(),
  createEnemyCar3Sprite(),
];

export const TREE_SPRITES = [
  createTreeSprite(),
  createSmallTreeSprite(),
];

export const FINISH_SPRITE = createFinishFlagSprite();

// Mapear IDs a sprites para fácil acceso
export const SPRITES_MAP: Record<string, Sprite> = {
  'player_car': CAR_SPRITES[0],
  'enemy_car_1': CAR_SPRITES[1],
  'enemy_car_2': CAR_SPRITES[2],
  'enemy_car_3': CAR_SPRITES[3],
  'tree': TREE_SPRITES[0],
  'small_tree': TREE_SPRITES[1],
  'finish': FINISH_SPRITE,
};
