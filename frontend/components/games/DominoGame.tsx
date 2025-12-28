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

  // Verificar si una ficha puede colocarse (y opcionalmente retornarla rotada)
  const getPlayableRotation = (piece: PlayerPiece, position: 'left' | 'right'): PlayerPiece | null => {
    // Si el tablero está vacío, se puede poner cualquier ficha
    if (currentLeft === null || currentRight === null) return piece;

    if (position === 'left') {
      if (piece.right === currentLeft) return piece;
      if (piece.left === currentLeft) return { left: piece.right, right: piece.left, id: piece.id };
    } else {
      if (piece.left === currentRight) return piece;
      if (piece.right === currentRight) return { left: piece.right, right: piece.left, id: piece.id };
    }
    return null;
  };

  // Colocar ficha en el tablero
  const placePiece = (piece: PlayerPiece, position: 'left' | 'right') => {
    const rotatedPiece = getPlayableRotation(piece, position);
    if (!rotatedPiece) return false;

    const newBoard = [...board];

    if (currentLeft === null || currentRight === null) {
      // Primera ficha: inicializa ambos extremos
      newBoard.push({ piece: rotatedPiece, position: 'right' });
      setCurrentLeft(rotatedPiece.left);
      setCurrentRight(rotatedPiece.right);
    } else if (position === 'left') {
      newBoard.unshift({ piece: rotatedPiece, position: 'left' });
      setCurrentLeft(rotatedPiece.left);
    } else {
      newBoard.push({ piece: rotatedPiece, position: 'right' });
      setCurrentRight(rotatedPiece.right);
    }

    setBoard(newBoard);
    return true;
  };

  // Verificar ganador o bloqueo
  const checkWinner = useCallback((): 'player' | 'ai' | null => {
    if (playerPieces.length === 0) return 'player';
    if (aiPieces.length === 0) return 'ai';

    const playerHasMove = playerPieces.some(p =>
      getPlayableRotation(p, 'left') || getPlayableRotation(p, 'right')
    );

    const aiHasMove = aiPieces.some(p =>
      getPlayableRotation(p, 'left') || getPlayableRotation(p, 'right')
    );

    if (!playerHasMove && !aiHasMove && board.length > 0) {
      const playerPiecesSum = playerPieces.reduce((sum, p) => sum + p.left + p.right, 0);
      const aiPiecesSum = aiPieces.reduce((sum, p) => sum + p.left + p.right, 0);
      return playerPiecesSum < aiPiecesSum ? 'player' : 'ai';
    }

    return null;
  }, [playerPieces, aiPieces, board, currentLeft, currentRight]);

  // IA: calcular mejor movimiento
  const getAIMove = useCallback(async () => {
    const possibleMoves: { piece: PlayerPiece; position: 'left' | 'right' }[] = [];

    for (const piece of aiPieces) {
      if (getPlayableRotation(piece, 'left')) possibleMoves.push({ piece, position: 'left' });
      if (getPlayableRotation(piece, 'right')) possibleMoves.push({ piece, position: 'right' });
    }

    if (possibleMoves.length === 0) {
      setIsPlayerTurn(true);
      return;
    }

    let bestMove = possibleMoves[0];
    let maxWeight = -1;

    for (const move of possibleMoves) {
      let weight = move.piece.left + move.piece.right;
      if (move.piece.left === move.piece.right) weight += 10;
      if (weight > maxWeight) {
        maxWeight = weight;
        bestMove = move;
      }
    }

    if (placePiece(bestMove.piece, bestMove.position)) {
      setAiPieces(prev => prev.filter(p => p.id !== bestMove.piece.id));
      setMoves(m => m + 1);

      const gameWinner = checkWinner();
      if (gameWinner) {
        setWinner(gameWinner);
        setGameState('ended');
        const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        onGameEnd(0, gameWinner === 'player', moves + 1, gameTime, {
          training_data: { game_id: 'domino', moves_sequence: movesRef.current, player_won: gameWinner === 'player' }
        });
      } else {
        setIsPlayerTurn(true);
      }
    }
  }, [aiPieces, board, currentLeft, currentRight, moves, onGameEnd, checkWinner]);

  useEffect(() => {
    if (gameState === 'playing' && !isPlayerTurn) {
      const timer = setTimeout(getAIMove, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState, isPlayerTurn, getAIMove]);

  const handlePieceClick = (piece: PlayerPiece) => {
    if (gameState !== 'playing' || !isPlayerTurn) return;

    const rotatedLeft = getPlayableRotation(piece, 'left');
    const rotatedRight = getPlayableRotation(piece, 'right');

    if (rotatedLeft || rotatedRight) {
      const position = rotatedLeft ? 'left' : 'right';
      if (placePiece(piece, position)) {
        setPlayerPieces(prev => prev.filter(p => p.id !== piece.id));
        setMoves(m => m + 1);
        setIsPlayerTurn(false);

        const gameWinner = checkWinner();
        if (gameWinner) {
          setWinner(gameWinner);
          setGameState('ended');
          const gameTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
          onGameEnd(0, gameWinner === 'player', moves + 1, gameTime, {
            training_data: { game_id: 'domino', player_won: gameWinner === 'player' }
          });
        }
      }
    }
  };

  const startNewGame = () => {
    dealPieces();
    setIsPlayerTurn(true);
    setGameState('playing');
    setMoves(0);
    setWinner(null);
    setCurrentLeft(null);
    setCurrentRight(null);
    gameStartTimeRef.current = Date.now();
  };

  const handlePassTurn = () => {
    if (gameState !== 'playing' || !isPlayerTurn) return;
    setIsPlayerTurn(false);
  };

  const canPlayerMove = playerPieces.some(p =>
    getPlayableRotation(p, 'left') || getPlayableRotation(p, 'right')
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <p className="text-orange-400 text-2xl font-bold uppercase tracking-widest">Domino</p>
          <p className="text-gray-400 text-sm">Empareja los números para deshacerte de tus fichas</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 transition-all"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            COMENZAR PARTIDA
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="text-center space-y-2">
          <p className={isPlayerTurn ? 'text-orange-400 font-bold' : 'text-red-400 font-bold'}>
            {isPlayerTurn ? 'TU TURNO' : 'IA PENSANDO...'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-gray-500 text-xs font-mono">MOVIMIENTOS: {moves}</p>
            <div className="bg-purple-900/20 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] text-purple-400">
              🤖 OLLAMA AI READY
            </div>
          </div>
          {!canPlayerMove && isPlayerTurn && (
            <div className="mt-2 animate-bounce">
              <button
                onClick={handlePassTurn}
                className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-2 px-6 rounded-sm shadow-lg"
              >
                PASAR TURNO
              </button>
            </div>
          )}
        </div>
      )}

      {gameState === 'ended' && (
        <div className="text-center space-y-4 bg-orange-900/10 p-6 border border-orange-900/20 rounded">
          <p className={winner === 'player' ? 'text-green-400 text-2xl font-black' : 'text-red-400 text-2xl font-black'}>
            {winner === 'player' ? '¡VICTORIA!' : 'DERROTA'}
          </p>
          <p className="text-gray-400 text-sm font-mono">PARTIDA FINALIZADA EN {moves} MOVIMIENTOS</p>
          <button
            onClick={startNewGame}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 transition-colors uppercase text-sm"
          >
            Revancha
          </button>
        </div>
      )}

      {board.length > 0 && (
        <div className="bg-black/50 border-2 border-orange-900/30 p-6 rounded-lg overflow-x-auto max-w-full">
          <div className="flex gap-2 items-center min-w-max">
            {board.map((item, index) => (
              <div key={index} className="bg-orange-900/20 border border-orange-500/40 p-3 rounded shadow-inner">
                <div className="text-orange-400 text-2xl font-black font-mono">
                  {item.piece.left}<span className="opacity-30 mx-1">|</span>{item.piece.right}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 w-full">
        <div className="flex justify-between items-center border-b border-orange-900/20 pb-2">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-tighter">Tus Fichas ({playerPieces.length})</p>
          <p className="text-red-400 text-[10px] font-mono">IA: {aiPieces.length} FICHAS</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {playerPieces.map(piece => {
            const canPlay = getPlayableRotation(piece, 'left') || getPlayableRotation(piece, 'right');
            return (
              <button
                key={piece.id}
                onClick={() => handlePieceClick(piece)}
                disabled={!isPlayerTurn || gameState !== 'playing'}
                className={`
                  bg-orange-900/40 border-2 p-3 rounded transition-all duration-300
                  ${canPlay && isPlayerTurn
                    ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)] hover:scale-105' 
                    : 'border-transparent opacity-40 grayscale cursor-not-allowed'}
                `}
              >
                <div className="text-orange-400 text-xl font-black font-mono">
                  {piece.left}<br/><span className="opacity-20">--</span><br/>{piece.right}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}