import { ChessEngine, Move, GameState } from './ChessEngine';
import OptimizedChessboard from './OptimizedChessboard';

interface ChessboardWrapperProps {
  chessEngine: ChessEngine;
  gameState: GameState;
  playerColor: 'white' | 'black';
  theme: 'light' | 'dark';
  onMove: (move: Move) => void;
  onGameStateUpdate: () => void;
  disabled?: boolean;
}

function ChessboardWrapper({
  chessEngine,
  gameState,
  playerColor,
  theme,
  onMove,
  onGameStateUpdate,
  disabled = false
}: ChessboardWrapperProps) {
  const handleMove = (move: Move) => {
    if (disabled) return;
    
    onMove(move);
    onGameStateUpdate();
  };

  return (
    <OptimizedChessboard
      position={gameState.fen}
      orientation={playerColor}
      onMove={handleMove}
      validMoves={[]}
      lastMove={gameState.lastMove}
      theme={theme}
      isPlayerTurn={gameState.currentPlayer === playerColor && gameState.gameStatus === 'playing' && !disabled}
      chessEngine={chessEngine}
      gameStatus={gameState.gameStatus}
    />
  );
}

export default ChessboardWrapper;