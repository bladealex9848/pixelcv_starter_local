"use client";
import { useState, useEffect, useCallback } from 'react';

interface MemoryMatchProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

const EMOJIS = ['🎮', '👾', '🕹️', '🏆', '⭐', '🔥', '💎', '🚀'];

export default function MemoryMatch({ isAuthenticated, onGameEnd }: MemoryMatchProps) {
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [startTime, setStartTime] = useState<number>(0);

  const shuffleCards = useCallback(() => {
    const pairs = [...EMOJIS, ...EMOJIS];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return pairs;
  }, []);

  const startGame = () => {
    const shuffled = shuffleCards();
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameState('playing');
    setStartTime(Date.now());
  };

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing') return;
    if (flipped.length === 2) return;
    if (flipped.includes(index)) return;
    if (matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;

      if (cards[first] === cards[second]) {
        setTimeout(() => {
          setMatched(m => [...m, first, second]);
          setFlipped([]);

          if (matched.length + 2 === cards.length) {
            const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
            const score = Math.max(0, 1000 - moves * 10);
            setGameState('ended');
            onGameEnd(score, true, moves, timeSeconds, {});
          }
        }, 500);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Memory Match</p>
          <p className="text-gray-400 text-sm">Encuentra las parejas de cartas</p>
          <button
            onClick={startGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 transition-colors"
          >
            Comenzar
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <p className="text-orange-400">Movimientos: {moves}</p>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className="text-green-400 text-xl">¡Completado!</p>
          <p className="text-gray-400">Movimientos: {moves}</p>
          <p className="text-orange-400">Puntuación: {Math.max(0, 1000 - moves * 10)}</p>
          <button onClick={startGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2">
            Jugar de nuevo
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => handleCardClick(index)}
            disabled={gameState !== 'playing'}
            className={`w-16 h-16 md:w-20 md:h-20 text-3xl md:text-4xl flex items-center justify-center transition-all duration-300
              ${flipped.includes(index) || matched.includes(index) ? 'bg-orange-900/50 border-orange-500' : 'bg-gray-900 border-gray-700'}
              border-2 hover:scale-105
            `}
          >
            {flipped.includes(index) || matched.includes(index) ? card : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}
