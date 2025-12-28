"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface ChessGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Piece = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K' | 'p' | 'r' | 'n' | 'b' | 'q' | 'k' | null;
type Board = Piece[];

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  from: string;  // e.g., "e2"
  to: string;    // e.g., "e4"
  piece: string; // e.g., "P"
  captures?: string;
  special?: string; // 'castling', 'en_passant', 'promotion'
  timestamp: number;
  board_state: Board;
}

export default function ChessGame({ isAuthenticated, onGameEnd }: ChessGameProps) {
  const BOARD_SIZE = 8;
  const [board, setBoard] = useState<Board>(() => {
    // Inicializar tablero de ajedrez estándar
    const initialBoard: Board = Array(64).fill(null);

    // Piezas negras (minúsculas) - filas 0-1
    const blackPieces: Piece[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 8; i++) {
      initialBoard[i] = blackPieces[i];
      initialBoard[8 + i] = 'p';
    }

    // Piezas blancas (mayúsculas) - filas 6-7
    for (let i = 0; i < 8; i++) {
      initialBoard[48 + i] = 'P';
      const piece = blackPieces[i];
      if (piece) {
        initialBoard[56 + i] = piece.toUpperCase() as Piece;
      }
    }

    return initialBoard;
  });

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [lastMove, setLastMove] = useState<{ from: number; to: number } | null>(null);
  const [whiteCaptures, setWhiteCaptures] = useState<Piece[]>([]);
  const [blackCaptures, setBlackCaptures] = useState<Piece[]>([]);
  const [enPassant, setEnPassant] = useState<number | null>(null);

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  const isWhite = (piece: Piece): boolean => piece !== null && piece === piece.toUpperCase();
  const isBlack = (piece: Piece): boolean => piece !== null && piece === piece.toLowerCase();

  // Tablas de valores por posición (Heurística básica)
  const PAWN_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ];

  const KNIGHT_PST = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ];

  // Evaluar tablero con material y posición
  const evaluateBoard = (currentBoard: Board): number => {
    let totalEvaluation = 0;
    for (let i = 0; i < 64; i++) {
      totalEvaluation += getPieceValue(currentBoard[i], i);
    }
    return totalEvaluation;
  };

  const getPieceValue = (piece: Piece, index: number): number => {
    if (piece === null) return 0;
    
    const getAbsoluteValue = (p: Piece, isWhite: boolean, idx: number) => {
      const type = p!.toLowerCase();
      let value = 0;
      if (type === 'p') value = 10 + (isWhite ? PAWN_PST[idx] : PAWN_PST[63 - idx]);
      else if (type === 'n') value = 30 + KNIGHT_PST[idx];
      else if (type === 'b') value = 30;
      else if (type === 'r') value = 50;
      else if (type === 'q') value = 90;
      else if (type === 'k') value = 900;
      return value;
    };

    const white = isWhite(piece);
    return white ? getAbsoluteValue(piece, true, index) : -getAbsoluteValue(piece, false, index);
  };

  // Minimax con Alpha-Beta Pruning
  const minimax = useCallback((
    currentBoard: Board, 
    depth: number, 
    alpha: number, 
    beta: number, 
    isMaximizing: boolean
  ): number => {
    if (depth === 0) return -evaluateBoard(currentBoard);

    const moves = getAllValidMoves(currentBoard, isMaximizing ? 'black' : 'white');
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const move of moves) {
        const newBoard = makeSimpleMove(currentBoard, move.from, move.to);
        bestScore = Math.max(bestScore, minimax(newBoard, depth - 1, alpha, beta, !isMaximizing));
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const move of moves) {
        const newBoard = makeSimpleMove(currentBoard, move.from, move.to);
        bestScore = Math.min(bestScore, minimax(newBoard, depth - 1, alpha, beta, !isMaximizing));
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
      }
      return bestScore;
    }
  }, []);

  const makeSimpleMove = (currentBoard: Board, from: number, to: number): Board => {
    const newBoard = [...currentBoard];
    newBoard[to] = newBoard[from];
    newBoard[from] = null;
    return newBoard;
  };

  const getAllValidMoves = (currentBoard: Board, color: 'white' | 'black') => {
    const allMoves = [];
    for (let i = 0; i < 64; i++) {
      const piece = currentBoard[i];
      if (piece && (color === 'white' ? isWhite(piece) : isBlack(piece))) {
        const moves = getValidMovesForBoard(currentBoard, i);
        for (const to of moves) {
          allMoves.push({ from: i, to });
        }
      }
    }
    return allMoves;
  };

  const getValidMovesForBoard = (currentBoard: Board, from: number): number[] => {
    // Versión adaptada de getValidMoves que acepta un board como parámetro
    // (Por simplicidad reutilizamos la lógica principal pero con board inyectado)
    const piece = currentBoard[from];
    if (!piece) return [];
    
    const [row, col] = [Math.floor(from / 8), from % 8];
    const moves: number[] = [];
    const white = isWhite(piece);
    const dir = white ? -1 : 1;

    if (piece.toLowerCase() === 'p') {
      const f1 = coordToIndex(row + dir, col);
      if (row + dir >= 0 && row + dir < 8 && !currentBoard[f1]) {
        moves.push(f1);
        const f2 = coordToIndex(row + 2 * dir, col);
        if ((white ? row === 6 : row === 1) && !currentBoard[f2]) moves.push(f2);
      }
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (nc >= 0 && nc < 8 && row + dir >= 0 && row + dir < 8) {
          const ci = coordToIndex(row + dir, nc);
          const tp = currentBoard[ci];
          if (tp && (white ? isBlack(tp) : isWhite(tp))) moves.push(ci);
        }
      }
    } else {
      // Simplificado: para piezas de largo alcance y saltos, usamos lógica similar a la original
      // ... (Caballo, Alfil, Torre, Reina, Rey)
      const patterns: Record<string, number[][]> = {
        'n': [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
        'b': [[-1,-1],[-1,1],[1,-1],[1,1]],
        'r': [[-1,0],[1,0],[0,-1],[0,1]],
        'q': [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],
        'k': [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]
      };
      const p = piece.toLowerCase();
      const shifts = patterns[p];
      if (shifts) {
        for (const [dr, dc] of shifts) {
          for (let i = 1; i < 8; i++) {
            const nr = row + dr * i, nc = col + dc * i;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
            const ni = coordToIndex(nr, nc), tp = currentBoard[ni];
            if (!tp) moves.push(ni);
            else {
              if (white ? isBlack(tp) : isWhite(tp)) moves.push(ni);
              break;
            }
            if (p === 'n' || p === 'k') break;
          }
        }
      }
    }
    return moves;
  };

  // Movimiento de la IA (Negras)
  const makeAIMove = useCallback(() => {
    let bestMove = null;
    let bestScore = -Infinity;

    const possibleMoves = getAllValidMoves(board, 'black');
    
    // Mezclar movimientos para variedad
    possibleMoves.sort(() => Math.random() - 0.5);

    for (const move of possibleMoves) {
      const newBoard = makeSimpleMove(board, move.from, move.to);
      const score = minimax(newBoard, 2, -Infinity, Infinity, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (bestMove) {
      const captured = board[bestMove.to];
      if (captured) setWhiteCaptures(prev => [...prev, captured]);

      setLastMove({ from: bestMove.from, to: bestMove.to });
      const newBoard = makeSimpleMove(board, bestMove.from, bestMove.to);
      setBoard(newBoard);
      setMoves(m => m + 1);
      setIsPlayerTurn(true);
      setSelectedSquare(null);
      setValidMoves([]);

      if (!newBoard.some(p => p === 'K')) endGame('black');
    }
  }, [board, minimax]);

  const handleSquareClick = (index: number) => {
    if (gameState !== 'playing' || !isPlayerTurn) return;

    const piece = board[index];

    if (selectedSquare === null) {
      if (piece && isWhite(piece)) {
        setSelectedSquare(index);
        setValidMoves(getValidMovesForBoard(board, index));
      }
    } else if (selectedSquare === index) {
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (validMoves.includes(index)) {
      const captured = board[index];
      if (captured) setBlackCaptures(prev => [...prev, captured]);

      setLastMove({ from: selectedSquare, to: index });
      const newBoard = makeSimpleMove(board, selectedSquare, index);
      setBoard(newBoard);
      setMoves(m => m + 1);
      setSelectedSquare(null);
      setValidMoves([]);

      if (!newBoard.some(p => p === 'k')) endGame('white');
      else setIsPlayerTurn(false);
    } else if (piece && isWhite(piece)) {
      setSelectedSquare(index);
      setValidMoves(getValidMovesForBoard(board, index));
    }
  };

  const endGame = (res: 'white' | 'black' | 'draw') => {
    setWinner(res);
    setGameState('ended');
    const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    onGameEnd(res === 'white' ? 100 : 20, res === 'white', moves, gameTime, {});
  };

  const startNewGame = () => {
    const initialBoard: Board = Array(64).fill(null);
    const blackPieces: Piece[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 8; i++) {
      initialBoard[i] = blackPieces[i];
      initialBoard[8 + i] = 'p';
      initialBoard[48 + i] = 'P';
      const piece = blackPieces[i];
      if (piece) initialBoard[56 + i] = piece.toUpperCase() as Piece;
    }
    setBoard(initialBoard);
    setIsPlayerTurn(true);
    setGameState('playing');
    setMoves(0);
    setWinner(null);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setWhiteCaptures([]);
    setBlackCaptures([]);
    gameStartTimeRef.current = Date.now();
  };

  const getPieceSymbol = (piece: Piece): string => {
    const symbols: Record<string, string> = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    return symbols[piece || ''] || '';
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Game Header & Captures */}
      {gameState !== 'menu' && (
        <div className="w-full space-y-4">
          {/* Black Captures (White pieces taken) */}
          <div className="flex flex-wrap gap-1 min-h-[24px] bg-gray-900/30 p-2 rounded border border-gray-800/50">
            {whiteCaptures.map((p, i) => (
              <span key={i} className="text-xl opacity-70 text-gray-400">{getPieceSymbol(p)}</span>
            ))}
          </div>

          <div className="flex justify-between items-center bg-gray-900/50 p-4 border border-orange-900/30 rounded-lg shadow-2xl">
            <div className="text-center">
              <p className="text-red-500 text-[10px] font-bold tracking-widest uppercase">IA (Negras)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-mono text-gray-400">PENSANDO...</span>
              </div>
            </div>
            <div className="text-center px-6 border-x border-gray-800">
              <p className={`text-xs font-bold ${isPlayerTurn ? 'text-orange-400 animate-pulse' : 'text-gray-600'}`}>
                {gameState === 'ended' ? 'FINALIZADO' : isPlayerTurn ? 'TU TURNO' : 'IA TURNO'}
              </p>
              <p className="text-[9px] text-gray-500 mt-1 uppercase font-mono tracking-tighter">Movimientos: {moves}</p>
            </div>
            <div className="text-center">
              <p className="text-green-500 text-[10px] font-bold tracking-widest uppercase">Tú (Blancas)</p>
              <div className="bg-purple-900/20 border border-purple-500/30 px-2 py-0.5 rounded text-[8px] text-purple-400 mt-1">
                OLLAMA AI READY
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'menu' && (
        <div className="text-center space-y-6 bg-orange-900/5 p-8 border border-orange-900/20 rounded-xl">
          <div>
            <p className="text-orange-400 text-3xl font-black uppercase tracking-[0.2em] italic">Ajedrez Arcade</p>
            <p className="text-gray-500 text-sm mt-2">IA Optimizada con Alpha-Beta Pruning</p>
          </div>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-black px-10 py-4 transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(234,88,12,0.3)]"
            style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
          >
            Iniciar Desafío
          </button>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center bg-orange-900/20 p-6 border border-orange-500/30 rounded-lg animate-in fade-in zoom-in duration-500 w-full">
          <p className={`text-3xl font-black mb-2 ${winner === 'white' ? 'text-green-400' : 'text-red-400'}`}>
            {winner === 'white' ? '¡VICTORIA REAL!' : 'JAQUE MATE'}
          </p>
          <p className="text-gray-400 text-sm font-mono mb-6 uppercase tracking-widest">Partida concluida en {moves} movimientos</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-sm transition-transform hover:scale-105 uppercase text-xs tracking-widest"
          >
            Nueva Partida
          </button>
        </div>
      )}

      {/* Chess Board */}
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative grid grid-cols-8 gap-0 p-2 bg-black border-4 border-orange-900/50 shadow-2xl rounded-lg overflow-hidden">
          {board.map((piece, index) => {
            const [row, col] = [Math.floor(index / 8), index % 8];
            const isLight = (row + col) % 2 === 0;
            const isSelected = selectedSquare === index;
            const isValidMove = validMoves.includes(index);
            const isLastMove = lastMove && (lastMove.from === index || lastMove.to === index);

            return (
              <button
                key={index}
                onClick={() => handleSquareClick(index)}
                disabled={gameState !== 'playing'}
                className={`
                  w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl transition-all duration-200 relative
                  ${isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]'}
                  ${isSelected ? 'bg-orange-400/80 z-10 ring-4 ring-orange-500 ring-inset' : ''}
                  ${isLastMove ? 'after:absolute after:inset-0 after:bg-yellow-400/30' : ''}
                  ${isValidMove ? 'before:absolute before:w-4 before:h-4 before:bg-black/10 before:rounded-full' : ''}
                  ${isValidMove && piece ? 'ring-4 ring-black/10 ring-inset' : ''}
                  border-[0.5px] border-black/5
                `}
              >
                {piece && (
                  <span className={`
                    ${isWhite(piece) ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]' : 'text-gray-900'}
                    transform transition-transform hover:scale-110 active:scale-90 select-none
                  `}>
                    {getPieceSymbol(piece)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Player Captures (Black pieces taken) */}
      {gameState !== 'menu' && (
        <div className="w-full flex flex-wrap gap-1 min-h-[24px] bg-gray-900/30 p-2 rounded border border-gray-800/50">
          {blackCaptures.map((p, i) => (
            <span key={i} className="text-xl opacity-70 text-gray-400">{getPieceSymbol(p)}</span>
          ))}
        </div>
      )}

      {/* Footer / Instructions */}
      {gameState === 'menu' && (
        <div className="bg-orange-900/10 p-6 border border-orange-900/20 rounded-lg max-w-md w-full text-center">
          <p className="text-gray-400 text-xs leading-relaxed uppercase tracking-tighter">
            Las Blancas mueven primero. <br/>
            Captura el Rey para ganar la partida. <br/>
            Optimizado para dispositivos táctiles y escritorio.
          </p>
        </div>
      )}
    </div>
  );
}
