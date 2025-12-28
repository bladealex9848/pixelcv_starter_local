"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface ChessGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type Piece = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K' | 'p' | 'r' | 'n' | 'b' | 'q' | 'k' | null;
type Board = Piece[];

interface TrainingMove {
  from: string;
  to: string;
  piece: string;
  timestamp: number;
  board_state: Board;
}

export default function ChessGame({ isAuthenticated, onGameEnd }: ChessGameProps) {
  const BOARD_SIZE = 8;
  const [board, setBoard] = useState<Board>(() => {
    const initialBoard: Board = Array(64).fill(null);
    const blackPieces: Piece[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 8; i++) {
      initialBoard[i] = blackPieces[i];
      initialBoard[8 + i] = 'p';
      initialBoard[48 + i] = 'P';
      initialBoard[56 + i] = blackPieces[i]?.toUpperCase() as Piece;
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

  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  const indexToCoord = (index: number): [number, number] => [Math.floor(index / 8), index % 8];
  const coordToIndex = (row: number, col: number): number => row * 8 + col;
  const indexToSquare = (index: number): string => {
    const col = String.fromCharCode(97 + (index % 8));
    const row = 8 - Math.floor(index / 8);
    return `${col}${row}`;
  };

  const isWhite = (piece: Piece): boolean => piece !== null && piece === piece.toUpperCase();
  const isBlack = (piece: Piece): boolean => piece !== null && piece === piece.toLowerCase();

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

  const evaluateBoard = (currentBoard: Board): number => {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const piece = currentBoard[i];
      if (!piece) continue;
      const type = piece.toLowerCase();
      let val = 0;
      if (type === 'p') val = 10 + (isWhite(piece) ? PAWN_PST[i] : PAWN_PST[63 - i]);
      else if (type === 'n') val = 30 + KNIGHT_PST[i];
      else if (type === 'b') val = 30;
      else if (type === 'r') val = 50;
      else if (type === 'q') val = 90;
      else if (type === 'k') val = 900;
      score += isWhite(piece) ? val : -val;
    }
    return score;
  };

  const getValidMovesForBoard = (currentBoard: Board, from: number): number[] => {
    const piece = currentBoard[from];
    if (!piece) return [];
    const [row, col] = indexToCoord(from);
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
      const patterns: Record<string, number[][]> = {
        'n': [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
        'b': [[-1,-1],[-1,1],[1,-1],[1,1]],
        'r': [[-1,0],[1,0],[0,-1],[0,1]],
        'q': [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],
        'k': [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]
      };
      const shifts = patterns[piece.toLowerCase()];
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
            if (piece.toLowerCase() === 'n' || piece.toLowerCase() === 'k') break;
          }
        }
      }
    }
    return moves;
  };

  const minimax = useCallback((currentBoard: Board, depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    if (depth === 0) return -evaluateBoard(currentBoard);
    let best = isMaximizing ? -Infinity : Infinity;
    for (let i = 0; i < 64; i++) {
      const p = currentBoard[i];
      if (p && (isMaximizing ? isBlack(p) : isWhite(p))) {
        for (const to of getValidMovesForBoard(currentBoard, i)) {
          const next = [...currentBoard];
          next[to] = next[i]; next[i] = null;
          const val = minimax(next, depth - 1, alpha, beta, !isMaximizing);
          if (isMaximizing) {
            best = Math.max(best, val); alpha = Math.max(alpha, best);
          } else {
            best = Math.min(best, val); beta = Math.min(beta, best);
          }
          if (beta <= alpha) return best;
        }
      }
    }
    return best;
  }, []);

  const endGame = useCallback((res: 'white' | 'black' | 'draw') => {
    setWinner(res);
    setGameState('ended');
    const time = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    onGameEnd(res === 'white' ? 100 : 20, res === 'white', moves, time, {});
  }, [moves, onGameEnd]);

  const makeAIMove = useCallback(() => {
    let best = -Infinity, move = null;
    const all = [];
    for (let i = 0; i < 64; i++) {
      if (board[i] && isBlack(board[i])) {
        for (const to of getValidMovesForBoard(board, i)) all.push({ from: i, to });
      }
    }
    all.sort(() => Math.random() - 0.5);
    for (const m of all) {
      const next = [...board];
      next[m.to] = next[m.from]; next[m.from] = null;
      const val = minimax(next, 2, -Infinity, Infinity, false);
      if (val > best) { best = val; move = m; }
    }
    if (move) {
      if (board[move.to]) setWhiteCaptures(prev => [...prev, board[move.to]]);
      setLastMove(move);
      const next = [...board];
      next[move.to] = next[move.from]; next[move.from] = null;
      setBoard(next);
      setMoves(m => m + 1);
      setIsPlayerTurn(true);
      if (!next.some(p => p === 'K')) endGame('black');
    }
  }, [board, minimax, endGame]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlayerTurn && !winner) {
      const timer = setTimeout(makeAIMove, 600);
      return () => clearTimeout(timer);
    }
  }, [gameState, isPlayerTurn, winner, makeAIMove]);

  const handleSquareClick = (index: number) => {
    if (gameState !== 'playing' || !isPlayerTurn) return;
    const piece = board[index];
    if (selectedSquare === null) {
      if (piece && isWhite(piece)) {
        setSelectedSquare(index);
        setValidMoves(getValidMovesForBoard(board, index));
      }
    } else if (selectedSquare === index) {
      setSelectedSquare(null); setValidMoves([]);
    } else if (validMoves.includes(index)) {
      if (board[index]) setBlackCaptures(prev => [...prev, board[index]]);
      setLastMove({ from: selectedSquare, to: index });
      const next = [...board];
      next[index] = next[selectedSquare]; next[selectedSquare] = null;
      setBoard(next);
      setMoves(m => m + 1);
      setSelectedSquare(null); setValidMoves([]);
      if (!next.some(p => p === 'k')) endGame('white');
      else setIsPlayerTurn(false);
    } else if (piece && isWhite(piece)) {
      setSelectedSquare(index);
      setValidMoves(getValidMovesForBoard(board, index));
    }
  };

  const startNewGame = () => {
    const b: Board = Array(64).fill(null);
    const pieces: Piece[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 8; i++) {
      b[i] = pieces[i]; b[8 + i] = 'p';
      b[48 + i] = 'P'; b[56 + i] = pieces[i]?.toUpperCase() as Piece;
    }
    setBoard(b); setIsPlayerTurn(true); setGameState('playing');
    setMoves(0); setWinner(null); setSelectedSquare(null); setValidMoves([]);
    setLastMove(null); setWhiteCaptures([]); setBlackCaptures([]);
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
      {gameState !== 'menu' && (
        <div className="w-full space-y-4">
          <div className="flex flex-wrap gap-1 min-h-[24px] bg-gray-900/30 p-2 rounded border border-gray-800/50">
            {whiteCaptures.map((p, i) => <span key={i} className="text-xl opacity-70 text-gray-400">{getPieceSymbol(p)}</span>)}
          </div>
          <div className="flex justify-between items-center bg-gray-900/50 p-4 border border-orange-900/30 rounded-lg shadow-2xl">
            <div className="text-center">
              <p className="text-red-500 text-[10px] font-bold tracking-widest uppercase">IA (Negras)</p>
              {!isPlayerTurn && gameState === 'playing' && (
                <div className="flex items-center gap-2 mt-1 justify-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-gray-400">PENSANDO...</span>
                </div>
              )}
            </div>
            <div className="text-center px-6 border-x border-gray-800">
              <p className={`text-xs font-bold ${isPlayerTurn ? 'text-orange-400 animate-pulse' : 'text-gray-600'}`}>
                {gameState === 'ended' ? 'FINALIZADO' : isPlayerTurn ? 'TU TURNO' : 'IA TURNO'}
              </p>
              <p className="text-[9px] text-gray-500 mt-1 uppercase font-mono tracking-tighter">Movimientos: {moves}</p>
            </div>
            <div className="text-center">
              <p className="text-green-500 text-[10px] font-bold tracking-widest uppercase">Tú (Blancas)</p>
              <div className="bg-purple-900/20 border border-purple-500/30 px-2 py-0.5 rounded text-[8px] text-purple-400 mt-1">OLLAMA AI READY</div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'menu' && (
        <div className="text-center space-y-6 bg-orange-900/5 p-8 border border-orange-900/20 rounded-xl">
          <p className="text-orange-400 text-3xl font-black uppercase tracking-[0.2em] italic">Ajedrez Arcade</p>
          <button onClick={startNewGame} className="bg-orange-600 hover:bg-orange-500 text-white font-black px-10 py-4 transition-all uppercase tracking-widest text-sm" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
            Iniciar Desafío
          </button>
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center bg-orange-900/20 p-6 border border-orange-500/30 rounded-lg w-full">
          <p className={`text-3xl font-black mb-2 ${winner === 'white' ? 'text-green-400' : 'text-red-400'}`}>{winner === 'white' ? '¡VICTORIA!' : 'JAQUE MATE'}</p>
          <button onClick={startNewGame} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-sm uppercase text-xs">Nueva Partida</button>
        </div>
      )}

      <div className="relative grid grid-cols-8 gap-0 p-2 bg-black border-4 border-orange-900/50 shadow-2xl rounded-lg overflow-hidden">
        {board.map((piece, index) => {
          const [row, col] = indexToCoord(index);
          const isLight = (row + col) % 2 === 0;
          return (
            <button key={index} onClick={() => handleSquareClick(index)} disabled={gameState !== 'playing'} className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl transition-all duration-200 relative ${isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]'} ${selectedSquare === index ? 'bg-orange-400/80 ring-4 ring-orange-500 ring-inset' : ''} ${lastMove && (lastMove.from === index || lastMove.to === index) ? 'after:absolute after:inset-0 after:bg-yellow-400/30' : ''} ${validMoves.includes(index) ? 'before:absolute before:w-4 before:h-4 before:bg-black/10 before:rounded-full' : ''}`}>
              {piece && <span className={`${isWhite(piece) ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]' : 'text-gray-900'} transform transition-transform hover:scale-110 active:scale-90 select-none`}>{getPieceSymbol(piece)}</span>}
            </button>
          );
        })}
      </div>

      {gameState !== 'menu' && (
        <div className="w-full flex flex-wrap gap-1 min-h-[24px] bg-gray-900/30 p-2 rounded border border-gray-800/50">
          {blackCaptures.map((p, i) => <span key={i} className="text-xl opacity-70 text-gray-400">{getPieceSymbol(p)}</span>)}
        </div>
      )}
    </div>
  );
}