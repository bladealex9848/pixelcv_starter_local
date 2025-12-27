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

// Tipo para eventos de entrenamiento
interface GameEvent {
  timestamp: number;
  ball_x: number;
  ball_y: number;
  ball_vx: number;
  ball_vy: number;
  player_paddle_y: number;
  opponent_paddle_y: number;
  rally_count: number;
  event_type?: 'paddle_hit' | 'wall_bounce' | 'score';
}

// Algoritmo local de IA para Pong (SIN llamadas HTTP)
const getLocalAIMove = (
  ball: Ball,
  paddle: Paddle,
  canvasHeight: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
) => {
  // Parámetros según dificultad
  const params = {
    easy: { baseError: 50, reactionDelay: 0.2, maxBounces: 1 },
    medium: { baseError: 20, reactionDelay: 0.05, maxBounces: 2 },
    hard: { baseError: 5, reactionDelay: 0.01, maxBounces: 3 },
    expert: { baseError: 0, reactionDelay: 0, maxBounces: 5 },
  }[difficulty];

  // 1. Calcular posición de intersección con física
  let predictedY = ball.y;
  let bounces = 0;
  let tempBallY = ball.y;
  let tempBallVY = ball.vy;

  if (ball.vx > 0) { // Solo predecir si la pelota viene hacia el oponente
    // Calcular tiempo para llegar al lado derecho
    const timeToEdge = (800 - ball.x) / ball.vx;
    predictedY = ball.y + ball.vy * timeToEdge;

    // Simular rebotes
    while (bounces < params.maxBounces) {
      if (predictedY >= 0 && predictedY <= canvasHeight) break;

      if (predictedY < 0) {
        predictedY = -predictedY;
      } else if (predictedY > canvasHeight) {
        predictedY = 2 * canvasHeight - predictedY;
      }
      bounces++;
    }
  }

  // 2. Agregar error controlado
  const error = (Math.random() - 0.5) * 2 * params.baseError;
  predictedY += error;

  // 3. Calcular target Y (centro de la paleta)
  let targetY = predictedY - paddle.height / 2;

  // 4. Mantener dentro de límites
  targetY = Math.max(0, Math.min(canvasHeight - paddle.height, targetY));

  return targetY;
};

