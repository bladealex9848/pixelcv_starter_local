"use client";
import { useEffect, useRef, useState, useCallback } from 'react';

interface TetrisGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

const TETROMINOES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
];

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

export default function TetrisGame({ isAuthenticated, onGameEnd }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');

  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30;

  const boardRef = useRef<number[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
  const currentPieceRef = useRef<{
    shape: number[][];
    x: number;
    y: number;
    color: string;
  } | null>(null);

  const createPiece = useCallback(() => {
    const idx = Math.floor(Math.random() * TETROMINOES.length);
    return {
      shape: TETROMINOES[idx],
      x: Math.floor(COLS / 2) - 1,
      y: 0,
      color: COLORS[idx],
    };
  }, []);

  const isValidMove = useCallback((piece: { shape: number[][]; x: number; y: number }, offsetX = 0, offsetY = 0) => {
    return piece.shape.every((row, dy) =>
      row.every((cell, dx) => {
        if (!cell) return true;
        const newX = piece.x + dx + offsetX;
        const newY = piece.y + dy + offsetY;
        return newX >= 0 && newX < COLS && newY < ROWS && (newY < 0 || !boardRef.current[newY][newX]);
      })
    );
  }, []);

  const mergePiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    piece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell && piece.y + dy >= 0) {
          boardRef.current[piece.y + dy][piece.x + dx] = 1;
        }
      });
    });

    // Clear lines
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (boardRef.current[y].every(cell => cell)) {
        boardRef.current.splice(y, 1);
        boardRef.current.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
      }
    }

    if (linesCleared > 0) {
      setScore(s => s + linesCleared * 100);
    }

    const newPiece = createPiece();
    currentPieceRef.current = newPiece;

    if (!isValidMove(newPiece)) {
      setGameState('ended');
      onGameEnd(score, false, 0, 0, {});
    }
  }, [createPiece, isValidMove, score, onGameEnd]);

  const rotatePiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
    const newPiece = { ...piece, shape: rotated };

    if (isValidMove(newPiece)) {
      currentPieceRef.current = newPiece;
    }
  }, [isValidMove]);

  const movePiece = useCallback((dir: number) => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    if (isValidMove(piece, dir, 0)) {
      piece.x += dir;
    }
  }, [isValidMove]);

  const dropPiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    if (isValidMove(piece, 0, 1)) {
      piece.y++;
      setScore(s => s + 1);
    } else {
      mergePiece();
    }
  }, [isValidMove, mergePiece]);

  const startGame = () => {
    boardRef.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    currentPieceRef.current = createPiece();
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const dropInterval = setInterval(() => {
      dropPiece();
    }, 1000);

    return () => clearInterval(dropInterval);
  }, [gameState, dropPiece]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

      // Draw board
      boardRef.current.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            ctx.fillStyle = '#666';
            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
          }
        });
      });

      // Draw current piece
      const piece = currentPieceRef.current;
      if (piece) {
        ctx.fillStyle = piece.color;
        piece.shape.forEach((row, dy) => {
          row.forEach((cell, dx) => {
            if (cell) {
              ctx.fillRect(
                (piece.x + dx) * BLOCK_SIZE,
                (piece.y + dy) * BLOCK_SIZE,
                BLOCK_SIZE - 1,
                BLOCK_SIZE - 1
              );
            }
          });
        });
      }
    };

    const animationFrame = requestAnimationFrame(function loop() {
      render();
      requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1); break;
        case 'ArrowRight': movePiece(1); break;
        case 'ArrowDown': dropPiece(); break;
        case 'ArrowUp': rotatePiece(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePiece, dropPiece, rotatePiece]);

  return (
    <div className="flex flex-col items-center gap-4">
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Tetris</p>
          <p className="text-gray-400 text-sm">Completa líneas para ganar puntos</p>
          <button onClick={startGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3">
            Comenzar
          </button>
        </div>
      )}

      {gameState === 'playing' && <p className="text-orange-400">Puntuación: {score}</p>}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className="text-red-400">Game Over</p>
          <p className="text-gray-400">Puntuación: {score}</p>
          <button onClick={startGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2">
            Jugar de nuevo
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={COLS * BLOCK_SIZE}
        height={ROWS * BLOCK_SIZE}
        className="border-2 border-orange-900"
      />
    </div>
  );
}
