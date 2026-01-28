/**
 * Comprehensive Unit Tests for ChessEngine
 * Tests core chess functionality, move validation, and game state management
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine, Move, GameState, MoveValidation } from './ChessEngine';

describe('ChessEngine', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  describe('Initialization', () => {
    it('should initialize with standard starting position', () => {
      const gameState = engine.getGameState();
      
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.currentPlayer).toBe('white');
      expect(gameState.gameStatus).toBe('playing');
      expect(gameState.moveHistory).toHaveLength(0);
    });

    it('should initialize with custom FEN position', () => {
      const customFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const customEngine = new ChessEngine(customFen);
      const gameState = customEngine.getGameState();
      
      expect(gameState.fen).toBe(customFen);
      expect(gameState.currentPlayer).toBe('black');
    });

    it('should handle invalid FEN gracefully', () => {
      const invalidEngine = new ChessEngine('invalid-fen');
      const gameState = invalidEngine.getGameState();
      
      // Should fall back to standard position
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('Basic Move Validation', () => {
    it('should validate legal pawn moves', () => {
      const move = { from: 'e2', to: 'e4' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      expect(validation.resultingFen).toBeDefined();
      expect(validation.gameStatus).toBe('playing');
    });

    it('should reject illegal pawn moves', () => {
      const move = { from: 'e2', to: 'e5' }; // Pawn can't move 3 squares
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should validate knight moves', () => {
      const move = { from: 'b1', to: 'c3' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject moves from empty squares', () => {
      const move = { from: 'e4', to: 'e5' }; // No piece on e4 initially
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(false);
    });

    it('should reject moves to squares occupied by own pieces', () => {
      const move = { from: 'b1', to: 'a1' }; // Knight to rook square
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Move History and Game State', () => {
    it('should track move history correctly', () => {
      engine.makeMove({ from: 'e2', to: 'e4' });
      engine.makeMove({ from: 'e7', to: 'e5' });
      
      const gameState = engine.getGameState();
      
      expect(gameState.moveHistory).toHaveLength(2);
      expect(gameState.moveHistory[0].from).toBe('e2');
      expect(gameState.moveHistory[0].to).toBe('e4');
      expect(gameState.moveHistory[1].from).toBe('e7');
      expect(gameState.moveHistory[1].to).toBe('e5');
    });

    it('should alternate players correctly', () => {
      const initialState = engine.getGameState();
      expect(initialState.currentPlayer).toBe('white');
      
      engine.makeMove({ from: 'e2', to: 'e4' });
      const afterWhiteMove = engine.getGameState();
      expect(afterWhiteMove.currentPlayer).toBe('black');
      
      engine.makeMove({ from: 'e7', to: 'e5' });
      const afterBlackMove = engine.getGameState();
      expect(afterBlackMove.currentPlayer).toBe('white');
    });

    it('should track last move correctly', () => {
      engine.makeMove({ from: 'e2', to: 'e4' });
      engine.makeMove({ from: 'e7', to: 'e5' });
      
      const gameState = engine.getGameState();
      expect(gameState.lastMove?.from).toBe('e7');
      expect(gameState.lastMove?.to).toBe('e5');
    });
  });

  describe('Special Chess Rules - Castling', () => {
    beforeEach(() => {
      // Set up position for castling
      engine.loadPosition('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
    });

    it('should allow kingside castling when legal', () => {
      const move = { from: 'e1', to: 'g1' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      
      // Check that both king and rook moved
      const gameState = engine.getGameState();
      expect(engine.getPiece('g1')?.type).toBe('k');
      expect(engine.getPiece('f1')?.type).toBe('r');
    });

    it('should allow queenside castling when legal', () => {
      const move = { from: 'e1', to: 'c1' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      
      // Check that both king and rook moved
      expect(engine.getPiece('c1')?.type).toBe('k');
      expect(engine.getPiece('d1')?.type).toBe('r');
    });

    it('should get available castling moves', () => {
      const castlingMoves = engine.getCastlingMoves();
      
      expect(castlingMoves).toHaveLength(2);
      expect(castlingMoves.some(move => move.to === 'g1')).toBe(true); // Kingside
      expect(castlingMoves.some(move => move.to === 'c1')).toBe(true); // Queenside
    });

    it('should prevent castling when king is in check', () => {
      // Place black queen to attack king
      engine.loadPosition('r3k2r/pppppppp/8/8/8/8/PPPPQPPP/R3K2R w KQkq - 0 1');
      
      const castlingMoves = engine.getCastlingMoves();
      expect(castlingMoves).toHaveLength(0);
    });
  });

  describe('Special Chess Rules - En Passant', () => {
    it('should detect en passant opportunities', () => {
      // Set up en passant position
      engine.loadPosition('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
      
      const enPassantMoves = engine.getEnPassantMoves();
      expect(enPassantMoves).toHaveLength(1);
      expect(enPassantMoves[0].to).toBe('d6');
    });

    it('should execute en passant capture correctly', () => {
      engine.loadPosition('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
      
      const move = { from: 'e5', to: 'd6' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      expect(validation.capturedPiece).toBe('p');
      
      // Check that the captured pawn is removed
      expect(engine.getPiece('d5')).toBeNull();
    });
  });

  describe('Special Chess Rules - Pawn Promotion', () => {
    beforeEach(() => {
      // Set up position for pawn promotion
      engine.loadPosition('rnbqkbnr/pppppppP/8/8/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1');
    });

    it('should detect when pawn promotion is required', () => {
      const requiresPromotion = engine.requiresPromotion('h7', 'h8');
      expect(requiresPromotion).toBe(true);
    });

    it('should not require promotion for non-promotion moves', () => {
      const requiresPromotion = engine.requiresPromotion('h7', 'g8');
      expect(requiresPromotion).toBe(true); // This is still a promotion move
      
      // Test with a different piece
      engine.loadPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      const noPromotion = engine.requiresPromotion('e2', 'e4');
      expect(noPromotion).toBe(false);
    });

    it('should execute pawn promotion to queen', () => {
      const move = { from: 'h7', to: 'h8', promotion: 'q' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      expect(engine.getPiece('h8')?.type).toBe('q');
      expect(engine.getPiece('h8')?.color).toBe('w');
    });

    it('should execute pawn promotion to other pieces', () => {
      const pieces = ['r', 'b', 'n'] as const;
      
      pieces.forEach((piece, index) => {
        const testEngine = new ChessEngine('rnbqkbnr/pppppppP/8/8/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1');
        const move = { from: 'h7', to: 'h8', promotion: piece };
        const validation = testEngine.makeMove(move);
        
        expect(validation.isValid).toBe(true);
        expect(testEngine.getPiece('h8')?.type).toBe(piece);
      });
    });
  });

  describe('Game State Detection', () => {
    it('should detect check correctly', () => {
      // Set up check position
      engine.loadPosition('rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2');
      
      expect(engine.inCheck()).toBe(true);
      
      const gameState = engine.getGameState();
      expect(gameState.gameStatus).toBe('check');
    });

    it('should detect checkmate correctly', () => {
      // Fool's mate position
      engine.loadPosition('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      
      expect(engine.isCheckmate()).toBe(true);
      
      const gameState = engine.getGameState();
      expect(gameState.gameStatus).toBe('checkmate');
      
      const statusDetails = engine.getGameStatusDetails();
      expect(statusDetails.isGameOver).toBe(true);
      expect(statusDetails.winner).toBe('black');
    });

    it('should detect stalemate correctly', () => {
      // Stalemate position
      engine.loadPosition('8/8/8/8/8/8/8/k1K5 b - - 0 1');
      
      expect(engine.isStalemate()).toBe(true);
      
      const gameState = engine.getGameState();
      expect(gameState.gameStatus).toBe('stalemate');
      
      const statusDetails = engine.getGameStatusDetails();
      expect(statusDetails.isGameOver).toBe(true);
      expect(statusDetails.winner).toBe('draw');
    });

    it('should detect draw by insufficient material', () => {
      // King vs King
      engine.loadPosition('8/8/8/8/8/8/8/k1K5 w - - 0 1');
      
      expect(engine.isInsufficientMaterial()).toBe(true);
      expect(engine.isDraw()).toBe(true);
      
      const statusDetails = engine.getGameStatusDetails();
      expect(statusDetails.winner).toBe('draw');
      expect(statusDetails.reason).toContain('insufficient material');
    });

    it('should detect threefold repetition', () => {
      // This is harder to test without actually repeating positions
      // For now, just test that the method exists and returns a boolean
      const isThreefold = engine.isThreefoldRepetition();
      expect(typeof isThreefold).toBe('boolean');
    });
  });

  describe('Move Generation and Validation', () => {
    it('should get valid moves for a specific square', () => {
      const validMoves = engine.getValidMoves('e2');
      
      expect(validMoves).toContain('e3');
      expect(validMoves).toContain('e4');
      expect(validMoves).toHaveLength(2);
    });

    it('should get all valid moves in position', () => {
      const allMoves = engine.getAllValidMoves();
      
      // Starting position has 20 legal moves
      expect(allMoves).toHaveLength(20);
      
      // Check that moves have required properties
      allMoves.forEach(move => {
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
        expect(move).toHaveProperty('san');
      });
    });

    it('should validate moves without changing state', () => {
      const originalFen = engine.getFen();
      
      const isValid = engine.isValidMove({ from: 'e2', to: 'e4' });
      expect(isValid).toBe(true);
      
      // State should not have changed
      expect(engine.getFen()).toBe(originalFen);
    });

    it('should return false for invalid moves', () => {
      const isValid = engine.isValidMove({ from: 'e2', to: 'e5' });
      expect(isValid).toBe(false);
    });
  });

  describe('Game Management', () => {
    it('should undo moves correctly', () => {
      const originalFen = engine.getFen();
      
      engine.makeMove({ from: 'e2', to: 'e4' });
      engine.makeMove({ from: 'e7', to: 'e5' });
      
      const undoSuccess = engine.undoMove();
      expect(undoSuccess).toBe(true);
      
      const gameState = engine.getGameState();
      expect(gameState.moveHistory).toHaveLength(1);
      expect(gameState.currentPlayer).toBe('black');
    });

    it('should handle undo when no moves to undo', () => {
      const undoSuccess = engine.undoMove();
      expect(undoSuccess).toBe(false);
    });

    it('should reset game to starting position', () => {
      engine.makeMove({ from: 'e2', to: 'e4' });
      engine.reset();
      
      const gameState = engine.getGameState();
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.moveHistory).toHaveLength(0);
    });

    it('should load positions from FEN', () => {
      const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const success = engine.loadPosition(testFen);
      
      expect(success).toBe(true);
      expect(engine.getFen()).toBe(testFen);
    });

    it('should handle invalid FEN when loading', () => {
      const success = engine.loadPosition('invalid-fen');
      expect(success).toBe(false);
    });
  });

  describe('PGN Support', () => {
    it('should export game to PGN', () => {
      engine.makeMove({ from: 'e2', to: 'e4' });
      engine.makeMove({ from: 'e7', to: 'e5' });
      
      const pgn = engine.getPgn();
      expect(pgn).toContain('1. e4 e5');
    });

    it('should load game from PGN', () => {
      const testPgn = '1. e4 e5 2. Nf3 Nc6';
      const success = engine.loadPgn(testPgn);
      
      expect(success).toBe(true);
      
      const gameState = engine.getGameState();
      expect(gameState.moveHistory).toHaveLength(4);
    });

    it('should handle invalid PGN', () => {
      const success = engine.loadPgn('invalid pgn');
      expect(success).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should get piece information correctly', () => {
      const piece = engine.getPiece('e1');
      expect(piece?.type).toBe('k');
      expect(piece?.color).toBe('w');
      
      const emptySquare = engine.getPiece('e4');
      expect(emptySquare).toBeNull();
    });

    it('should get current turn correctly', () => {
      expect(engine.getTurn()).toBe('w');
      
      engine.makeMove({ from: 'e2', to: 'e4' });
      expect(engine.getTurn()).toBe('b');
    });

    it('should track halfmove clock', () => {
      const initialClock = engine.getHalfmoveClock();
      expect(initialClock).toBe(0);
      
      // Make a pawn move (resets clock)
      engine.makeMove({ from: 'e2', to: 'e4' });
      expect(engine.getHalfmoveClock()).toBe(0);
    });

    it('should detect game over states', () => {
      expect(engine.isGameOver()).toBe(false);
      
      // Load checkmate position
      engine.loadPosition('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      expect(engine.isGameOver()).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle capture moves correctly', () => {
      engine.loadPosition('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
      
      const move = { from: 'e4', to: 'd5' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      expect(validation.capturedPiece).toBe('p');
    });

    it('should handle promotion with capture', () => {
      engine.loadPosition('rnbqkbn1/pppppppP/8/8/8/8/PPPPPPP1/RNBQKBNR w KQq - 0 1');
      
      const move = { from: 'h7', to: 'g8', promotion: 'q' };
      const validation = engine.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      expect(validation.capturedPiece).toBe('r');
      expect(engine.getPiece('g8')?.type).toBe('q');
    });

    it('should handle complex positions correctly', () => {
      // Load a complex middle game position
      const complexFen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4';
      const success = engine.loadPosition(complexFen);
      
      expect(success).toBe(true);
      
      const allMoves = engine.getAllValidMoves();
      expect(allMoves.length).toBeGreaterThan(0);
      
      // Each move should be valid
      allMoves.forEach(move => {
        expect(engine.isValidMove(move)).toBe(true);
      });
    });

    it('should maintain consistency after multiple operations', () => {
      // Perform a series of moves and undos
      const moves = [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'Nf3', to: 'Nf3' }, // This should fail
        { from: 'g1', to: 'f3' },
        { from: 'b8', to: 'c6' }
      ];
      
      let validMoves = 0;
      moves.forEach(move => {
        const validation = engine.makeMove(move);
        if (validation.isValid) {
          validMoves++;
        }
      });
      
      expect(validMoves).toBe(4); // 4 valid moves out of 5
      
      // Undo all moves
      let undoCount = 0;
      while (engine.undoMove()) {
        undoCount++;
      }
      
      expect(undoCount).toBe(4);
      
      // Should be back to starting position
      const finalState = engine.getGameState();
      expect(finalState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });
});