export default function PongGame({ isAuthenticated, onGameEnd }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');
  const [rallies, setRallies] = useState(0);

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
  const animationFrameRef = useRef<number | undefined>(undefined);
  const currentRalliesRef = useRef(0);

  // NUEVO: Recolectar datos de entrenamiento
  const gameEventsRef = useRef<GameEvent[]>([]);
  const gameStartTimeRef = useRef<number>(0);

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
    // NUEVO: Limpiar eventos de entrenamiento
    gameEventsRef.current = [];
    gameStartTimeRef.current = Date.now();
  }, []);

  // AI opponent logic con algoritmo LOCAL (sin llamadas HTTP)
  const updateOpponent = useCallback(() => {
    const paddle = opponentPaddleRef.current;
    const ball = ballRef.current;

    // NUEVO: Usar algoritmo local SIN latencia
    const targetY = getLocalAIMove(ball, paddle, CANVAS_HEIGHT, 'medium');

    // Smooth movement hacia target
    const diff = targetY - paddle.y;
    paddle.y += diff * 0.08;

    // Mantener paleta en límites
    paddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - paddle.height, paddle.y));
  }, []);

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

      // NUEVO: Recolectar evento de rebote
      if (gameEventsRef.current.length < 5000) { // Límite para no saturar
        gameEventsRef.current.push({
          timestamp: Date.now() - gameStartTimeRef.current,
          ball_x: ball.x,
          ball_y: ball.y,
          ball_vx: ball.vx,
          ball_vy: ball.vy,
          player_paddle_y: playerPaddle.y,
          opponent_paddle_y: opponentPaddle.y,
          rally_count: currentRalliesRef.current,
          event_type: 'wall_bounce'
        });
      }
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

      // NUEVO: Recolectar evento de golpe de paleta
      if (gameEventsRef.current.length < 5000) {
        gameEventsRef.current.push({
          timestamp: Date.now() - gameStartTimeRef.current,
          ball_x: ball.x,
          ball_y: ball.y,
          ball_vx: ball.vx,
          ball_vy: ball.vy,
          player_paddle_y: playerPaddle.y,
          opponent_paddle_y: opponentPaddle.y,
          rally_count: currentRalliesRef.current,
          event_type: 'paddle_hit'
        });
      }
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

      // NUEVO: Recolectar evento de golpe de paleta (oponente)
      if (gameEventsRef.current.length < 5000) {
        gameEventsRef.current.push({
          timestamp: Date.now() - gameStartTimeRef.current,
          ball_x: ball.x,
          ball_y: ball.y,
          ball_vx: ball.vx,
          ball_vy: ball.vy,
          player_paddle_y: playerPaddle.y,
          opponent_paddle_y: opponentPaddle.y,
          rally_count: currentRalliesRef.current,
          event_type: 'paddle_hit'
        });
      }
    }

    // Update opponent AI
    updateOpponent();

    // NUEVO: Recolectar muestra de frame cada ~10 frames (para no saturar)
    if (Math.random() < 0.1 && gameEventsRef.current.length < 5000) {
      gameEventsRef.current.push({
        timestamp: Date.now() - gameStartTimeRef.current,
        ball_x: ball.x,
        ball_y: ball.y,
        ball_vx: ball.vx,
        ball_vy: ball.vy,
        player_paddle_y: playerPaddle.y,
        opponent_paddle_y: opponentPaddle.y,
        rally_count: currentRalliesRef.current
      });
    }

    // Score points
    if (ball.x < 0) {
      setOpponentScore(s => {
        const newScore = s + 1;
        // NUEVO: Recolectar evento de anotación
        gameEventsRef.current.push({
          timestamp: Date.now() - gameStartTimeRef.current,
          ball_x: ball.x,
          ball_y: ball.y,
          ball_vx: ball.vx,
          ball_vy: ball.vy,
          player_paddle_y: playerPaddle.y,
          opponent_paddle_y: opponentPaddle.y,
          rally_count: currentRalliesRef.current,
          event_type: 'score'
        });

        if (newScore >= WINNING_SCORE) {
          setGameState('ended');
          setTimeout(() => {
            // NUEVO: Enviar training_data
            const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            onGameEnd(rallies, false, 0, gameTime, {
              opponent_score: newScore,
              training_data: {
                game_id: 'pong',
                moves_sequence: gameEventsRef.current,
                final_board_state: {
                  final_score: playerScore,
                  opponent_score: newScore,
                  total_rallies: rallies
                },
                critical_moments: gameEventsRef.current.filter(e => e.event_type),
                player_won: false
              }
            });
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
        // NUEVO: Recolectar evento de anotación
        gameEventsRef.current.push({
          timestamp: Date.now() - gameStartTimeRef.current,
          ball_x: ball.x,
          ball_y: ball.y,
          ball_vx: ball.vx,
          ball_vy: ball.vy,
          player_paddle_y: playerPaddle.y,
          opponent_paddle_y: opponentPaddle.y,
          rally_count: currentRalliesRef.current,
          event_type: 'score'
        });

        if (newScore >= WINNING_SCORE) {
          setGameState('ended');
          setTimeout(() => {
            // NUEVO: Enviar training_data
            const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            onGameEnd(rallies, true, 0, gameTime, {
              opponent_score: opponentScore,
              training_data: {
                game_id: 'pong',
                moves_sequence: gameEventsRef.current,
                final_board_state: {
                  final_score: newScore,
                  opponent_score: opponentScore,
                  total_rallies: rallies
                },
                critical_moments: gameEventsRef.current.filter(e => e.event_type),
                player_won: true
              }
            });
          }, 500);
        } else {
          resetBall(-1);
        }
        return newScore;
      });
    }
  }, [gameState, onGameEnd, resetBall, updateOpponent, rallies, opponentScore, playerScore]);

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
          {/* NUEVO: Indicador de IA predictiva local (sin latencia) */}
          <div className="flex items-center gap-1 bg-purple-900/30 border border-purple-500/50 px-2 py-1 rounded-sm">
            <span className="text-purple-400 text-xs">🤖 Predictive AI</span>
          </div>
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
