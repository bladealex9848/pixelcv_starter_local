"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface ChineseCheckersProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Player = 'R' | 'B' | null; // Red y Blue
type Board = Player[];

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  from: number;
  to: number;
  captures: number[];
  timestamp: number;
  board_state: Board;
}

export default function ChineseCheckers({ isAuthenticated, onGameEnd }: ChineseCheckersProps) {
  const BOARD_SIZE = 8;
  const [board, setBoard] = useState<Board>(() => {
    // Inicializar tablero 8x8 con piezas en posiciones iniciales
    const initialBoard = Array(64).fill(null);
    // Piezas rojas (jugador) - filas superiores
    for (let i = 8; i < 16; i++) {
      initialBoard[i] = 'R';
    }
    // Piezas azules (IA) - filas inferiores
    for (let i = 48; i < 56; i++) {
      initialBoard[i] = 'B';
    }
    return initialBoard;
  });

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState<Player>(null);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [captures, setCaptures] = useState<number>(0);

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  const indexToCoord = (index: number): [number, number] => [
    Math.floor(index / BOARD_SIZE),
    index % BOARD_SIZE
  ];

  const coordToIndex = (row: number, col: number): number => row * BOARD_SIZE + col;

  const getAdjacentMoves = (from: number): number[] => {
    const [row, col] = indexToCoord(from);
    const moves: number[] = [];

    // Movimientos ortogonales (arriba, abajo, izquierda, derecha)
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        const newIndex = coordToIndex(newRow, newCol);
        if (board[newIndex] === null) {
          moves.push(newIndex);
        }
      }
    }

    return moves;
  };

  const getJumpMoves = (from: number, currentBoard: Board = board): { moves: number[]; captured: number[] } => {
    const [row, col] = indexToCoord(from);
    const player = currentBoard[from];
    if (!player) return { moves: [], captured: [] };

    const jumps: number[] = [];
    const captured: number[] = [];

    // Movimientos ortogonales con salto
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    for (const [dr, dc] of directions) {
      const midRow = row + dr;
      const midCol = col + dc;
      const endRow = row + 2 * dr;
      const endCol = col + 2 * dc;

      if (endRow >= 0 && endRow < BOARD_SIZE && endCol >= 0 && endCol < BOARD_SIZE) {
        const midIndex = coordToIndex(midRow, midCol);
        const endIndex = coordToIndex(endRow, endCol);

        if (currentBoard[midIndex] && currentBoard[midIndex] !== player && currentBoard[endIndex] === null) {
          jumps.push(endIndex);
          captured.push(midIndex);
        }
      }
    }

    return { moves: jumps, captured };
  };

  const getValidMoves = (from: number): { moves: number[]; captures: number[] } => {
    const player = board[from];
    if (!player || player !== (isPlayerTurn ? 'R' : 'B')) return { moves: [], captures: [] };

    // Primero verificar si hay saltos disponibles
    const jumps = getJumpMoves(from);
    if (jumps.moves.length > 0) {
      return { moves: jumps.moves, captures: jumps.captured };
    }

    // Si no hay saltos, movimientos normales
    const adjacent = getAdjacentMoves(from);
    return { moves: adjacent, captures: [] };
  };

  const checkWinner = (currentBoard: Board): Player => {
    // Verificar si el jugador rojo llegó al final
    for (let i = 0; i < 8; i++) {
      if (currentBoard[i] === 'R') {
        return 'R';
      }
    }

    // Verificar si el jugador azul llegó al final
    for (let i = 56; i < 64; i++) {
      if (currentBoard[i] === 'B') {
        return 'B';
      }
    }

    return null;
  };

  // Algoritmo Minimax para IA
  const minimax = useCallback((currentBoard: Board, depth: number, isMaximizing: boolean): number => {
    const winner = checkWinner(currentBoard);
    if (winner === 'B') return 10 - depth;
    if (winner === 'R') return -10 + depth;
    if (depth === 4) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 64; i++) {
        if (currentBoard[i] === 'B') {
          const moves = getValidMoves(i);
          for (const move of moves.moves) {
            const newBoard = [...currentBoard];
            newBoard[i] = null;
            newBoard[move] = 'B';
            const score = minimax(newBoard, depth + 1, false);
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 64; i++) {
        if (currentBoard[i] === 'R') {
          const moves = getValidMoves(i);
          for (const move of moves.moves) {
            const newBoard = [...currentBoard];
            newBoard[i] = null;
            newBoard[move] = 'R';
            const score = minimax(newBoard, depth + 1, true);
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  }, [board]);

  // Movimiento de la IA
  const makeAIMove = useCallback(() => {
    let bestMove = -1;
    let bestScore = -Infinity;
    let selectedPiece = -1;

    // Buscar el mejor movimiento
    for (let i = 0; i < 64; i++) {
      if (board[i] === 'B') {
        const validMoves = getValidMoves(i);
        for (const move of validMoves.moves) {
          const newBoard = [...board];
          newBoard[i] = null;
          newBoard[move] = 'B';
          const score = minimax(newBoard, 0, false);

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
            selectedPiece = i;
          }
        }
      }
    }

    if (bestMove !== -1 && selectedPiece !== -1) {
      // Recolectar movimiento de IA
      const captured = board[selectedPiece] ? getJumpMoves(selectedPiece).captured : [];

      movesRef.current.push({
        from: selectedPiece,
        to: bestMove,
        captures: captured,
        timestamp: Date.now() - gameStartTimeRef.current,
        board_state: [...board]
      });

      const newBoard = [...board];
      newBoard[selectedPiece] = null;
      newBoard[bestMove] = 'B';
      setBoard(newBoard);
      setMoves(m => m + 1);
      setIsPlayerTurn(true);
      setSelectedPiece(null);
      setValidMoves([]);

      const win = checkWinner(newBoard);
      if (win) {
        setWinner(win);
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, win === 'R', moves + 1, gameTime, {
          training_data: {
            game_id: 'chinese_checkers',
            moves_sequence: movesRef.current,
            final_board_state: { board: newBoard },
            player_won: win === 'R'
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
    if (gameState !== 'playing' || !isPlayerTurn) return;

    const piece = board[index];

    // Si no hay pieza seleccionada
    if (selectedPiece === null) {
      if (piece === 'R') {
        const validMoves = getValidMoves(index);
        if (validMoves.moves.length > 0) {
          setSelectedPiece(index);
          setValidMoves(validMoves.moves);
          setCaptures(validMoves.captures.length);
        }
      }
      return;
    }

    // Si hace clic en la misma pieza, deseleccionar
    if (index === selectedPiece) {
      setSelectedPiece(null);
      setValidMoves([]);
      setCaptures(0);
      return;
    }

    // Si hace clic en un movimiento válido
    if (validMoves.includes(index)) {
      // Recolectar movimiento del jugador
      movesRef.current.push({
        from: selectedPiece,
        to: index,
        captures: captures > 0 ? getJumpMoves(selectedPiece).captured : [],
        timestamp: Date.now() - gameStartTimeRef.current,
        board_state: [...board]
      });

      const newBoard = [...board];
      newBoard[selectedPiece] = null;
      newBoard[index] = 'R';
      setBoard(newBoard);
      setMoves(m => m + 1);
      setSelectedPiece(null);
      setValidMoves([]);
      setCaptures(0);

      const win = checkWinner(newBoard);
      if (win) {
        setWinner(win);
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, win === 'R', moves + 1, gameTime, {
          training_data: {
            game_id: 'chinese_checkers',
            moves_sequence: movesRef.current,
            final_board_state: { board: newBoard },
            player_won: true
          }
        });
        return;
      }

      setIsPlayerTurn(false);
    } else if (piece === 'R') {
      // Seleccionar otra pieza
      const validMoves = getValidMoves(index);
      if (validMoves.moves.length > 0) {
        setSelectedPiece(index);
        setValidMoves(validMoves.moves);
        setCaptures(validMoves.captures.length);
      }
    }
  };

  const startNewGame = () => {
    const initialBoard = Array(64).fill(null);
    for (let i = 8; i < 16; i++) {
      initialBoard[i] = 'R';
    }
    for (let i = 48; i < 56; i++) {
      initialBoard[i] = 'B';
    }
    setBoard(initialBoard);
    setIsPlayerTurn(true);
    setGameState('playing');
    setMoves(0);
    setWinner(null);
    setSelectedPiece(null);
    setValidMoves([]);
    setCaptures(0);
    movesRef.current = [];
    gameStartTimeRef.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Damas Chinas</p>
          <p className="text-gray-400 text-sm">Mueve tus piezas rojas al lado opuesto para ganar</p>
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
            {isPlayerTurn ? 'Tu turno (Rojo)' : 'Turno de la IA (Azul)...'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-500 text-xs">Movimientos: {moves}</p>
            <div className="flex items-center gap-1 bg-purple-900/30 border border-purple-500/50 px-2 py-0.5 rounded-sm">
              <span className="text-purple-400 text-[10px]">🤖 Minimax AI</span>
            </div>
          </div>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className={winner === 'R' ? 'text-green-400 text-xl' : winner === 'B' ? 'text-red-400 text-xl' : 'text-yellow-400 text-xl'}>
            {winner === 'R' ? '¡GANASTE!' : winner === 'B' ? 'La IA ganó' : '¡Empate!'}
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
      <div className="grid grid-cols-8 gap-1 p-4 bg-black border-2 border-orange-900">
        {board.map((cell, index) => {
          const isSelected = selectedPiece === index;
          const isValidMove = validMoves.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={gameState !== 'playing' || (!isPlayerTurn && !isSelected)}
              className={`
                w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl font-bold transition-all duration-200
                ${cell === 'R' ? 'text-red-500' : cell === 'B' ? 'text-blue-500' : 'text-gray-800'}
                ${isSelected ? 'bg-orange-600' : ''}
                ${isValidMove ? 'bg-green-600/50 border-2 border-green-400' : ''}
                ${!cell && gameState === 'playing' ? 'hover:bg-orange-900/30' : ''}
                ${cell ? 'shadow-[0_0_10px_rgba(249,115,22,0.5)]' : ''}
                border border-gray-700
              `}
            >
              {cell === 'R' ? '●' : cell === 'B' ? '●' : ''}
            </button>
          );
        })}
      </div>

      {/* Instructions */}
      {gameState === 'menu' && (
        <p className="text-gray-500 text-xs text-center max-w-md">
          Mueve tus piezas rojas al lado superior del tablero. Puedes moverte ortogonalmente o saltar sobre piezas enemigas para capturar. ¡El primero en llegar al lado opuesto gana!
        </p>
      )}
    </div>
  );
}
