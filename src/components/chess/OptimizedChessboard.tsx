/**
 * Optimized Chessboard Component with Performance Enhancements
 * Task 10.3: Performance optimization and final integration testing
 * Requirements: 8.1, 8.2, 8.4, 8.5, 8.6
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Move, ChessEngine } from './ChessEngine';
import { PerformanceMonitor, throttle, DeviceCapabilities } from './PerformanceOptimizations';

interface OptimizedChessboardProps {
  position: string; // FEN notation
  orientation: 'white' | 'black';
  onMove: (move: Move) => void;
  validMoves: string[];
  lastMove?: Move;
  theme: 'light' | 'dark';
  isPlayerTurn: boolean;
  chessEngine?: ChessEngine;
  gameStatus?: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
}

interface Square {
  file: string;
  rank: number;
  piece?: { type: string; color: string };
  isLight: boolean;
}

// Chess piece Unicode symbols
const PIECE_SYMBOLS = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
} as const;

// Memoized Square component for better performance
const MemoizedSquare = memo(({ 
  square, 
  isSelected, 
  isHighlighted, 
  isLastMove, 
  isKingInCheck, 
  theme, 
  isPlayerTurn,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: {
  square: Square;
  isSelected: boolean;
  isHighlighted: boolean;
  isLastMove: boolean;
  isKingInCheck: boolean;
  theme: 'light' | 'dark';
  isPlayerTurn: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) => {
  const squareClasses = useMemo(() => {
    const baseClasses = "w-12 h-12 flex items-center justify-center text-3xl cursor-pointer transition-all duration-200 select-none";
    
    // Theme colors
    let lightSquareColor, darkSquareColor;
    
    if (theme === 'light') {
      lightSquareColor = 'bg-amber-100';
      darkSquareColor = 'bg-amber-800';
    } else {
      lightSquareColor = 'bg-slate-300';
      darkSquareColor = 'bg-slate-700';
    }
    
    let classes = `${baseClasses} ${square.isLight ? lightSquareColor : darkSquareColor}`;
    
    // Highlight king in check
    if (isKingInCheck) {
      classes += ' ring-4 ring-red-500 ring-inset bg-red-200';
    }
    
    // Highlight selected square
    if (isSelected) {
      classes += ' ring-4 ring-blue-500 ring-inset';
    }
    
    // Highlight valid move destinations
    if (isHighlighted) {
      if (square.piece) {
        // Capture move - red ring
        classes += ' ring-2 ring-red-400 ring-inset';
      } else {
        // Normal move - green dot
        classes += ' ring-2 ring-green-500 ring-inset';
      }
    }
    
    // Highlight last move
    if (isLastMove) {
      classes += ' bg-yellow-300';
    }
    
    // Hover effect for player's pieces
    if (isPlayerTurn && square.piece) {
      classes += ' hover:ring-2 hover:ring-blue-300 hover:ring-inset';
    }
    
    return classes;
  }, [square, isSelected, isHighlighted, isLastMove, isKingInCheck, theme, isPlayerTurn]);

  const pieceSymbol = useMemo(() => {
    if (!square.piece) return null;
    const key = `${square.piece.color}${square.piece.type.toUpperCase()}` as keyof typeof PIECE_SYMBOLS;
    return PIECE_SYMBOLS[key] || '';
  }, [square.piece]);

  return (
    <div
      className={squareClasses}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Valid move indicator dot for empty squares */}
      {!square.piece && isHighlighted && (
        <div className="w-3 h-3 bg-green-500 rounded-full opacity-70"></div>
      )}
      
      {square.piece && (
        <span 
          className={square.piece.color === 'w' ? 'text-white drop-shadow-lg' : 'text-black drop-shadow-lg'}
          draggable={isPlayerTurn}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{ cursor: isPlayerTurn ? 'grab' : 'default' }}
        >
          {pieceSymbol}
        </span>
      )}
    </div>
  );
});

MemoizedSquare.displayName = 'MemoizedSquare';

