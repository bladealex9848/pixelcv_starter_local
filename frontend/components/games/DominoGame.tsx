"use client";
import { useState, useCallback, useEffect, useRef } from 'react';

interface DominoGameProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

type PlayerPiece = { left: number; right: number; id: number };
type Board = { piece: PlayerPiece; position: 'left' | 'right' }[];

// Tipo para movimientos de entrenamiento
interface TrainingMove {
  piece_id: number;
  position: 'left' | 'right';
  timestamp: number;
  board_state: any;
}

export default function DominoGame({ isAuthenticated, onGameEnd }: DominoGameProps) {
  const [playerPieces, setPlayerPieces] = useState<PlayerPiece[]>([]);
  const [aiPieces, setAiPieces] = useState<PlayerPiece[]>([]);
  const [board, setBoard] = useState<Board>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [currentLeft, setCurrentLeft] = useState<number | null>(null);
  const [currentRight, setCurrentRight] = useState<number | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  // NUEVO: Recolectar movimientos para entrenamiento
  const movesRef = useRef<TrainingMove[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  // Generar todas las fichas de dominó (0-6)
  const generateDominoes = (): PlayerPiece[] => {
    const pieces: PlayerPiece[] = [];
    let id = 0;
    for (let left = 0; left <= 6; left++) {
      for (let right = left; right <= 6; right++) {
        pieces.push({ left, right, id: id++ });
      }
    }
    return pieces;
  };

  // Repartir fichas
  const dealPieces = () => {
    const allPieces = generateDominoes().sort(() => Math.random() - 0.5);
    setPlayerPieces(allPieces.slice(0, 7));
    setAiPieces(allPieces.slice(7, 14));
    setBoard([]);
    setCurrentLeft(null);
    setCurrentRight(null);
  };

  // Verificar si una ficha puede colocarse
  const canPlacePiece = (piece: PlayerPiece, position: 'left' | 'right'): boolean => {
    if (position === 'left') {
      if (currentLeft === null) return true;
      return piece.right === currentLeft;
    } else {
      if (currentRight === null) return true;
      return piece.left === currentRight;
    }
  };

  // Colocar ficha en el tablero
  const placePiece = (piece: PlayerPiece, position: 'left' | 'right') => {
    const newBoard = [...board];

    if (position === 'left') {
      if (currentLeft === null) {
        newBoard.unshift({ piece, position: 'left' });
        setCurrentLeft(piece.left);
      } else {
        newBoard.unshift({ piece, position: 'left' });
        setCurrentLeft(piece.right);
      }
    } else {
      if (currentRight === null) {
        newBoard.push({ piece, position: 'right' });
        setCurrentRight(piece.right);
      } else {
        newBoard.push({ piece, position: 'right' });
        setCurrentRight(piece.left);
      }
    }

    setBoard(newBoard);
  };

  // Verificar ganador
  const checkWinner = (): 'player' | 'ai' | null => {
    if (playerPieces.length === 0) return 'player';
    if (aiPieces.length === 0) return 'ai';

    // Bloqueo - sin movimientos posibles
    const playerHasMove = playerPieces.some(p =>
      canPlacePiece(p, 'left') || canPlacePiece(p, 'right')
    );

    const aiHasMove = aiPieces.some(p =>
      canPlacePiece(p, 'left') || canPlacePiece(p, 'right')
    );

    if (!playerHasMove && !aiHasMove) {
      // Calcular puntos restantes
      const playerPiecesSum = playerPieces.reduce((sum, p) => sum + p.left + p.right, 0);
      const aiPiecesSum = aiPieces.reduce((sum, p) => sum + p.left + p.right, 0);
      return playerPiecesSum < aiPiecesSum ? 'player' : 'ai';
    }

    return null;
  };

  // IA: calcular mejor movimiento
  const getAIMove = useCallback(() => {
    // Buscar movimientos posibles
    const possibleMoves: { piece: PlayerPiece; position: 'left' | 'right' }[] = [];

    for (const piece of aiPieces) {
      if (canPlacePiece(piece, 'left')) {
        possibleMoves.push({ piece, position: 'left' });
      }
      if (canPlacePiece(piece, 'right')) {
        possibleMoves.push({ piece, position: 'right' });
      }
    }

    if (possibleMoves.length === 0) {
      // Pasar turno
      setIsPlayerTurn(true);
      return;
    }

    // Estrategia simple: priorizar fichas que sumen más puntos
    let bestMove = possibleMoves[0];
    let bestScore = -1;

    for (const move of possibleMoves) {
      const score = move.piece.left + move.piece.right;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // Recolectar movimiento de IA
    movesRef.current.push({
      piece_id: bestMove.piece.id,
      position: bestMove.position,
      timestamp: Date.now() - gameStartTimeRef.current,
      board_state: { board, aiPieces }
    });

    // Aplicar movimiento
    placePiece(bestMove.piece, bestMove.position);
    setAiPieces(prev => prev.filter(p => p.id !== bestMove.piece.id));
    setMoves(m => m + 1);

    // Verificar ganador
    const gameWinner = checkWinner();
    if (gameWinner) {
      setWinner(gameWinner);
      setGameState('ended');
      const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      onGameEnd(0, gameWinner === 'player', moves + 1, gameTime, {
        training_data: {
          game_id: 'domino',
          moves_sequence: movesRef.current,
          final_board_state: { board, playerPieces, aiPieces },
          player_won: gameWinner === 'player'
        }
      });
    } else {
      setIsPlayerTurn(true);
    }
  }, [aiPieces, board, currentLeft, currentRight, moves, onGameEnd]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlayerTurn) {
      const timer = setTimeout(getAIMove, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, isPlayerTurn, getAIMove]);

  const handlePieceClick = (piece: PlayerPiece) => {
    if (gameState !== 'playing' || !isPlayerTurn) return;

    // Intentar colocar en la izquierda
    if (canPlacePiece(piece, 'left')) {
      // Recolectar movimiento del jugador
      movesRef.current.push({
        piece_id: piece.id,
        position: 'left',
        timestamp: Date.now() - gameStartTimeRef.current,
        board_state: { board, playerPieces }
      });

      placePiece(piece, 'left');
      setPlayerPieces(prev => prev.filter(p => p.id !== piece.id));
      setMoves(m => m + 1);
      setIsPlayerTurn(false);

      const gameWinner = checkWinner();
      if (gameWinner) {
        setWinner(gameWinner);
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, gameWinner === 'player', moves + 1, gameTime, {
          training_data: {
            game_id: 'domino',
            moves_sequence: movesRef.current,
            final_board_state: { board, playerPieces, aiPieces },
            player_won: gameWinner === 'player'
          }
        });
      }
    }
    // Intentar colocar en la derecha
    else if (canPlacePiece(piece, 'right')) {
      // Recolectar movimiento del jugador
      movesRef.current.push({
        piece_id: piece.id,
        position: 'right',
        timestamp: Date.now() - gameStartTimeRef.current,
        board_state: { board, playerPieces }
      });

      placePiece(piece, 'right');
      setPlayerPieces(prev => prev.filter(p => p.id !== piece.id));
      setMoves(m => m + 1);
      setIsPlayerTurn(false);

      const gameWinner = checkWinner();
      if (gameWinner) {
        setWinner(gameWinner);
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, gameWinner === 'player', moves + 1, gameTime, {
          training_data: {
            game_id: 'domino',
            moves_sequence: movesRef.current,
            final_board_state: { board, playerPieces, aiPieces },
            player_won: gameWinner === 'player'
          }
        });
      }
    }
  };

  const startNewGame = () => {
    dealPieces();
    setIsPlayerTurn(true);
    setGameState('playing');
    setMoves(0);
    setWinner(null);
    setPlayerScore(0);
    setAiScore(0);
    movesRef.current = [];
    gameStartTimeRef.current = Date.now();
  };

  const canPlayerMove = playerPieces.some(p =>
    canPlacePiece(p, 'left') || canPlacePiece(p, 'right')
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Game Status */}
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl">Domino</p>
          <p className="text-gray-400 text-sm">Empareja los números para deshacerte de todas tus fichas</p>
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
            {isPlayerTurn ? 'Tu turno' : 'Turno de la IA...'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-500 text-xs">Movimientos: {moves}</p>
            <div className="flex items-center gap-1 bg-purple-900/30 border border-purple-500/50 px-2 py-0.5 rounded-sm">
              <span className="text-purple-400 text-[10px]">🤖 Probabilistic AI</span>
            </div>
          </div>
          {!canPlayerMove && isPlayerTurn && (
            <p className="text-yellow-400 text-xs">No puedes mover - pasando turno</p>
          )}
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4">
          <p className={winner === 'player' ? 'text-green-400 text-xl' : 'text-red-400 text-xl'}>
            {winner === 'player' ? '¡GANASTE!' : 'La IA ganó'}
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

      {/* Board Display */}
      {board.length > 0 && (
        <div className="bg-black border-2 border-orange-900 p-4 rounded-lg">
          <div className="flex gap-2 items-center">
            {board.map((item, index) => (
              <div key={index} className="bg-orange-900/30 border border-orange-500/50 p-2 rounded">
                <div className="text-orange-400 text-2xl font-bold">
                  {item.piece.left} | {item.piece.right}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Pieces */}
      <div className="space-y-4">
        <p className="text-orange-400 text-sm">Tus fichas ({playerPieces.length}):</p>
        <div className="grid grid-cols-4 gap-2">
          {playerPieces.map(piece => (
            <button
              key={piece.id}
              onClick={() => handlePieceClick(piece)}
              disabled={!isPlayerTurn || gameState !== 'playing'}
              className={`
                bg-orange-900/50 border border-orange-500/50 p-3 rounded transition-all duration-200
                ${canPlacePiece(piece, 'left') || canPlacePiece(piece, 'right')
                  ? 'hover:bg-orange-900/70 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="text-orange-400 text-xl font-bold">
                {piece.left} | {piece.right}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {gameState === 'menu' && (
        <p className="text-gray-500 text-xs text-center max-w-md">
          Haz clic en una ficha para colocarla en el tablero. Empareja los números para continuar. ¡El primero en deshacerse de todas sus fichas gana!
        </p>
      )}
    </div>
  );
}
