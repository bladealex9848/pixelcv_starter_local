"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface ChineseCheckersProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Player = 'R' | 'B' | null; // Red (Player) y Blue (AI)
type Board = Player[];

interface TrainingMove {
  from: number;
  to: number;
  captures: number[];
  timestamp: number;
  board_state: Board;
}

export default function ChineseCheckers({ isAuthenticated, onGameEnd }: ChineseCheckersProps) {
  const BOARD_SIZE = 8;
  
  // Inicialización estilo Damas: Fichas en cuadros oscuros
  const [board, setBoard] = useState<Board>(() => {
    const initialBoard = Array(64).fill(null);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) initialBoard[row * 8 + col] = 'B'; // IA arriba
      }
    }
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) initialBoard[row * 8 + col] = 'R'; // Jugador abajo
      }
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

  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  const indexToCoord = (index: number): [number, number] => [Math.floor(index / 8), index % 8];
  const coordToIndex = (row: number, col: number): number => row * 8 + col;

  // Obtener movimientos y capturas posibles (Diagonales)
  const getPieceMoves = (from: number, currentBoard: Board = board) => {
    const [row, col] = indexToCoord(from);
    const player = currentBoard[from];
    if (!player) return { moves: [], captures: new Map<number, number>() };

    const moves: number[] = [];
    const captures = new Map<number, number>();

    // Direcciones: Rojo sube (-1), Azul baja (+1)
    const rowDir = player === 'R' ? -1 : 1;
    const colDirs = [-1, 1];

    for (const dc of colDirs) {
      // 1. Movimiento simple
      const nextRow = row + rowDir;
      const nextCol = col + dc;
      if (nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8) {
        const nextIdx = coordToIndex(nextRow, nextCol);
        if (currentBoard[nextIdx] === null) {
          moves.push(nextIdx);
        } 
        // 2. Salto (Captura)
        else if (currentBoard[nextIdx] !== player) {
          const jumpRow = nextRow + rowDir;
          const jumpCol = nextCol + dc;
          if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
            const jumpIdx = coordToIndex(jumpRow, jumpCol);
            if (currentBoard[jumpIdx] === null) {
              moves.push(jumpIdx);
              captures.set(jumpIdx, nextIdx);
            }
          }
        }
      }
    }

    return { moves, captures };
  };

  const checkWinner = (currentBoard: Board): Player => {
    const redPieces = currentBoard.filter(p => p === 'R').length;
    const bluePieces = currentBoard.filter(p => p === 'B').length;
    
    if (bluePieces === 0) return 'R';
    if (redPieces === 0) return 'B';
    
    // Opcional: Si alguien no puede mover, pierde (clásico de damas)
    return null;
  };

  const endGame = useCallback((win: Player) => {
    setWinner(win);
    setGameState('ended');
    const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    onGameEnd(playerCaptures * 10, win === 'R', moves, gameTime, {
      final_score: playerCaptures,
      ai_score: aiCaptures
    });
  }, [playerCaptures, aiCaptures, moves, onGameEnd]);

  const makeAIMove = useCallback(() => {
    let bestMove: { from: number, to: number, captured: number | null } | null = null;
    let maxWeight = -Infinity;

    // IA: Priorizar capturas > Avanzar
    for (let i = 0; i < 64; i++) {
      if (board[i] === 'B') {
        const { moves: pMoves, captures } = getPieceMoves(i);
        for (const to of pMoves) {
          const captured = captures.get(to) || null;
          let weight = captured !== null ? 100 : 0;
          const [row] = indexToCoord(to);
          weight += row; // Azul quiere bajar (filas altas)

          if (weight > maxWeight) {
            maxWeight = weight;
            bestMove = { from: i, to, captured };
          }
        }
      }
    }

    if (bestMove) {
      const newBoard = [...board];
      newBoard[bestMove.from] = null;
      newBoard[bestMove.to] = 'B';
      if (bestMove.captured !== null) {
        newBoard[bestMove.captured] = null;
        setAiCaptures(c => c + 1);
      }
      setBoard(newBoard);
      setMoves(m => m + 1);
      setIsPlayerTurn(true);

      const win = checkWinner(newBoard);
      if (win) endGame(win);
    } else {
      // IA no puede mover, gana el jugador
      endGame('R');
    }
  }, [board, endGame]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlayerTurn && !winner) {
      const timer = setTimeout(makeAIMove, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState, isPlayerTurn, winner, makeAIMove]);

  const handleCellClick = (index: number) => {
    if (gameState !== 'playing' || !isPlayerTurn) return;

    if (selectedPiece === null) {
      if (board[index] === 'R') {
        const { moves: pMoves } = getPieceMoves(index);
        if (pMoves.length > 0) {
          setSelectedPiece(index);
          setValidMoves(pMoves);
        }
      }
    } else if (index === selectedPiece) {
      setSelectedPiece(null);
      setValidMoves([]);
    } else if (validMoves.includes(index)) {
      const { captures } = getPieceMoves(selectedPiece);
      const capturedIdx = captures.get(index);

      const newBoard = [...board];
      newBoard[selectedPiece] = null;
      newBoard[index] = 'R';
      if (capturedIdx !== undefined) {
        newBoard[capturedIdx] = null;
        setPlayerCaptures(c => c + 1);
      }

      setBoard(newBoard);
      setMoves(m => m + 1);
      setSelectedPiece(null);
      setValidMoves([]);
      setIsPlayerTurn(false);

      const win = checkWinner(newBoard);
      if (win) endGame(win);
    } else if (board[index] === 'R') {
      const { moves: pMoves } = getPieceMoves(index);
      setSelectedPiece(index);
      setValidMoves(pMoves);
    }
  };

  const startNewGame = () => {
    const initialBoard = Array(64).fill(null);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) initialBoard[row * 8 + col] = 'B';
      }
    }
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) initialBoard[row * 8 + col] = 'R';
      }
    }
    setBoard(initialBoard);
    setPlayerCaptures(0);
    setAiCaptures(0);
    setMoves(0);
    setWinner(null);
    setGameState('playing');
    setIsPlayerTurn(true);
    gameStartTimeRef.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl font-black uppercase tracking-widest">Damas Arcade</p>
          <p className="text-gray-400 text-sm max-w-xs">Captura todas las piezas de la IA saltando sobre ellas diagonalmente.</p>
          <button onClick={startNewGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 transition-all uppercase text-sm tracking-widest" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
            Jugar Ahora
          </button>
        </div>
      )}

      {gameState !== 'menu' && (
        <div className="w-full max-w-md bg-gray-900/50 p-4 border border-orange-900/30 rounded-lg flex justify-between items-center shadow-2xl">
          <div className="text-center">
            <p className="text-red-500 text-[10px] font-bold">JUGADOR</p>
            <p className="text-2xl font-black text-white">{playerCaptures}</p>
          </div>
          <div className="text-center border-x border-gray-800 px-6">
            <p className={`text-xs font-bold ${isPlayerTurn ? 'text-orange-400 animate-pulse' : 'text-gray-600'}`}>
              {gameState === 'ended' ? 'PARTIDA FINALIZADA' : isPlayerTurn ? 'TU TURNO' : 'IA PENSANDO...'}
            </p>
            <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-tighter">Movimientos: {moves}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-500 text-[10px] font-bold">OLLAMA AI</p>
            <p className="text-2xl font-black text-white">{aiCaptures}</p>
          </div>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center bg-orange-900/20 p-4 border border-orange-500/30 rounded animate-in fade-in zoom-in duration-300">
          <p className={`text-2xl font-black mb-4 ${winner === 'R' ? 'text-green-400' : 'text-red-400'}`}>
            {winner === 'R' ? '¡VICTORIA TOTAL!' : 'DERROTA'}
          </p>
          <button onClick={startNewGame} className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 px-6 rounded-sm transition-transform hover:scale-105">
            REINTENTAR
          </button>
        </div>
      )}

      <div className="grid grid-cols-8 gap-1 p-2 bg-orange-900/20 border-4 border-orange-900 shadow-inner rounded-xl relative">
        {board.map((cell, index) => {
          const [row, col] = indexToCoord(index);
          const isDark = (row + col) % 2 === 1;
          const isSelected = selectedPiece === index;
          const isValid = validMoves.includes(index);

          return (
            <div key={index} onClick={() => handleCellClick(index)} className={`
              w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center cursor-pointer transition-all duration-200 relative
              ${isDark ? 'bg-black/40' : 'bg-orange-100/5'}
              ${isValid ? 'bg-green-500/20' : ''}
              ${isSelected ? 'ring-2 ring-orange-500 ring-inset bg-orange-500/20' : ''}
              border border-white/5
            `}>
              {cell && (
                <div className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transform transition-transform
                  ${cell === 'R' ? 'bg-gradient-to-br from-red-400 to-red-700' : 'bg-gradient-to-br from-blue-400 to-blue-700'}
                  ${isSelected ? 'scale-110 rotate-12' : 'scale-100'}
                `}>
                  <div className="w-6 h-6 border-2 border-white/20 rounded-full"></div>
                </div>
              )}
              {isValid && !cell && <div className="w-3 h-3 bg-green-400/40 rounded-full"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}