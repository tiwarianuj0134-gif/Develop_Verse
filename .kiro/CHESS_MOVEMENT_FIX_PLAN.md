# Chess Piece Movement - Fix Implementation Plan

## Overview
Fix the piece movement system by addressing the root causes identified in the analysis.

## Fix Strategy

### Fix 1: Expose ChessEngine Properly in GameManager
**File**: `src/components/chess/GameManager.ts`

**Changes**:
- Add public getter method for chessEngine
- Ensure it's always initialized

**Code**:
```typescript
// Add this method to GameManager class
getChessEngine(): ChessEngine {
  return this.chessEngine;
}
```

---

### Fix 2: Fix ChessboardWrapperNew Valid Moves Logic
**File**: `src/components/chess/ChessboardWrapperNew.tsx`

**Problem**: Valid moves are only calculated AFTER selection, but they're needed BEFORE move execution.

**Solution**: 
- Calculate valid moves immediately when square is clicked
- Pass chessEngine to OptimizedChessboard so it can calculate moves on demand
- Remove the wrapper's state management for valid moves

**Code Changes**:
```typescript
// Remove the selectedSquare state from wrapper
// Pass chessEngine directly to OptimizedChessboard
// Let OptimizedChessboard handle move calculation

<OptimizedChessboard
  position={gameState.fen}
  orientation={playerColor}
  onMove={handleMove}
  chessEngine={chessEngine}  // Pass directly
  lastMove={gameState.lastMove}
  theme={theme}
  isPlayerTurn={gameState.currentPlayer === playerColor && gameState.gameStatus === 'playing' && !disabled}
  gameStatus={gameState.gameStatus}
/>
```

---

### Fix 3: Fix OptimizedChessboard Move Calculation
**File**: `src/components/chess/OptimizedChessboard.tsx`

**Problem**: Relies on `validMoves` prop which is empty on first click.

**Solution**:
- Calculate valid moves on-demand when square is clicked
- Use chessEngine to get moves directly
- Remove dependency on validMoves prop for move validation

**Code Changes**:
```typescript
// In throttledSquareClick handler:
const throttledSquareClick = useMemo(() => 
  throttle((square: Square) => {
    if (!isPlayerTurn) return;

    const squareNotation = `${square.file}${square.rank}`;

    if (selectedSquare === squareNotation) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
      return;
    }

    // Calculate valid moves from selected square
    if (selectedSquare) {
      const validMovesForSelected = chessEngine 
        ? chessEngine.getValidMoves(selectedSquare)
        : [];
      
      if (validMovesForSelected.includes(squareNotation)) {
        // Make the move
        const move: Move = {
          from: selectedSquare,
          to: squareNotation,
          san: ''
        };
        
        onMove(move);
        setSelectedSquare(null);
        setHighlightedSquares([]);
        return;
      }
    }

    // Select new square
    if (square.piece) {
      const isPlayerPiece = (orientation === 'white' && square.piece.color === 'w') ||
                           (orientation === 'black' && square.piece.color === 'b');
      
      if (isPlayerPiece && chessEngine) {
        setSelectedSquare(squareNotation);
        const moves = chessEngine.getValidMoves(squareNotation);
        setHighlightedSquares(moves);
      }
    } else {
      setSelectedSquare(null);
      setHighlightedSquares([]);
    }
  }, 16), 
  [isPlayerTurn, selectedSquare, chessEngine, orientation, onMove]
);
```

---

### Fix 4: Fix ChessGame Component
**File**: `src/components/chess/ChessGame.tsx`

**Problem**: Accessing private chessEngine property.

**Solution**:
- Use the new public getter method
- Ensure proper initialization

**Code Changes**:
```typescript
// Change from:
chessEngine={gameManager['chessEngine']}

// To:
chessEngine={gameManager.getChessEngine()}
```

---

## Implementation Order

1. **Step 1**: Add public getter to GameManager
2. **Step 2**: Update ChessGame to use public getter
3. **Step 3**: Simplify ChessboardWrapperNew
4. **Step 4**: Fix OptimizedChessboard move calculation
5. **Step 5**: Test the fixes

## Testing Checklist

- [ ] Click on a white pawn (e.g., e2) - should highlight valid moves
- [ ] Click on a valid destination (e.g., e4) - pawn should move
- [ ] Drag and drop a piece - should work
- [ ] Try invalid move - should be rejected
- [ ] Test pawn promotion
- [ ] Test castling
- [ ] Test en passant
- [ ] Verify AI moves work after player move

