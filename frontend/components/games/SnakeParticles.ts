/**
 * Sistema de Partículas para Snake
 * Efectos visuales para feedback y jugabilidad
 */

import { GAME_CONFIG, NEON_COLORS } from './SnakeConstants';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'eat' | 'move' | 'powerup' | 'death' | 'combo' | 'trail';
  alpha?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  velocityY: number;
  scale?: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];

  // Crear partículas al comer
  createEatParticles(x: number, y: number, color: string, count: number = 12): void {
    const centerX = x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const centerY = y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = 2 + Math.random() * 3;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 15,
        maxLife: 45,
        color,
        size: 2 + Math.random() * 2,
        type: 'eat',
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  // Crear partículas de trail (estela)
  createTrailParticles(x: number, y: number, color: string): void {
    if (Math.random() > 0.4) return; // No crear siempre

    const centerX = x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const centerY = y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

    this.particles.push({
      x: centerX + (Math.random() - 0.5) * 5,
      y: centerY + (Math.random() - 0.5) * 5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: 15 + Math.random() * 10,
      maxLife: 25,
      color,
      size: 1 + Math.random() * 2,
      type: 'trail',
      alpha: 0.6
    });
  }

  // Crear partículas de power-up
  createPowerUpParticles(x: number, y: number, color: string): void {
    const centerX = x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const centerY = y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

    // Explosión circular
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color,
        size: 3 + Math.random() * 3,
        type: 'powerup',
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      });
    }

    // Estrellas brillantes
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const speed = 1 + Math.random() * 1;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: '#ffff00',
        size: 4,
        type: 'powerup',
        alpha: 1
      });
    }
  }

  // Crear partículas de muerte
  createDeathParticles(snakeSegments: Array<{ x: number; y: number; color: string }>): void {
    for (const segment of snakeSegments) {
      const centerX = segment.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const centerY = segment.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

      // Explosión grande
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;

        this.particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 50 + Math.random() * 30,
          maxLife: 80,
          color: segment.color,
          size: 4 + Math.random() * 4,
          type: 'death',
          alpha: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2
        });
      }
    }
  }

  // Crear partículas de combo
  createComboParticles(x: number, y: number, comboCount: number): void {
    const centerX = x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const centerY = y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

    // Colores basados en combo
    const colors = [
      NEON_COLORS.primary,
      NEON_COLORS.secondary,
      NEON_COLORS.accent,
      NEON_COLORS.glow
    ];

    const color = colors[Math.min(comboCount, colors.length - 1)];

    // Anillo de partículas
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      const speed = 2 + Math.random() * 2;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 2,
        type: 'combo',
        alpha: 1,
        rotation: angle
      });
    }
  }

  // Crear texto flotante
  createFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x: x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
      y: y * GAME_CONFIG.CELL_SIZE,
      text,
      color,
      life: 60,
      maxLife: 60,
      velocityY: -1,
      scale: 1
    });
  }

  // Crear texto flotante de nivel completo
  createLevelCompleteText(width: number, height: number): void {
    this.floatingTexts.push({
      x: width / 2,
      y: height / 2,
      text: '¡NIVEL COMPLETADO!',
      color: NEON_COLORS.accent,
      life: 120,
      maxLife: 120,
      velocityY: -0.5,
      scale: 2
    });
  }

  // Actualizar todas las partículas
  update(): void {
    // Actualizar partículas
    this.particles = this.particles
      .map(p => {
        const newParticle = {
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 1,
          vx: p.vx * 0.98, // Fricción
          vy: p.vy * 0.98,
          alpha: p.alpha !== undefined ? (p.life / p.maxLife) * p.alpha : p.life / p.maxLife
        };

        // Gravedad para ciertos tipos
        if (p.type === 'death') {
          newParticle.vy += 0.1;
        }

        // Rotación
        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          newParticle.rotation = p.rotation + p.rotationSpeed;
        }

        return newParticle;
      })
      .filter(p => p.life > 0);

    // Actualizar textos flotantes
    this.floatingTexts = this.floatingTexts
      .map(t => ({
        ...t,
        y: t.y + t.velocityY,
        life: t.life - 1
      }))
      .filter(t => t.life > 0);
  }

  // Renderizar partículas en canvas
  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      const alpha = particle.alpha !== undefined ? particle.alpha : particle.life / particle.maxLife;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      // Glow effect
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;

      if (particle.rotation !== undefined) {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.rotate(-particle.rotation);
        ctx.translate(-particle.x, -particle.y);
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Renderizar textos flotantes
    for (const text of this.floatingTexts) {
      const alpha = text.life / text.maxLife;
      const scale = text.scale || 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = `bold ${16 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.shadowColor = text.color;
      ctx.shadowBlur = 10;
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    }
  }

  // Limpiar todas las partículas
  clear(): void {
    this.particles = [];
    this.floatingTexts = [];
  }

  // Obtener número de partículas activas
  getParticleCount(): number {
    return this.particles.length;
  }

  // Obtener número de textos flotantes activos
  getFloatingTextCount(): number {
    return this.floatingTexts.length;
  }
}
