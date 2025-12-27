"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface TicTacToeProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Player = 'X' | 'O' | null;
type Board = Player[];

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  position: number;
  timestamp: number;
  board_state: Board;
}

export default function TicTacToe({ isAuthenticated, onGameEnd }: TicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState<Player>(null);

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

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

  // NUEVO: makeAIMove SOLO usa Minimax local (sin llamadas HTTP)
  const makeAIMove = useCallback(() => {
    let bestMove = -1;
    let bestScore = -Infinity;

    // Add some randomness to make AI beatable sometimes
    if (Math.random() < 0.15) {  // 15% chance de movimiento aleatorio
      const available = board.map((cell, i) => cell === null ? i : -1).filter(i => i !== -1);
      if (available.length > 0) {
        bestMove = available[Math.floor(Math.random() * available.length)];
      }
    } else {
      // Usar Minimax para movimiento óptimo
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

    if (bestMove !== -1) {
      // NUEVO: Recolectar movimiento de IA
      movesRef.current.push({
        position: bestMove,
        timestamp: Date.now() - gameStartTimeRef.current,
        board_state: [...board]
      });

      const newBoard = [...board];
      newBoard[bestMove] = 'O';
      setBoard(newBoard);
      setMoves(m => m + 1);
      setIsPlayerTurn(true);

      const win = checkWinner(newBoard);
      if (win) {
        setWinner(win);
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        // NUEVO: Enviar training_data
        onGameEnd(0, win === 'X', moves + 1, gameTime, {
          training_data: {
            game_id: 'tictactoe',
            moves_sequence: movesRef.current,
            final_board_state: { board: newBoard },
            player_won: win === 'X'
          }
        });
      } else if (isBoardFull(newBoard)) {
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        // NUEVO: Enviar training_data
        onGameEnd(0, false, moves + 1, gameTime, {
          training_data: {
            game_id: 'tictactoe',
            moves_sequence: movesRef.current,
            final_board_state: { board: newBoard },
            player_won: false
          }
        });
      }
    }
  }, [board, minimax, moves, onGameEnd]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlayerTurn) {
      const timer = setTimeout(makeAIMove, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, isPlayerTurn, makeAIMove]);

  const handleCellClick = (index: number) => {
    if (gameState !== 'playing' || !isPlayerTurn || board[index] !== null) return;

    // NUEVO: Recolectar movimiento del jugador
    movesRef.current.push({
      position: index,
      timestamp: Date.now() - gameStartTimeRef.current,
      board_state: [...board]
    });

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setMoves(m => m + 1);

    const win = checkWinner(newBoard);
    if (win) {
      setWinner(win);
      setGameState('ended');
      const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      // NUEVO: Enviar training_data
      onGameEnd(0, win === 'X', moves + 1, gameTime, {
        training_data: {
          game_id: 'tictactoe',
          moves_sequence: movesRef.current,
          final_board_state: { board: newBoard },
          player_won: true
        }
      });
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameState('ended');
      const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      // NUEVO: Enviar training_data
      onGameEnd(0, false, moves + 1, gameTime, {
        training_data: {
          game_id: 'tictactoe',
          moves_sequence: movesRef.current,
          final_board_state: { board: newBoard },
          player_won: false
        }
      });
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
    // NUEVO: Limpiar movimientos de entrenamiento y empezar timer
    movesRef.current = [];
    gameStartTimeRef.current = Date.now();
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
            {/* NUEVO: Indicador de IA predictiva local */}
            <div className="flex items-center gap-1 bg-purple-900/30 border border-purple-500/50 px-2 py-0.5 rounded-sm">
              <span className="text-purple-400 text-[10px]">🤖 Minimax AI</span>
            </div>
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
