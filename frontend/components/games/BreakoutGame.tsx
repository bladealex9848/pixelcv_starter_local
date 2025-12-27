"use client";
import { useEffect, useRef, useState, useCallback } from 'react';

interface BreakoutGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

export default function BreakoutGame({ isAuthenticated, onGameEnd }: BreakoutGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;

  const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, vx: 4, vy: -4, radius: 8 });
  const paddleRef = useRef({ x: CANVAS_WIDTH / 2 - 50, width: 100, height: 15 });
  const bricksRef = useRef<Array<{ x: number; y: number; status: number }>>([]);
  const keysRef = useRef<Record<string, boolean>>({});

  const initBricks = useCallback(() => {
    const bricks: Array<{ x: number; y: number; status: number }> = [];
    const rows = 5;
    const cols = 8;
    const brickWidth = 65;
    const brickHeight = 20;
    const padding = 5;
    const offsetTop = 50;
    const offsetLeft = 35;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        bricks.push({
          x: c * (brickWidth + padding) + offsetLeft,
          y: r * (brickHeight + padding) + offsetTop,
          status: 1,
        });
      }
    }
    return bricks;
  }, []);

  const resetGame = useCallback(() => {
    ballRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, vx: 4, vy: -4, radius: 8 };
    paddleRef.current = { x: CANVAS_WIDTH / 2 - 50, width: 100, height: 15 };
    bricksRef.current = initBricks();
    setScore(0);
    setLives(3);
  }, [initBricks]);

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const ball = ballRef.current;
      const paddle = paddleRef.current;
      const bricks = bricksRef.current;

      // Move paddle
      if (keysRef.current['ArrowLeft']) paddle.x -= 7;
      if (keysRef.current['ArrowRight']) paddle.x += 7;
      paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, paddle.x));

      // Move ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collision
      if (ball.x + ball.radius > CANVAS_WIDTH || ball.x - ball.radius < 0) ball.vx *= -1;
      if (ball.y - ball.radius < 0) ball.vy *= -1;

      // Paddle collision
      if (
        ball.y + ball.radius > CANVAS_HEIGHT - paddle.height - 10 &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        ball.vy *= -1;
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.vx = (hitPos - 0.5) * 8;
      }

      // Brick collision
      bricks.forEach(brick => {
        if (brick.status === 1) {
          if (
            ball.x > brick.x &&
            ball.x < brick.x + 65 &&
            ball.y > brick.y &&
            ball.y < brick.y + 20
          ) {
            ball.vy *= -1;
            brick.status = 0;
            setScore(s => {
              const newScore = s + 10;
              if (bricks.every(b => b.status === 0)) {
                setGameState('ended');
                onGameEnd(newScore, true, 0, 0, { blocks_destroyed: newScore / 10, total_blocks: 40 });
              }
              return newScore;
            });
          }
        }
      });

      // Ball falls off screen
      if (ball.y + ball.radius > CANVAS_HEIGHT) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('ended');
            onGameEnd(score, false, 0, 0, {});
          } else {
            ballRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, vx: 4, vy: -4, radius: 8 };
          }
          return newLives;
        });
      }
    }, 16);

    return () => clearInterval(interval);
  }, [gameState, score, onGameEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw bricks
      bricksRef.current.forEach(brick => {
        if (brick.status === 1) {
          ctx.fillStyle = '#f97316';
          ctx.fillRect(brick.x, brick.y, 65, 20);
        }
      });

      // Draw paddle
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(paddleRef.current.x, CANVAS_HEIGHT - paddleRef.current.height - 10, paddleRef.current.width, paddleRef.current.height);

      // Draw ball
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2);
      ctx.fill();
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
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
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
          <p className="text-orange-400 text-2xl">Breakout</p>
          <p className="text-gray-400 text-sm">Destruye los bloques</p>
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
          <p className={score > 300 ? 'text-green-400' : 'text-red-400'}>
            {score > 300 ? '¡Ganaste!' : 'Game Over'}
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
