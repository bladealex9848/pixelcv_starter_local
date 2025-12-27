"use client";
import { useEffect, useRef, useState, useCallback } from 'react';

interface SpaceInvadersProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
}

interface Enemy {
  x: number;
  y: number;
  alive: boolean;
}

export default function SpaceInvaders({ isAuthenticated, onGameEnd }: SpaceInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;

  const playerRef = useRef({ x: CANVAS_WIDTH / 2 - 25, y: CANVAS_HEIGHT - 50, width: 50, height: 30 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const enemyDirectionRef = useRef(1);
  const keysRef = useRef<Record<string, boolean>>({});

  const initEnemies = useCallback(() => {
    const enemies: Enemy[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        enemies.push({ x: 50 + col * 60, y: 50 + row * 40, alive: true });
      }
    }
    return enemies;
  }, []);

  const startGame = () => {
    playerRef.current = { x: CANVAS_WIDTH / 2 - 25, y: CANVAS_HEIGHT - 50, width: 50, height: 30 };
    bulletsRef.current = [];
    enemiesRef.current = initEnemies();
    enemyDirectionRef.current = 1;
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      const bullets = bulletsRef.current;
      const enemies = enemiesRef.current;

      // Move player
      if (keysRef.current['ArrowLeft']) player.x -= 6;
      if (keysRef.current['ArrowRight']) player.x += 6;
      player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));

      // Shoot
      if (keysRef.current[' '] && bullets.length < 3) {
        keysRef.current[' '] = false;
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, vy: -8 });
      }

      // Move bullets
      bullets.forEach(b => b.y += b.vy);
      bulletsRef.current = bullets.filter(b => b.y > 0);

      // Move enemies
      let shouldDrop = false;
      enemies.forEach(e => {
        if (!e.alive) return;
        e.x += enemyDirectionRef.current * 0.5;
        if (e.x <= 0 || e.x >= CANVAS_WIDTH - 40) shouldDrop = true;
      });

      if (shouldDrop) {
        enemyDirectionRef.current *= -1;
        enemies.forEach(e => e.y += 10);
      }

      // Collision detection
      bullets.forEach(b => {
        enemies.forEach(e => {
          if (e.alive && b.x > e.x && b.x < e.x + 40 && b.y > e.y && b.y < e.y + 30) {
            e.alive = false;
            b.y = -100;
            setScore(s => s + 10);
          }
        });
      });

      // Check win condition
      const aliveEnemies = enemies.filter(e => e.alive);
      if (aliveEnemies.length === 0) {
        setGameState('ended');
        onGameEnd(score, true, 0, 0, { enemies_destroyed: score / 10, total_enemies: 32 });
      }

      // Enemy reaches bottom
      if (enemies.some(e => e.alive && e.y > CANVAS_HEIGHT - 80)) {
        setGameState('ended');
        onGameEnd(score, false, 0, 0, {});
      }

      // Enemy collision with player
      if (enemies.some(e => e.alive && e.y + 30 > player.y && e.x < player.x + player.width && e.x + 40 > player.x)) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('ended');
            onGameEnd(score, false, 0, 0, {});
          }
          return newLives;
        });
      }
    }, 16);

    return () => clearInterval(interval);
  }, [gameState, score, onGameEnd, initEnemies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw player
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);

      // Draw bullets
      ctx.fillStyle = '#fbbf24';
      bulletsRef.current.forEach(b => {
        ctx.fillRect(b.x, b.y, 4, 12);
      });

      // Draw enemies
      ctx.fillStyle = '#ef4444';
      enemiesRef.current.forEach(e => {
        if (e.alive) {
          ctx.fillRect(e.x, e.y, 40, 30);
          // Eyes
          ctx.fillStyle = '#fff';
          ctx.fillRect(e.x + 10, e.y + 10, 5, 5);
          ctx.fillRect(e.x + 25, e.y + 10, 5, 5);
          ctx.fillStyle = '#ef4444';
        }
      });
    };

    const animationFrame = requestAnimationFrame(function loop() {
      render();
      requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Space Invaders</p>
          <p className="text-gray-400 text-sm">← → para mover, ESPACIO para disparar</p>
          <button onClick={startGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3">
            Comenzar
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <p className="text-orange-400">Puntos: {score} | Vidas: {lives}</p>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className={score >= 320 ? 'text-green-400' : 'text-red-400'}>
            {score >= 320 ? '¡Victoria!' : 'Game Over'}
          </p>
          <p className="text-gray-400">Puntuación: {score}</p>
          <button onClick={startGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2">
            Jugar de nuevo
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-orange-900 max-w-full"
      />
    </div>
  );
}
