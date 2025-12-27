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
      initialBoard[56 + i] = blackPieces[i].toUpperCase();
    }

    return initialBoard;
  });

  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [enPassant, setEnPassant] = useState<number | null>(null);
  const [castling, setCastling] = useState({ white: true, black: true });

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  const indexToCoord = (index: number): [number, number] => [
    Math.floor(index / BOARD_SIZE),
    index % BOARD_SIZE
  ];

  const coordToIndex = (row: number, col: number): number => row * BOARD_SIZE + col;

  const indexToSquare = (index: number): string => {
    const col = String.fromCharCode(97 + (index % 8)); // a-h
    const row = 8 - Math.floor(index / 8); // 1-8
    return `${col}${row}`;
  };

  const squareToIndex = (square: string): number => {
    const col = square.charCodeAt(0) - 97;
    const row = 8 - parseInt(square[1]);
    return coordToIndex(row, col);
  };

  const isWhite = (piece: Piece): boolean => piece !== null && piece === piece.toUpperCase();
  const isBlack = (piece: Piece): boolean => piece !== null && piece === piece.toLowerCase();

  // Obtener movimientos posibles para una pieza
  const getValidMoves = (from: number): number[] => {
    const piece = board[from];
    if (!piece || (isPlayerTurn && isBlack(piece)) || (!isPlayerTurn && isWhite(piece))) {
      return [];
    }

    const [row, col] = indexToCoord(from);
    const moves: number[] = [];

    switch (piece.toLowerCase()) {
      case 'p': // Peón
        const direction = isWhite(piece) ? -1 : 1;
        const startRow = isWhite(piece) ? 6 : 1;

        // Movimiento hacia adelante
        if (row + direction >= 0 && row + direction < 8) {
          const forwardIndex = coordToIndex(row + direction, col);
          if (board[forwardIndex] === null) {
            moves.push(forwardIndex);

            // Doble movimiento desde posición inicial
            if (row === startRow) {
              const doubleForwardIndex = coordToIndex(row + 2 * direction, col);
              if (board[doubleForwardIndex] === null) {
                moves.push(doubleForwardIndex);
              }
            }
          }
        }

        // Capturas diagonales
        for (const dc of [-1, 1]) {
          const newCol = col + dc;
          if (newCol >= 0 && newCol < 8 && row + direction >= 0 && row + direction < 8) {
            const captureIndex = coordToIndex(row + direction, newCol);
            const targetPiece = board[captureIndex];
            if (targetPiece && ((isWhite(piece) && isBlack(targetPiece)) || (isBlack(piece) && isWhite(targetPiece)))) {
              moves.push(captureIndex);
            }
          }
        }

        // En passant
        if (enPassant !== null) {
          const [er, ec] = indexToCoord(enPassant);
          if (er === row + direction && Math.abs(ec - col) === 1) {
            moves.push(enPassant);
          }
        }
        break;

      case 'r': // Torre
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

            const newIndex = coordToIndex(newRow, newCol);
            const targetPiece = board[newIndex];

            if (targetPiece === null) {
              moves.push(newIndex);
            } else {
              if ((isWhite(piece) && isBlack(targetPiece)) || (isBlack(piece) && isWhite(targetPiece))) {
                moves.push(newIndex);
              }
              break;
            }
          }
        }
        break;

      case 'n': // Caballo
        const knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const newIndex = coordToIndex(newRow, newCol);
            const targetPiece = board[newIndex];
            if (!targetPiece || ((isWhite(piece) && isBlack(targetPiece)) || (isBlack(piece) && isWhite(targetPiece)))) {
              moves.push(newIndex);
            }
          }
        }
        break;

      case 'b': // Alfil
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

            const newIndex = coordToIndex(newRow, newCol);
            const targetPiece = board[newIndex];

            if (targetPiece === null) {
              moves.push(newIndex);
            } else {
              if ((isWhite(piece) && isBlack(targetPiece)) || (isBlack(piece) && isWhite(targetPiece))) {
                moves.push(newIndex);
              }
              break;
            }
          }
        }
        break;

      case 'q': // Reina
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

            const newIndex = coordToIndex(newRow, newCol);
            const targetPiece = board[newIndex];

            if (targetPiece === null) {
              moves.push(newIndex);
            } else {
              if ((isWhite(piece) && isBlack(targetPiece)) || (isBlack(piece) && isWhite(targetPiece))) {
                moves.push(newIndex);
              }
              break;
            }
          }
        }
        break;

      case 'k': // Rey
        for (const dr of [-1, 0, 1]) {
          for (const dc of [-1, 0, 1]) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const newIndex = coordToIndex(newRow, newCol);
              const targetPiece = board[newIndex];
              if (!targetPiece || ((isWhite(piece) && isBlack(targetPiece)) || (isBlack(piece) && isWhite(targetPiece)))) {
                moves.push(newIndex);
              }
            }
          }
        }

        // Enroque
        if (piece === 'K' && castling.white) {
          // Enroque corto
          if (board[coordToIndex(7, 5)] === null && board[coordToIndex(7, 6)] === null && board[coordToIndex(7, 7)] === 'R') {
            moves.push(coordToIndex(7, 6));
          }
          // Enroque largo
          if (board[coordToIndex(7, 1)] === null && board[coordToIndex(7, 2)] === null && board[coordToIndex(7, 3)] === null && board[coordToIndex(7, 0)] === 'R') {
            moves.push(coordToIndex(7, 2));
          }
        } else if (piece === 'k' && castling.black) {
          // Enroque corto
          if (board[coordToIndex(0, 5)] === null && board[coordToIndex(0, 6)] === null && board[coordToIndex(0, 7)] === 'r') {
            moves.push(coordToIndex(0, 6));
          }
          // Enroque largo
          if (board[coordToIndex(0, 1)] === null && board[coordToIndex(0, 2)] === null && board[coordToIndex(0, 3)] === null && board[coordToIndex(0, 0)] === 'r') {
            moves.push(coordToIndex(0, 2));
          }
        }
        break;
    }

    return moves;
  };

  // Verificar jaque
  const isInCheck = (board: Board, isWhiteKing: boolean): boolean => {
    const kingIndex = board.findIndex(piece => piece === (isWhiteKing ? 'K' : 'k'));
    if (kingIndex === -1) return false;

    const [kingRow, kingCol] = indexToCoord(kingIndex);

    // Verificar ataques de peones
    const pawnDirection = isWhiteKing ? -1 : 1;
    for (const dc of [-1, 1]) {
      const newCol = kingCol + dc;
      const newRow = kingRow + pawnDirection;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const index = coordToIndex(newRow, newCol);
        const piece = board[index];
        if (piece === (isWhiteKing ? 'p' : 'P')) {
          return true;
        }
      }
    }

    // Verificar ataques de otras piezas
    // ... (simplificado para brevedad)

    return false;
  };

  // Algoritmo Minimax para IA (simplificado)
  const minimax = useCallback((currentBoard: Board, depth: number, isMaximizing: boolean): number => {
    // Verificar estados terminales (simplificado)
    const whiteKing = currentBoard.some(p => p === 'K');
    const blackKing = currentBoard.some(p => p === 'k');

    if (!whiteKing) return -1000 + depth;
    if (!blackKing) return 1000 - depth;
    if (depth === 3) return 0;

    // Evaluar material
    let score = 0;
    for (const piece of currentBoard) {
      if (!piece) continue;
      const value = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 100 }[piece.toLowerCase()] || 0;
      score += isWhite(piece) ? value : -value;
    }

    return score;
  }, []);

  // Movimiento de la IA
  const makeAIMove = useCallback(() => {
    // Buscar el mejor movimiento (simplificado)
    let bestMove = null;
    let bestScore = -Infinity;

    for (let i = 0; i < 64; i++) {
      if (board[i] && isBlack(board[i])) {
        const moves = getValidMoves(i);
        for (const move of moves) {
          const newBoard = [...board];
          newBoard[move] = newBoard[i];
          newBoard[i] = null;
          const score = minimax(newBoard, 0, false);

          if (score > bestScore) {
            bestScore = score;
            bestMove = { from: i, to: move };
          }
        }
      }
    }

    if (bestMove) {
      // Recolectar movimiento de IA
      const piece = board[bestMove.from];
      movesRef.current.push({
        from: indexToSquare(bestMove.from),
        to: indexToSquare(bestMove.to),
        piece: piece || '',
        timestamp: Date.now() - gameStartTimeRef.current,
        board_state: [...board]
      });

      const newBoard = [...board];
      newBoard[bestMove.to] = newBoard[bestMove.from];
      newBoard[bestMove.from] = null;
      setBoard(newBoard);
      setMoves(m => m + 1);
      setIsPlayerTurn(true);
      setSelectedSquare(null);
      setValidMoves([]);

      // Verificar ganador (simplificado)
      const whiteKing = newBoard.some(p => p === 'K');
      const blackKing = newBoard.some(p => p === 'k');
      if (!whiteKing || !blackKing) {
        setWinner(!whiteKing ? 'black' : 'white');
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, whiteKing, moves + 1, gameTime, {
          training_data: {
            game_id: 'chess',
            moves_sequence: movesRef.current,
            final_board_state: { board: newBoard },
            player_won: whiteKing
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

  const handleSquareClick = (index: number) => {
    if (gameState !== 'playing' || !isPlayerTurn) return;

    const piece = board[index];

    if (selectedSquare === null) {
      // Seleccionar pieza
      if (piece && isWhite(piece)) {
        const valid = getValidMoves(index);
        setSelectedSquare(index);
        setValidMoves(valid);
      }
    } else if (selectedSquare === index) {
      // Deseleccionar
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (validMoves.includes(index)) {
      // Mover pieza
      const fromPiece = board[selectedSquare];

      // Recolectar movimiento del jugador
      movesRef.current.push({
        from: indexToSquare(selectedSquare),
        to: indexToSquare(index),
        piece: fromPiece || '',
        timestamp: Date.now() - gameStartTimeRef.current,
        board_state: [...board]
      });

      const newBoard = [...board];
      newBoard[index] = newBoard[selectedSquare];
      newBoard[selectedSquare] = null;
      setBoard(newBoard);
      setMoves(m => m + 1);
      setSelectedSquare(null);
      setValidMoves([]);

      // Verificar ganador (simplificado)
      const whiteKing = newBoard.some(p => p === 'K');
      const blackKing = newBoard.some(p => p === 'k');
      if (!whiteKing || !blackKing) {
        setWinner(!whiteKing ? 'black' : 'white');
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, whiteKing, moves + 1, gameTime, {
          training_data: {
            game_id: 'chess',
            moves_sequence: movesRef.current,
            final_board_state: { board: newBoard },
            player_won: whiteKing
          }
        });
      } else {
        setIsPlayerTurn(false);
      }
    } else if (piece && isWhite(piece)) {
      // Seleccionar otra pieza
      const valid = getValidMoves(index);
      setSelectedSquare(index);
      setValidMoves(valid);
    }
  };

  const startNewGame = () => {
    const initialBoard: Board = Array(64).fill(null);
    const blackPieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let i = 0; i < 8; i++) {
      initialBoard[i] = blackPieces[i];
      initialBoard[8 + i] = 'p';
      initialBoard[48 + i] = 'P';
      initialBoard[56 + i] = blackPieces[i].toUpperCase();
    }
    setBoard(initialBoard);
    setIsPlayerTurn(true);
    setGameState('playing');
    setMoves(0);
    setWinner(null);
    setSelectedSquare(null);
    setValidMoves([]);
    setEnPassant(null);
    setCastling({ white: true, black: true });
    movesRef.current = [];
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
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Ajedrez</p>
          <p className="text-gray-400 text-sm">El clásico juego de estrategia contra la IA</p>
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
            {isPlayerTurn ? 'Tu turno (Blancas)' : 'Turno de la IA (Negras)...'}
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
          <p className={winner === 'white' ? 'text-green-400 text-xl' : winner === 'black' ? 'text-red-400 text-xl' : 'text-yellow-400 text-xl'}>
            {winner === 'white' ? '¡GANASTE!' : winner === 'black' ? 'La IA ganó' : '¡Empate!'}
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

      {/* Chess Board */}
      <div className="grid grid-cols-8 gap-0 p-4 bg-black border-2 border-orange-900">
        {board.map((piece, index) => {
          const [row, col] = indexToCoord(index);
          const isLight = (row + col) % 2 === 0;
          const isSelected = selectedSquare === index;
          const isValidMove = validMoves.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleSquareClick(index)}
              disabled={gameState !== 'playing'}
              className={`
                w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-3xl md:text-4xl font-bold transition-all duration-200
                ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                ${isSelected ? 'bg-orange-400' : ''}
                ${isValidMove ? 'bg-green-500/50' : ''}
                ${piece ? 'hover:bg-orange-900/30' : ''}
                ${piece ? 'shadow-[0_0_10px_rgba(249,115,22,0.5)]' : ''}
                border border-gray-700
              `}
            >
              {piece ? getPieceSymbol(piece) : ''}
            </button>
          );
        })}
      </div>

      {/* Instructions */}
      {gameState === 'menu' && (
        <p className="text-gray-500 text-xs text-center max-w-md">
          Haz clic en una pieza para seleccionarla y luego en un cuadrado válido para moverla. Captura el rey enemigo para ganar. Las piezas blancas se mueven primero.
        </p>
      )}
    </div>
  );
}