// Memoized Promotion Dialog
const MemoizedPromotionDialog = memo(({ 
  isVisible, 
  orientation, 
  onPromotion 
}: {
  isVisible: boolean;
  orientation: 'white' | 'black';
  onPromotion: (piece: 'q' | 'r' | 'b' | 'n') => void;
}) => {
  const pieces = useMemo(() => [
    { piece: 'q', symbol: orientation === 'white' ? '♕' : '♛', name: 'Queen' },
    { piece: 'r', symbol: orientation === 'white' ? '♖' : '♜', name: 'Rook' },
    { piece: 'b', symbol: orientation === 'white' ? '♗' : '♝', name: 'Bishop' },
    { piece: 'n', symbol: orientation === 'white' ? '♘' : '♞', name: 'Knight' }
  ], [orientation]);

  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-center">Choose promotion piece:</h3>
        <div className="flex gap-2">
          {pieces.map(({ piece, symbol, name }) => (
            <button
              key={piece}
              onClick={() => onPromotion(piece as 'q' | 'r' | 'b' | 'n')}
              className="w-16 h-16 bg-amber-100 hover:bg-amber-200 border-2 border-amber-800 rounded-lg flex items-center justify-center text-3xl transition-colors"
              title={name}
            >
              <span className="text-black drop-shadow-lg">{symbol}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

MemoizedPromotionDialog.displayName = 'MemoizedPromotionDialog';

function OptimizedChessboard({
  position,
  orientation,
  onMove,
  validMoves,
  lastMove,
  theme,
  isPlayerTurn,
  chessEngine,
  gameStatus = 'playing'
}: OptimizedChessboardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [showPromotionDialog, setShowPromotionDialog] = useState<{from: string, to: string} | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{square: string, piece: {type: string, color: string}} | null>(null);

  // Device capabilities for performance optimization
  const optimizationRecommendations = useMemo(() => DeviceCapabilities.getOptimizationRecommendations(), []);

  // Parse FEN to get board position with memoization
  const board = useMemo(() => {
    const endMeasurement = PerformanceMonitor.startMeasurement('board_parsing');
    
    try {
      const [boardPart] = position.split(' ');
      const ranks = boardPart.split('/');
      const parsedBoard: Square[][] = [];

      for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
        const rank: Square[] = [];
        const rankString = ranks[rankIndex];
        let fileIndex = 0;

        for (const char of rankString) {
          if (isNaN(parseInt(char))) {
            // It's a piece
            const color = char === char.toUpperCase() ? 'w' : 'b';
            const type = char.toLowerCase();
            const file = String.fromCharCode(97 + fileIndex); // 'a' + fileIndex
            const rankNumber = 8 - rankIndex;
            
            rank.push({
              file,
              rank: rankNumber,
              piece: { type, color },
              isLight: (rankIndex + fileIndex) % 2 === 0
            });
            fileIndex++;
          } else {
            // It's a number indicating empty squares
            const emptySquares = parseInt(char);
            for (let i = 0; i < emptySquares; i++) {
              const file = String.fromCharCode(97 + fileIndex); // 'a' + fileIndex
              const rankNumber = 8 - rankIndex;
              
              rank.push({
                file,
                rank: rankNumber,
                piece: undefined,
                isLight: (rankIndex + fileIndex) % 2 === 0
              });
              fileIndex++;
            }
          }
        }
        parsedBoard.push(rank);
      }

      endMeasurement();
      return parsedBoard;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }, [position]);

  // Throttled square click handler for performance
  const throttledSquareClick = useMemo(() => 
    throttle((square: Square) => {
      console.log('Square clicked:', square.file + square.rank, 'isPlayerTurn:', isPlayerTurn);
      
      if (!isPlayerTurn) {
        console.log('Not player turn, ignoring click');
        return;
      }

      const endMeasurement = PerformanceMonitor.startMeasurement('ui_response');
      
      try {
        const squareNotation = `${square.file}${square.rank}`;
        console.log('Square notation:', squareNotation, 'selectedSquare:', selectedSquare);

        if (selectedSquare === squareNotation) {
          // Deselect if clicking the same square
          console.log('Deselecting square');
          setSelectedSquare(null);
          setHighlightedSquares([]);
          endMeasurement();
          return;
        }

        // If a square is already selected, try to move to this square
        if (selectedSquare) {
          console.log('Attempting move from', selectedSquare, 'to', squareNotation);
          console.log('ChessEngine available:', !!chessEngine);
          
          // Calculate valid moves from the selected square on-demand
          const validMovesFromSelected = chessEngine 
            ? chessEngine.getValidMoves(selectedSquare)
            : [];
          
          console.log('Valid moves from selected square:', validMovesFromSelected);
          
          if (validMovesFromSelected.includes(squareNotation)) {
            console.log('Move is valid, checking for promotion');
            // Check if this move requires pawn promotion
            if (chessEngine && chessEngine.requiresPromotion(selectedSquare, squareNotation)) {
              console.log('Move requires promotion, showing dialog');
              setShowPromotionDialog({ from: selectedSquare, to: squareNotation });
              endMeasurement();
              return;
            }

            // Make a move
            console.log('Making move');
            const move: Move = {
              from: selectedSquare,
              to: squareNotation,
              san: '' // Will be filled by the chess engine
            };
            
            onMove(move);
            setSelectedSquare(null);
            setHighlightedSquares([]);
            endMeasurement();
            return;
          } else {
            console.log('Move is not valid');
          }
        }

        // Select a new square if it has a piece of the current player's color
        if (square.piece) {
          console.log('Square has piece:', square.piece, 'orientation:', orientation);
          const isPlayerPiece = (orientation === 'white' && square.piece.color === 'w') ||
                               (orientation === 'black' && square.piece.color === 'b');
          
          console.log('Is player piece:', isPlayerPiece);
          
          if (isPlayerPiece && chessEngine) {
            console.log('Selecting square and calculating moves');
            setSelectedSquare(squareNotation);
            // Calculate valid moves for this square on-demand
            const moves = chessEngine.getValidMoves(squareNotation);
            console.log('Valid moves for selected square:', moves);
            setHighlightedSquares(moves);
          } else {
            console.log('Not a player piece or no chess engine');
            setSelectedSquare(null);
            setHighlightedSquares([]);
          }
        } else {
          console.log('Square is empty');
          setSelectedSquare(null);
          setHighlightedSquares([]);
        }
        
        endMeasurement();
      } catch (error) {
        endMeasurement();
        console.error('Error  square click handler:', error);
        throw error;
      }
    }, optimizationRecommendations.batchUpdates ? 50 : 16), 
    [isPlayerTurn, selectedSquare, chessEngine, orientation, onMove, optimizationRecommendations.batchUpdates]
  );

  // Optimized drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, square: Square) => {
    if (!isPlayerTurn || !square.piece) return;
    
    const isPlayerPiece = (orientation === 'white' && square.piece.color === 'w') ||
                         (orientation === 'black' && square.piece.color === 'b');
    
    if (!isPlayerPiece) {
      e.preventDefault();
      return;
    }
    
    const squareNotation = `${square.file}${square.rank}`;
    setDraggedPiece({ square: squareNotation, piece: square.piece });
    setSelectedSquare(squareNotation);
    
    // Calculate valid moves on-demand for drag highlighting
    const moves = chessEngine ? chessEngine.getValidMoves(squareNotation) : [];
    setHighlightedSquares(moves);
    
    // Set drag image to be transparent for better performance
    if (optimizationRecommendations.useHardwareAcceleration) {
      const dragImage = new Image();
      dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    }
  }, [isPlayerTurn, orientation, chessEngine, optimizationRecommendations.useHardwareAcceleration]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, square: Square) => {
    e.preventDefault();
    
    if (!draggedPiece || !chessEngine) return;
    
    const squareNotation = `${square.file}${square.rank}`;
    
    if (draggedPiece.square === squareNotation) {
      // Dropped on same square, just deselect
      setDraggedPiece(null);
      setSelectedSquare(null);
      setHighlightedSquares([]);
      return;
    }
    
    // Calculate valid moves from dragged piece on-demand
    const validMovesFromDragged = chessEngine.getValidMoves(draggedPiece.square);
    
    if (validMovesFromDragged.includes(squareNotation)) {
      // Check if this move requires pawn promotion
      if (chessEngine.requiresPromotion(draggedPiece.square, squareNotation)) {
        setShowPromotionDialog({ from: draggedPiece.square, to: squareNotation });
        setDraggedPiece(null);
        return;
      }

      // Make the move
      const move: Move = {
        from: draggedPiece.square,
        to: squareNotation,
        san: '' // Will be filled by the chess engine
      };
      
      onMove(move);
    }
    
    setDraggedPiece(null);
    setSelectedSquare(null);
    setHighlightedSquares([]);
  }, [draggedPiece, chessEngine, onMove]);

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
  }, []);

  const handlePromotion = useCallback((promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!showPromotionDialog) return;
    
    const move: Move = {
      from: showPromotionDialog.from,
      to: showPromotionDialog.to,
      promotion: promotionPiece,
      san: '' // Will be filled by the chess engine
    };
    
    onMove(move);
    setShowPromotionDialog(null);
    setSelectedSquare(null);
    setHighlightedSquares([]);
  }, [showPromotionDialog, onMove]);

  // Memoized board rendering
  const renderedBoard = useMemo(() => {
    const endMeasurement = PerformanceMonitor.startMeasurement('board_rendering');
    
    try {
      const displayBoard = orientation === 'white' ? board : [...board].reverse();
      
      const result = displayBoard.map((rank, rankIndex) => {
        const displayRank = orientation === 'white' ? rank : [...rank].reverse();
        
        return (
          <div key={rankIndex} className="flex">
            {displayRank.map((square) => {
              const squareNotation = `${square.file}${square.rank}`;
              const isSelected = selectedSquare === squareNotation;
              const isHighlighted = highlightedSquares.includes(squareNotation);
              const isLastMove = lastMove && (lastMove.from === squareNotation || lastMove.to === squareNotation);
              const isKingInCheck = gameStatus === 'check' && square.piece?.type === 'k' && 
                                   ((orientation === 'white' && square.piece.color === 'w') ||
                                    (orientation === 'black' && square.piece.color === 'b'));

              return (
                <MemoizedSquare
                  key={squareNotation}
                  square={square}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isLastMove={!!isLastMove}
                  isKingInCheck={!!isKingInCheck}
                  theme={theme}
                  isPlayerTurn={isPlayerTurn}
                  onClick={() => throttledSquareClick(square)}
                  onDragStart={(e) => handleDragStart(e, square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  onDragEnd={handleDragEnd}
                />
              );
            })}
          </div>
        );
      });
      
      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }, [
    board, 
    orientation, 
    selectedSquare, 
    highlightedSquares, 
    lastMove, 
    gameStatus, 
    theme, 
    isPlayerTurn, 
    throttledSquareClick, 
    handleDragStart, 
    handleDragOver, 
    handleDrop, 
    handleDragEnd
  ]);

  // Clear selection when game state changes (e.g., after AI move)
  useEffect(() => {
    setSelectedSquare(null);
    setHighlightedSquares([]);
  }, [position]);

  // Board container classes with performance optimizations
  const boardContainerClasses = useMemo(() => {
    let classes = `inline-block border-4 rounded-lg shadow-2xl ${theme === 'light' ? 'border-amber-900' : 'border-slate-900'}`;
    
    // Add hardware acceleration if supported and recommended
    if (optimizationRecommendations.useHardwareAcceleration) {
      classes += ' transform-gpu';
    }
    
    // Reduce animations on low-end devices
    if (optimizationRecommendations.reduceAnimations) {
      classes = classes.replace('shadow-2xl', 'shadow-lg');
    }
    
    return classes;
  }, [theme, optimizationRecommendations]);

  const boardInnerClasses = useMemo(() => {
    let classes = `p-2 ${theme === 'light' ? 'bg-amber-900' : 'bg-slate-900'}`;
    
    // Add hardware acceleration for inner container too
    if (optimizationRecommendations.useHardwareAcceleration) {
      classes += ' transform-gpu';
    }
    
    return classes;
  }, [theme, optimizationRecommendations]);

  return (
    <>
      <div 
        className={boardContainerClasses}
        data-chess-board="true"
      >
        <div className={boardInnerClasses}>
          {renderedBoard}
        </div>
      </div>
      <MemoizedPromotionDialog
        isVisible={!!showPromotionDialog}
        orientation={orientation}
        onPromotion={handlePromotion}
      />
    </>
  );
}

export default memo(OptimizedChessboard);