"use client";
import { useEffect, useRef, useState, useCallback } from 'react';

interface PongGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

interface Paddle {
  y: number;
  height: number;
  width: number;
}

export default function PongGame({ isAuthenticated, onGameEnd }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');
  const [rallies, setRallies] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(false); // Estado de IA Ollama

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PADDLE_WIDTH = 12;
  const PADDLE_HEIGHT = 100;
  const BALL_SIZE = 12;
  const WINNING_SCORE = 5;
  const INITIAL_BALL_SPEED = 5;

  // Game state
  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: INITIAL_BALL_SPEED,
    vy: INITIAL_BALL_SPEED * 0.5,
    speed: INITIAL_BALL_SPEED,
  });

  const playerPaddleRef = useRef<Paddle>({
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    height: PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
  });

  const opponentPaddleRef = useRef<Paddle>({
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    height: PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
  });

  const playerTargetYRef = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const keysRef = useRef<Record<string, boolean>>({});
  const animationFrameRef = useRef<number>();
  const currentRalliesRef = useRef(0);
  const aiMoveRef = useRef<{ targetY: number; timestamp: number } | null>(null);

  // Verificar disponibilidad de IA al montar
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/ai/status`)
      .then(res => res.json())
      .then(data => setAiEnabled(data.available))
      .catch(() => setAiEnabled(false));
  }, []);

  // Reset ball to center
  const resetBall = useCallback((direction: 1 | -1 = 1) => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: INITIAL_BALL_SPEED * direction,
      vy: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
      speed: INITIAL_BALL_SPEED,
    };
    currentRalliesRef.current = 0;
    setRallies(0);
  }, []);

  // Obtener movimiento de IA de Ollama
  const getAIMove = useCallback(async (ball: Ball, paddle: Paddle) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/ai/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'pong',
          game_state: {
            ball_x: ball.x,
            ball_y: ball.y,
            ball_vx: ball.vx,
            ball_vy: ball.vy,
            paddle_y: paddle.y,
            paddle_height: paddle.height,
            canvas_height: CANVAS_HEIGHT,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.move && data.move.targetY !== undefined) {
          aiMoveRef.current = { targetY: data.move.targetY, timestamp: Date.now() };
        }
      }
    } catch {
      // Silencioso - usa fallback local
    }
  }, []);

  // AI opponent logic con Ollama
  const updateOpponent = useCallback(() => {
    const paddle = opponentPaddleRef.current;
    const ball = ballRef.current;

    // Usar movimiento de IA si está disponible y es reciente (< 100ms)
    const now = Date.now();
    let targetY: number;

    if (aiEnabled && aiMoveRef.current && now - aiMoveRef.current.timestamp < 100) {
      targetY = aiMoveRef.current.targetY;
    } else {
      // Fallback local: predecir posición de pelota
      targetY = ball.y - paddle.height / 2;
      const randomOffset = (Math.random() - 0.5) * 30;
      targetY += randomOffset;

      // Solicitar nuevo movimiento a IA si la pelota viene hacia el oponente
      if (aiEnabled && ball.vx > 0 && Math.random() < 0.1) {
        getAIMove(ball, paddle);
      }
    }

    // Smooth movement hacia target
    const diff = targetY - paddle.y;
    paddle.y += diff * 0.08;

    // Mantener paleta en límites
    paddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - paddle.height, paddle.y));
  }, [aiEnabled, getAIMove]);

  // Update game physics
  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    const ball = ballRef.current;
    const playerPaddle = playerPaddleRef.current;
    const opponentPaddle = opponentPaddleRef.current;

    // Update player paddle
    const speed = 8;
    if (keysRef.current['ArrowUp'] || keysRef.current['w']) {
      playerTargetYRef.current -= speed;
    }
    if (keysRef.current['ArrowDown'] || keysRef.current['s']) {
      playerTargetYRef.current += speed;
    }

    // Smooth player paddle movement
    const playerDiff = playerTargetYRef.current - playerPaddle.y;
    playerPaddle.y += playerDiff * 0.2;

    // Keep player paddle in bounds
    playerPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - playerPaddle.height, playerPaddle.y));

    // Update ball position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ball collision with top/bottom walls
    if (ball.y <= BALL_SIZE / 2 || ball.y >= CANVAS_HEIGHT - BALL_SIZE / 2) {
      ball.vy *= -1;
      ball.y = ball.y <= BALL_SIZE / 2 ? BALL_SIZE / 2 : CANVAS_HEIGHT - BALL_SIZE / 2;
    }

    // Ball collision with player paddle
    if (
      ball.x - BALL_SIZE / 2 <= playerPaddle.width + 10 &&
      ball.x + BALL_SIZE / 2 >= playerPaddle.width + 10 &&
      ball.y >= playerPaddle.y &&
      ball.y <= playerPaddle.y + playerPaddle.height &&
      ball.vx < 0
    ) {
      ball.vx *= -1.05; // Increase speed slightly
      ball.x = playerPaddle.width + 10 + BALL_SIZE / 2;

      // Add spin based on where ball hits paddle
      const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height;
      ball.vy = (hitPos - 0.5) * ball.speed * 1.5;
      ball.speed *= 1.02;

      currentRalliesRef.current++;
      setRallies(currentRalliesRef.current);
    }

    // Ball collision with opponent paddle
    if (
      ball.x + BALL_SIZE / 2 >= CANVAS_WIDTH - opponentPaddle.width - 10 &&
      ball.x - BALL_SIZE / 2 <= CANVAS_WIDTH - opponentPaddle.width - 10 &&
      ball.y >= opponentPaddle.y &&
      ball.y <= opponentPaddle.y + opponentPaddle.height &&
      ball.vx > 0
    ) {
      ball.vx *= -1.05;
      ball.x = CANVAS_WIDTH - opponentPaddle.width - 10 - BALL_SIZE / 2;

      const hitPos = (ball.y - opponentPaddle.y) / opponentPaddle.height;
      ball.vy = (hitPos - 0.5) * ball.speed * 1.5;
      ball.speed *= 1.02;

      currentRalliesRef.current++;
      setRallies(currentRalliesRef.current);
    }

    // Update opponent AI
    updateOpponent();

    // Score points
    if (ball.x < 0) {
      setOpponentScore(s => {
        const newScore = s + 1;
        if (newScore >= WINNING_SCORE) {
          setGameState('ended');
          setTimeout(() => {
            onGameEnd(rallies, false, 0, 0, { opponent_score: newScore });
          }, 500);
        } else {
          resetBall(1);
        }
        return newScore;
      });
    }

    if (ball.x > CANVAS_WIDTH) {
      setPlayerScore(s => {
        const newScore = s + 1;
        if (newScore >= WINNING_SCORE) {
          setGameState('ended');
          setTimeout(() => {
            onGameEnd(rallies, true, 0, 0, { opponent_score: opponentScore });
          }, 500);
        } else {
          resetBall(-1);
        }
        return newScore;
      });
    }
  }, [gameState, onGameEnd, resetBall, updateOpponent, rallies, opponentScore]);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 10;
    ctx.fillRect(10, playerPaddleRef.current.y, playerPaddleRef.current.width, playerPaddleRef.current.height);
    ctx.fillRect(CANVAS_WIDTH - opponentPaddleRef.current.width - 10, opponentPaddleRef.current.y, opponentPaddleRef.current.width, opponentPaddleRef.current.height);
    ctx.shadowBlur = 0;

    // Draw ball
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw scores
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(opponentScore.toString(), (CANVAS_WIDTH / 4) * 3, 60);

    // Draw rallies
    ctx.font = '16px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`Rallies: ${rallies}`, CANVAS_WIDTH / 2, 30);
  }, [playerScore, opponentScore, rallies]);

  // Game loop
  useEffect(() => {
    const loop = () => {
      update();
      render();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [update, render]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' && gameState === 'menu') {
        setGameState('playing');
        setPlayerScore(0);
        setOpponentScore(0);
        resetBall();
      }
      if (e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
      }
      if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
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
  }, [gameState, resetBall]);

  // Touch controls for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touchY = e.touches[0].clientY - rect.top;
    playerTargetYRef.current = touchY - PADDLE_HEIGHT / 2;
  };

  const handleTouchStart = () => {
    if (gameState === 'menu') {
      setGameState('playing');
      setPlayerScore(0);
      setOpponentScore(0);
      resetBall();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score Display */}
      <div className="flex justify-between w-full max-w-[800px] px-4 text-sm font-mono">
        <div className="text-orange-400">
          <span className="text-gray-400">Player:</span> {playerScore}
        </div>
        <div className="flex items-center gap-2">
          {aiEnabled ? (
            <div className="flex items-center gap-1 bg-green-900/30 border border-green-500/50 px-2 py-1 rounded-sm">
              <span className="text-green-400 text-xs">🤖 AI Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-gray-900/30 border border-gray-700 px-2 py-1 rounded-sm">
              <span className="text-gray-500 text-xs">🤖 Local AI</span>
            </div>
          )}
        </div>
        <div className="text-red-400">
          <span className="text-gray-400">CPU:</span> {opponentScore}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-orange-900 max-w-full h-auto"
        style={{ imageRendering: 'pixelated' }}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
      />

      {/* Controls */}
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-lg">Pong</p>
          <p className="text-gray-400 text-sm">Usa ↑↓ o W/S para mover la paleta</p>
          <p className="text-gray-500 text-xs">Toca la pantalla o presiona ESPACIO para comenzar</p>
          <p className="text-gray-600 text-xs">Primero en llegar a {WINNING_SCORE} puntos gana</p>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="text-center">
          <p className="text-yellow-400 text-lg">PAUSA</p>
          <p className="text-gray-500 text-sm">Presiona P para continuar</p>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className={playerScore >= WINNING_SCORE ? 'text-green-400 text-lg' : 'text-red-400 text-lg'}>
            {playerScore >= WINNING_SCORE ? '¡GANASTE!' : 'PERDISTE'}
          </p>
          <p className="text-gray-400 text-sm">
            Rallies: {rallies} | Puntos ganados: {playerScore >= WINNING_SCORE ? '55+' : '10+'}
          </p>
          <button
            onClick={() => {
              setGameState('menu');
              setPlayerScore(0);
              setOpponentScore(0);
              resetBall();
            }}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 transition-colors"
          >
            Jugar de nuevo
          </button>
        </div>
      )}

      {/* Mobile Controls Hint */}
      <p className="text-gray-600 text-xs md:hidden">Toca y arrastra para mover la paleta</p>
    </div>
  );
}
