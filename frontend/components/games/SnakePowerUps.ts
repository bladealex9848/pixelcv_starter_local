/**
 * Sistema de Power-ups para Snake
 * Maneja la creación, actualización y efectos de los power-ups
 */

import {
  PowerUpType,
  PowerUp,
  Position,
  POWER_UPS_CONFIG,
  GAME_CONFIG
} from './SnakeConstants';

// Mapa de power-ups activos y su tiempo de expiración
export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
  icon: string;
  color: string;
}

export class PowerUpManager {
  private powerUps: PowerUp[] = [];
  private activePowerUps: Map<PowerUpType, number> = new Map();
  private lastSpawnCheck: number = 0;

  // Generar un power-up en una posición aleatoria
  spawnPowerUp(snakeSegments: Position[], food: Position | null, gridSize: { width: number; height: number }, spawnRate: number): PowerUp | null {
    const now = Date.now();

    // Evitar spawnear muy seguido
    if (now - this.lastSpawnCheck < 1000) {
      return null;
    }

    this.lastSpawnCheck = now;

    // Chance de spawn
    if (Math.random() > spawnRate) {
      return null;
    }

    // Elegir un tipo de power-up aleatorio basado en spawnChance
    const types = Object.entries(POWER_UPS_CONFIG);
    const totalChance = types.reduce((sum, [, config]) => sum + config.spawnChance, 0);
    let random = Math.random() * totalChance;

    let selectedType: PowerUpType | null = null;
    for (const [type, config] of types) {
      random -= config.spawnChance;
      if (random <= 0) {
        selectedType = type as PowerUpType;
        break;
      }
    }

    if (!selectedType) {
      selectedType = PowerUpType.SHIELD;
    }

    // Buscar una posición válida
    const position = this.findValidPosition(snakeSegments, food, this.powerUps, gridSize);

    if (!position) {
      return null;
    }

    const config = POWER_UPS_CONFIG[selectedType];
    const newPowerUp: PowerUp = {
      type: selectedType,
      position,
      duration: config.duration,
      color: config.color,
      icon: config.icon,
      spawnTime: now
    };

    this.powerUps.push(newPowerUp);
    return newPowerUp;
  }

  // Encontrar posición válida para spawnear
  private findValidPosition(
    snakeSegments: Position[],
    food: Position | null,
    existingPowerUps: PowerUp[],
    gridSize: { width: number; height: number }
  ): Position | null {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const pos = {
        x: Math.floor(Math.random() * gridSize.width),
        y: Math.floor(Math.random() * gridSize.height)
      };

      // Verificar que no esté en la serpiente
      const onSnake = snakeSegments.some(seg => seg.x === pos.x && seg.y === pos.y);
      if (onSnake) {
        attempts++;
        continue;
      }

      // Verificar que no esté en la comida
      if (food && food.x === pos.x && food.y === pos.y) {
        attempts++;
        continue;
      }

      // Verificar que no esté en otro power-up
      const onPowerUp = existingPowerUps.some(p => p.position.x === pos.x && p.position.y === pos.y);
      if (onPowerUp) {
        attempts++;
        continue;
      }

      return pos;
    }

    return null;
  }

  // Verificar si la serpiente colisionó con algún power-up
  checkCollision(snakeHead: Position): PowerUp | null {
    const index = this.powerUps.findIndex(p => p.position.x === snakeHead.x && p.position.y === snakeHead.y);

    if (index !== -1) {
      const powerUp = this.powerUps[index];
      this.powerUps.splice(index, 1);
      return powerUp;
    }

    return null;
  }

  // Activar un power-up
  activatePowerUp(type: PowerUpType): void {
    const config = POWER_UPS_CONFIG[type];
    const endTime = Date.now() + config.duration;
    this.activePowerUps.set(type, endTime);
  }

  // Actualizar power-ups activos (eliminar expirados)
  updateActivePowerUps(): ActivePowerUp[] {
    const now = Date.now();
    const active: ActivePowerUp[] = [];

    for (const [type, endTime] of this.activePowerUps.entries()) {
      if (endTime > now) {
        const config = POWER_UPS_CONFIG[type];
        active.push({
          type,
          endTime,
          icon: config.icon,
          color: config.color
        });
      } else {
        this.activePowerUps.delete(type);
      }
    }

    return active;
  }

  // Verificar si un power-up está activo
  isPowerUpActive(type: PowerUpType): boolean {
    const endTime = this.activePowerUps.get(type);
    if (!endTime) return false;
    return Date.now() < endTime;
  }

  // Obtener tiempo restante de un power-up activo
  getPowerUpRemainingTime(type: PowerUpType): number {
    const endTime = this.activePowerUps.get(type);
    if (!endTime) return 0;
    return Math.max(0, endTime - Date.now());
  }

  // Verificar si el escudo está activo
  hasShield(): boolean {
    return this.isPowerUpActive(PowerUpType.SHIELD);
  }

  // Verificar si el modo fantasma está activo
  isGhost(): boolean {
    return this.isPowerUpActive(PowerUpType.GHOST);
  }

  // Verificar si el imán está activo
  hasMagnet(): boolean {
    return this.isPowerUpActive(PowerUpType.MAGNET);
  }

  // Verificar si el multiplicador está activo
  hasMultiplier(): boolean {
    return this.isPowerUpActive(PowerUpType.MULTIPLIER);
  }

  // Aplicar efecto de imán (mover comida hacia la serpiente)
  applyMagnetEffect(
    foodPosition: Position,
    snakeHead: Position,
    range: number = 5
  ): Position | null {
    if (!this.hasMagnet()) {
      return null;
    }

    const dx = snakeHead.x - foodPosition.x;
    const dy = snakeHead.y - foodPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= range && distance > 0) {
      // Mover comida un paso hacia la serpiente
      const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

      // Priorizar el eje con mayor distancia
      if (Math.abs(dx) > Math.abs(dy)) {
        return { x: foodPosition.x + stepX, y: foodPosition.y };
      } else {
        return { x: foodPosition.x, y: foodPosition.y + stepY };
      }
    }

    return null;
  }

  // Obtener velocidad modificada por power-ups
  getModifiedSpeed(baseSpeed: number): number {
    if (this.isPowerUpActive(PowerUpType.SLOW_TIME)) {
      return baseSpeed * 1.5; // Más lento = mayor valor
    }
    return baseSpeed;
  }

  // Obtener todos los power-ups activos
  getPowerUps(): PowerUp[] {
    return [...this.powerUps];
  }

  // Limpiar todos los power-ups
  clear(): void {
    this.powerUps = [];
    this.activePowerUps.clear();
  }

  // Desactivar un power-up específico
  deactivatePowerUp(type: PowerUpType): void {
    this.activePowerUps.delete(type);
  }

  // Obtener información de los power-ups activos para UI
  getActivePowerUpsInfo(): Array<{
    type: PowerUpType;
    icon: string;
    color: string;
    remainingTime: number;
    duration: number;
  }> {
    const now = Date.now();
    const info: Array<{
      type: PowerUpType;
      icon: string;
      color: string;
      remainingTime: number;
      duration: number;
    }> = [];

    for (const [type, endTime] of this.activePowerUps.entries()) {
      if (endTime > now) {
        const config = POWER_UPS_CONFIG[type];
        info.push({
          type,
          icon: config.icon,
          color: config.color,
          remainingTime: endTime - now,
          duration: config.duration
        });
      }
    }

    return info;
  }

  // Calcular multiplicador de puntos actual
  getScoreMultiplier(): number {
    return this.hasMultiplier() ? 2 : 1;
  }
}
