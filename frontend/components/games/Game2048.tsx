"use client";
import { useState, useEffect, useCallback } from 'react';

interface Game2048Props {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

export default function Game2048({ isAuthenticated, onGameEnd }: Game2048Props) {
  const [grid, setGrid] = useState<number[][]>(Array(4).fill(null).map(() => Array(4).fill(0)));
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [maxTile, setMaxTile] = useState(0);
  const [moves, setMoves] = useState(0);

  const getEmptyCells = useCallback((g: number[][]) => {
    const empty: [number, number][] = [];
    g.forEach((row, r) => row.forEach((cell, c) => { if (cell === 0) empty.push([r, c]); }));
    return empty;
  }, []);

  const addRandomTile = useCallback((g: number[][]) => {
    const empty = getEmptyCells(g);
    if (empty.length === 0) return g;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const newG = g.map(row => [...row]);
    newG[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newG;
  }, [getEmptyCells]);

  const slideLeft = useCallback((row: number[]) => {
    const filtered = row.filter(x => x !== 0);
    const merged: number[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        setScore(s => s + filtered[i] * 2);
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    while (merged.length < 4) merged.push(0);
    return merged;
  }, []);

  const moveLeft = useCallback((g: number[][]) => {
    return g.map(row => slideLeft(row));
  }, [slideLeft]);

  const moveRight = useCallback((g: number[][]) => {
    return g.map(row => slideLeft(row.reverse()).reverse());
  }, [slideLeft]);

  const moveUp = useCallback((g: number[][]) => {
    const transposed = g[0].map((_, i) => g.map(row => row[i]));
    return moveLeft(transposed)[0].map((_, i) => transposed.map(row => row[i]));
  }, [moveLeft]);

  const moveDown = useCallback((g: number[][]) => {
    const transposed = g[0].map((_, i) => g.map(row => row[i]));
    return moveRight(transposed)[0].map((_, i) => transposed.map(row => row[i]));
  }, [moveRight]);

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameState !== 'playing') return;

    setGrid(prevGrid => {
      let newGrid;
      switch (direction) {
        case 'left': newGrid = moveLeft(prevGrid); break;
        case 'right': newGrid = moveRight(prevGrid); break;
        case 'up': newGrid = moveUp(prevGrid); break;
        case 'down': newGrid = moveDown(prevGrid); break;
      }

      if (JSON.stringify(prevGrid) !== JSON.stringify(newGrid)) {
        setMoves(m => m + 1);
        newGrid = addRandomTile(newGrid);

        const max = Math.max(...newGrid.flat());
        setMaxTile(max);

        if (max >= 2048) {
          setGameState('ended');
          onGameEnd(score, true, moves + 1, 0, { max_tile: max });
        }

        if (getEmptyCells(newGrid).length === 0 && !canMove(newGrid)) {
          setGameState('ended');
          onGameEnd(score, false, moves + 1, 0, { max_tile: max });
        }
      }

      return newGrid;
    });
  }, [gameState, moveLeft, moveRight, moveUp, moveDown, addRandomTile, getEmptyCells, score, moves, onGameEnd]);

  const canMove = (g: number[][]) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g[r][c] === 0) return true;
        if (c < 3 && g[r][c] === g[r][c + 1]) return true;
        if (r < 3 && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  };

  const startGame = () => {
    let newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
    newGrid = addRandomTile(addRandomTile(newGrid));
    setGrid(newGrid);
    setScore(0);
    setMaxTile(0);
    setMoves(0);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft': move('left'); break;
        case 'ArrowRight': move('right'); break;
        case 'ArrowUp': move('up'); break;
        case 'ArrowDown': move('down'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, move]);

  const getTileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: 'bg-gray-800',
      2: 'bg-orange-900',
      4: 'bg-orange-800',
      8: 'bg-orange-700',
      16: 'bg-orange-600',
      32: 'bg-red-700',
      64: 'bg-red-600',
      128: 'bg-yellow-600',
      256: 'bg-yellow-500',
      512: 'bg-yellow-400',
      1024: 'bg-green-600',
      2048: 'bg-green-500',
    };
    return colors[value] || 'bg-purple-600';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">2048</p>
          <p className="text-gray-400 text-sm">Combina números para llegar a 2048</p>
          <button onClick={startGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3">
            Comenzar
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <p className="text-orange-400">Puntuación: {score} | Movimientos: {moves}</p>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className={maxTile >= 2048 ? 'text-green-400' : 'text-red-400'}>
            {maxTile >= 2048 ? '¡Ganaste!' : 'Game Over'}
          </p>
          <p className="text-gray-400">Mayor tile: {maxTile}</p>
          <button onClick={startGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2">
            Jugar de nuevo
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 p-3 bg-gray-900 border-2 border-orange-900">
        {grid.flat().map((cell, i) => (
          <div
            key={i}
            className={`w-16 h-16 md:w-20 md:h-20 ${getTileColor(cell)} flex items-center justify-center text-xl md:text-2xl font-bold`}
          >
            {cell || ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 md:hidden">
        <button onClick={() => move('up')} className="bg-gray-700 p-4">↑</button>
        <div></div>
        <button onClick={() => move('down')} className="bg-gray-700 p-4">↓</button>
        <button onClick={() => move('left')} className="bg-gray-700 p-4">←</button>
        <div></div>
        <button onClick={() => move('right')} className="bg-gray-700 p-4">→</button>
      </div>
    </div>
  );
}
