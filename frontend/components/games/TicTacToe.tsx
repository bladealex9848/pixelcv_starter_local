"use client";
import { useState, useCallback, useEffect } from 'react';

interface TicTacToeProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Player = 'X' | 'O' | null;
type Board = Player[];

export default function TicTacToe({ isAuthenticated, onGameEnd }: TicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState<Player>(null);
  const [aiEnabled, setAiEnabled] = useState(false);

  const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  // Verificar disponibilidad de IA al montar
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/ai/status`)
      .then(res => res.json())
      .then(data => setAiEnabled(data.available))
      .catch(() => setAiEnabled(false));
  }, []);

  const checkWinner = (board: Board): Player => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const isBoardFull = (board: Board) => board.every(cell => cell !== null);

  const minimax = useCallback((board: Board, isMaximizing: boolean): number => {
    const winner = checkWinner(board);
    if (winner === 'O') return 10;
    if (winner === 'X') return -10;
    if (isBoardFull(board)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          const score = minimax(board, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          const score = minimax(board, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, []);

  const getAIMoveFromOllama = useCallback(async (currentBoard: Board): Promise<number | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/ai/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'tictactoe',
          game_state: { board: currentBoard, player: 'O' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.move && data.move.position !== undefined) {
          return data.move.position;
        }
      }
    } catch {
      // Silencioso - usa fallback local
    }
    return null;
  }, []);

  const makeAIMove = useCallback(async () => {
    let bestMove = -1;

    // Intentar obtener movimiento de Ollama primero
    if (aiEnabled) {
      const ollamaMove = await getAIMoveFromOllama(board);
      if (ollamaMove !== null && board[ollamaMove] === null) {
        bestMove = ollamaMove;
      }
    }

    // Fallback a minimax local
    if (bestMove === -1) {
      let bestScore = -Infinity;

      // Add some randomness to make AI beatable sometimes
      if (Math.random() < 0.2) {
        const available = board.map((cell, i) => cell === null ? i : -1).filter(i => i !== -1);
        if (available.length > 0) {
          bestMove = available[Math.floor(Math.random() * available.length)];
        }
      } else {
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            const newBoard = [...board];
            newBoard[i] = 'O';
            const score = minimax(newBoard, false);
            if (score > bestScore) {
              bestScore = score;
              bestMove = i;
            }
          }
        }
      }
    }

    if (bestMove !== -1) {
      const newBoard = [...board];
      newBoard[bestMove] = 'O';
      setBoard(newBoard);
      setMoves(m => m + 1);
      setIsPlayerTurn(true);

      const win = checkWinner(newBoard);
      if (win) {
        setWinner(win);
        setGameState('ended');
        onGameEnd(0, win === 'X', moves + 1, 0, {});
      } else if (isBoardFull(newBoard)) {
        setGameState('ended');
        onGameEnd(0, false, moves + 1, 0, {});
      }
    }
  }, [board, minimax, moves, onGameEnd, aiEnabled, getAIMoveFromOllama]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlayerTurn) {
      const timer = setTimeout(makeAIMove, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, isPlayerTurn, makeAIMove]);

  const handleCellClick = (index: number) => {
    if (gameState !== 'playing' || !isPlayerTurn || board[index] !== null) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setMoves(m => m + 1);

    const win = checkWinner(newBoard);
    if (win) {
      setWinner(win);
      setGameState('ended');
      onGameEnd(0, win === 'X', moves + 1, 0, {});
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameState('ended');
      onGameEnd(0, false, moves + 1, 0, {});
      return;
    }

    setIsPlayerTurn(false);
  };

  const startNewGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameState('playing');
    setMoves(0);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Tic Tac Toe</p>
          <p className="text-gray-400 text-sm">Juegas como X contra la IA (O)</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Comenzar
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="text-center space-y-1">
          <p className={isPlayerTurn ? 'text-orange-400' : 'text-red-400'}>
            {isPlayerTurn ? 'Tu turno (X)' : 'Turno de la IA (O)...'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-500 text-xs">Movimientos: {moves}</p>
            {aiEnabled ? (
              <div className="flex items-center gap-1 bg-green-900/30 border border-green-500/50 px-2 py-0.5 rounded-sm">
                <span className="text-green-400 text-[10px]">🤖 AI</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-gray-900/30 border border-gray-700 px-2 py-0.5 rounded-sm">
                <span className="text-gray-500 text-[10px]">🤖 Local</span>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className={winner === 'X' ? 'text-green-400 text-xl' : winner === 'O' ? 'text-red-400 text-xl' : 'text-yellow-400 text-xl'}>
            {winner === 'X' ? '¡GANASTE!' : winner === 'O' ? 'La IA ganó' : '¡Empate!'}
          </p>
          <p className="text-gray-400 text-sm">Movimientos: {moves}</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 transition-colors"
          >
            Jugar de nuevo
          </button>
        </div>
      )}

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-black border-2 border-orange-900">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={gameState !== 'playing' || cell !== null}
            className={`w-24 h-24 md:w-32 md:h-32 flex items-center justify-center text-5xl md:text-6xl font-black transition-all duration-200
              ${cell === 'X' ? 'text-orange-400' : cell === 'O' ? 'text-red-400' : 'text-gray-700'}
              ${!cell && gameState === 'playing' ? 'hover:bg-orange-900/30' : ''}
              ${cell ? 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' : ''}
            `}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Instructions */}
      {gameState === 'menu' && (
        <p className="text-gray-500 text-xs text-center max-w-md">
          Consigue 3 en línea para ganar. La IA usa el algoritmo Minimax, ¡así que será difícil!
        </p>
      )}
    </div>
  );
}
