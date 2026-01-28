/**
 * AI Move Generation Tests
 * 
 * Tests for the AI move generation and validation functionality
 */

import { Chess } from 'chess.js';

// Test the AI move validation logic
describe('AI Move Generation and Validation', () => {
  
  // Helper function that mimics validateAIMove from chess.ts
  function testValidateAIMove(fen: string, aiMove: string) {
    try {
      const chess = new Chess(fen);
      
      const result = chess.move(aiMove);
      
      if (!result) {
        return {
          isValid: false,
          error: `Invalid AI move: "${aiMove}" is not legal in the current position`
        };
      }
      
      let gameStatus = "playing";
      if (chess.isCheckmate()) {
        gameStatus = "checkmate";
      } else if (chess.isStalemate()) {
        gameStatus = "stalemate";
      } else if (chess.isDraw()) {
        gameStatus = "draw";
      } else if (chess.isCheck()) {
        gameStatus = "check";
      }
      
      return {
        isValid: true,
        resultingFen: chess.fen(),
        gameStatus,
        san: result.san
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to validate AI move: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  test('validates legal AI moves in SAN notation', () => {
    const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    
    // Test legal opening moves in SAN
    const moves = ['e4', 'Nf3', 'd4', 'c4'];
    
    moves.forEach(move => {
      const result = testValidateAIMove(initialFen, move);
      expect(result.isValid).toBe(true);
      expect(result.san).toBe(move);
    });
  });

  test('rejects invalid AI moves', () => {
    const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    
    // Test invalid moves
    const invalidMoves = ['e5', 'Nf6', 'Ke2', 'Qh5'];
    
    invalidMoves.forEach(move => {
      const result = testValidateAIMove(initialFen, move);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid AI move');
    });
  });

  test('handles complex AI moves with captures and checks', () => {
    // Position where captures and checks are possible
    const fen = "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
    
    // Test capture move
    const captureResult = testValidateAIMove(fen, 'Nxe5');
    expect(captureResult.isValid).toBe(true);
    expect(captureResult.san).toBe('Nxe5');
  });

  test('validates castling moves in SAN', () => {
    // Position where castling is legal
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    
    // Test kingside castling
    const kingsideResult = testValidateAIMove(fen, 'O-O');
    expect(kingsideResult.isValid).toBe(true);
    expect(kingsideResult.san).toBe('O-O');
    
    // Test queenside castling
    const queensideResult = testValidateAIMove(fen, 'O-O-O');
    expect(queensideResult.isValid).toBe(true);
    expect(queensideResult.san).toBe('O-O-O');
  });

  test('validates pawn promotion moves', () => {
    // Position where pawn promotion is possible
    const fen = "8/P7/8/8/8/8/8/8 w - - 0 1";
    
    // Test promotion to queen
    const promotionResult = testValidateAIMove(fen, 'a8=Q');
    expect(promotionResult.isValid).toBe(true);
    expect(promotionResult.san).toBe('a8=Q');
  });

  test('detects game ending conditions from AI moves', () => {
    // Position leading to checkmate
    const checkmatePosition = "rnbqkbnr/pppp1p1p/8/6p1/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2";
    
    // AI move that delivers checkmate
    const checkmateResult = testValidateAIMove(checkmatePosition, 'Qh4#');
    expect(checkmateResult.isValid).toBe(true);
    expect(checkmateResult.gameStatus).toBe('checkmate');
  });
});

// Test retry logic simulation
describe('AI Move Retry Logic', () => {
  
  test('should handle multiple validation attempts', () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    
    // Simulate retry logic
    const invalidMoves = ['invalid', 'e5', 'Ke2'];
    const validMove = 'e4';
    
    let attempts = 0;
    let result = null;
    
    // Try invalid moves first
    for (const move of invalidMoves) {
      attempts++;
      result = testValidateAIMove(fen, move);
      if (result.isValid) break;
    }
    
    // Then try valid move
    if (!result?.isValid) {
      attempts++;
      result = testValidateAIMove(fen, validMove);
    }
    
    expect(result?.isValid).toBe(true);
    expect(attempts).toBe(4); // 3 invalid + 1 valid
  });
});

// Test turn validation logic
describe('Turn Validation', () => {
  
  test('should correctly identify whose turn it is', () => {
    const whiteTurnFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const blackTurnFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    
    const whiteChess = new Chess(whiteTurnFen);
    const blackChess = new Chess(blackTurnFen);
    
    expect(whiteChess.turn()).toBe('w');
    expect(blackChess.turn()).toBe('b');
  });

  test('should validate turn-based move restrictions', () => {
    const playerColor = 'white';
    const aiColor = 'black';
    
    // White's turn - player can move, AI cannot
    const whiteTurnFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const chess = new Chess(whiteTurnFen);
    
    const isPlayerTurn = chess.turn() === 'w' && playerColor === 'white';
    const isAITurn = chess.turn() === 'b' && aiColor === 'black';
    
    expect(isPlayerTurn).toBe(true);
    expect(isAITurn).toBe(false);
  });
});

export {};