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
  const [playerCaptures, setPlayerCaptures] = useState<number>(0);
  const [aiCaptures, setAiCaptures] = useState<number>(0);

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  const indexToCoord = (index: number): [number, number] => [
    Math.floor(index / BOARD_SIZE),
    index % BOARD_SIZE
  ];

  const coordToIndex = (row: number, col: number): number => row * BOARD_SIZE + col;

  const getAdjacentMoves = (from: number, currentBoard: Board = board): number[] => {
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
        if (currentBoard[newIndex] === null) {
          moves.push(newIndex);
        }
      }
    }

    return moves;
  };

  const getJumpMoves = (from: number, currentBoard: Board = board): { moves: number[]; captured: Map<number, number> } => {
    const [row, col] = indexToCoord(from);
    const player = currentBoard[from];
    if (!player) return { moves: [], captured: new Map() };

    const jumps: number[] = [];
    const capturedMap = new Map<number, number>();

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
          capturedMap.set(endIndex, midIndex);
        }
      }
    }

    return { moves: jumps, captured: capturedMap };
  };

  const getValidMovesData = (from: number, currentBoard: Board = board): { moves: number[]; captures: Map<number, number> } => {
    const player = currentBoard[from];
    if (!player || player !== (isPlayerTurn ? 'R' : 'B')) return { moves: [], captures: new Map() };

    // Primero verificar si hay saltos disponibles (obligatorios en damas tradicionales, pero aquí los dejamos opcionales)
    const jumps = getJumpMoves(from, currentBoard);
    if (jumps.moves.length > 0) {
      return { moves: jumps.moves, captures: jumps.captured };
    }

    // Si no hay saltos, movimientos normales
    const adjacent = getAdjacentMoves(from, currentBoard);
    return { moves: adjacent, captures: new Map() };
  };

  const checkWinner = (currentBoard: Board): Player => {
    // 1. Victoria por captura total
    const redPieces = currentBoard.filter(p => p === 'R').length;
    const bluePieces = currentBoard.filter(p => p === 'B').length;
    if (bluePieces === 0) return 'R';
    if (redPieces === 0) return 'B';

    // 2. Victoria por llegar al final (Meta)
    // Rojo (Jugador) gana si llega a la fila superior (0-7)
    for (let i = 0; i < 8; i++) {
      if (currentBoard[i] === 'R') return 'R';
    }

    // Azul (IA) gana si llega a la fila inferior (56-63)
    for (let i = 56; i < 64; i++) {
      if (currentBoard[i] === 'B') return 'B';
    }

    return null;
  };

  // Movimiento de la IA
  const makeAIMove = useCallback(() => {
    let bestMove = -1;
    let bestScore = -Infinity;
    let bestPiece = -1;
    let capturedPieceIdx = -1;

    // IA simple: priorizar capturas, luego avanzar hacia la meta
    for (let i = 0; i < 64; i++) {
      if (board[i] === 'B') {
        const data = getValidMovesData(i);
        for (const move of data.moves) {
          let score = 0;
          const captured = data.captures.get(move);
          
          if (captured !== undefined) score += 50; // Prioridad alta a capturar
          
          // Puntuación por avance (Azul quiere ir a filas mayores)
          const [row] = indexToCoord(move);
          score += row; 

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
            bestPiece = i;
            capturedPieceIdx = captured !== undefined ? captured : -1;
          }
        }
      }
    }

    if (bestMove !== -1 && bestPiece !== -1) {
      const newBoard = [...board];
      newBoard[bestPiece] = null;
      newBoard[bestMove] = 'B';
      if (capturedPieceIdx !== -1) {
        newBoard[capturedPieceIdx] = null;
        setAiCaptures(prev => prev + 1);
      }
      
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
          training_data: { game_id: 'chinese_checkers', player_won: win === 'R' }
        });
      }
    }
  }, [board, moves, onGameEnd]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlayerTurn) {
      const timer = setTimeout(makeAIMove, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState, isPlayerTurn, makeAIMove]);

  const handleCellClick = (index: number) => {
    if (gameState !== 'playing' || !isPlayerTurn) return;

    const piece = board[index];

    // Si no hay pieza seleccionada
    if (selectedPiece === null) {
      if (piece === 'R') {
        const data = getValidMovesData(index);
        if (data.moves.length > 0) {
          setSelectedPiece(index);
          setValidMoves(data.moves);
        }
      }
      return;
    }

    // Si hace clic en la misma pieza, deseleccionar
    if (index === selectedPiece) {
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    // Si hace clic en un movimiento válido
    if (validMoves.includes(index)) {
      const data = getValidMovesData(selectedPiece);
      const captured = data.captures.get(index);

      const newBoard = [...board];
      newBoard[selectedPiece] = null;
      newBoard[index] = 'R';
      
      if (captured !== undefined) {
        newBoard[captured] = null;
        setPlayerCaptures(prev => prev + 1);
      }

      setBoard(newBoard);
      setMoves(m => m + 1);
      setSelectedPiece(null);
      setValidMoves([]);

      const win = checkWinner(newBoard);
      if (win) {
        setWinner(win);
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, win === 'R', moves + 1, gameTime, {
          training_data: { game_id: 'chinese_checkers', player_won: true }
        });
        return;
      }

      setIsPlayerTurn(false);
    } else if (piece === 'R') {
      const data = getValidMovesData(index);
      if (data.moves.length > 0) {
        setSelectedPiece(index);
        setValidMoves(data.moves);
      }
    }
  };

  const startNewGame = () => {
    const initialBoard = Array(64).fill(null);
    for (let i = 8; i < 16; i++) initialBoard[i] = 'R';
    for (let i = 48; i < 56; i++) initialBoard[i] = 'B';
    setBoard(initialBoard);
    setIsPlayerTurn(true);
    setGameState('playing');
    setMoves(0);
    setWinner(null);
    setSelectedPiece(null);
    setValidMoves([]);
    setPlayerCaptures(0);
    setAiCaptures(0);
    gameStartTimeRef.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl font-bold">DAMAS CHINAS</p>
          <p className="text-gray-400 text-sm">Captura las piezas de la IA o llega al lado opuesto para ganar</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            COMENZAR JUEGO
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between items-center bg-gray-900/50 p-3 border border-orange-900/30 rounded">
            <div className="text-center">
              <p className="text-red-500 text-xs font-bold uppercase">Tú (Rojo)</p>
              <p className="text-2xl font-black text-white">{playerCaptures}</p>
              <p className="text-[10px] text-gray-500">CAPTURES</p>
            </div>
            <div className="text-center px-4 border-x border-gray-800">
              <p className={isPlayerTurn ? 'text-orange-400 text-sm animate-pulse font-bold' : 'text-gray-600 text-sm'}>
                {isPlayerTurn ? 'TU TURNO' : 'IA PENSANDO...'}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 font-mono">MOVIMIENTOS: {moves}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-500 text-xs font-bold uppercase">IA (Azul)</p>
              <p className="text-2xl font-black text-white">{aiCaptures}</p>
              <p className="text-[10px] text-gray-500">CAPTURES</p>
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
      <div className="grid grid-cols-8 gap-1 p-4 bg-black border-4 border-orange-900 shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-lg">
        {board.map((cell, index) => {
          const isSelected = selectedPiece === index;
          const isValidMove = validMoves.includes(index);
          const [row, col] = indexToCoord(index);
          const isDark = (row + col) % 2 === 1;

          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={gameState !== 'playing' || (!isPlayerTurn && !isSelected)}
              className={`
                w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center text-3xl font-bold transition-all duration-300
                ${isDark ? 'bg-gray-900/40' : 'bg-gray-800/20'}
                ${cell === 'R' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : cell === 'B' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'text-transparent'}
                ${isSelected ? 'bg-orange-600/40 border-2 border-orange-500 z-10 scale-110' : ''}
                ${isValidMove ? 'bg-green-600/30 border-2 border-green-400 animate-pulse' : ''}
                ${!cell && gameState === 'playing' ? 'hover:bg-orange-900/20' : ''}
                border border-gray-800/50
              `}
            >
              {cell ? '●' : ''}
            </button>
          );
        })}
      </div>

      {/* Instructions Summary */}
      {gameState === 'menu' && (
        <div className="bg-orange-900/10 p-4 border border-orange-900/20 rounded max-w-md text-center">
          <p className="text-gray-400 text-xs leading-relaxed">
            Mueve tus fichas <span className="text-red-500 font-bold">Rojas</span>. 
            Salta sobre las <span className="text-blue-500 font-bold">Azules</span> para capturarlas. 
            Llega a la fila superior o captura todas las piezas para ganar.
          </p>
        </div>
      )}
    </div>
  );
}
