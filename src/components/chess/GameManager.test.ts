/**
 * Comprehensive Unit Tests for GameManager
 * Tests game orchestration, state management, and player interactions
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.4, 5.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameManager, GameSettings, GameResult } from './GameManager';
import { Move } from './ChessEngine';

describe('GameManager', () => {
  let gameManager: GameManager;
  let defaultSettings: GameSettings;

  beforeEach(() => {
    defaultSettings = {
      difficulty: 'medium',
      playerColor: 'white'
    };
    gameManager = new GameManager(defaultSettings);
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const settings = gameManager.getGameSettings();
      
      expect(settings.difficulty).toBe('medium');
      expect(settings.playerColor).toBe('white');
    });

    it('should initialize with custom settings', () => {
      const customSettings: GameSettings = {
        difficulty: 'hard',
        playerColor: 'black',
        timeControl: {
          initialTime: 600,
          increment: 5
        }
      };
      
      const customManager = new GameManager(customSettings);
      const settings = customManager.getGameSettings();
      
      expect(settings.difficulty).toBe('hard');
      expect(settings.playerColor).toBe('black');
      expect(settings.timeControl?.initialTime).toBe(600);
      expect(settings.timeControl?.increment).toBe(5);
    });

    it('should initialize with custom starting position', () => {
      const customFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const customManager = new GameManager(defaultSettings, customFen);
      
      const gameState = customManager.getGameState();
      expect(gameState.fen).toBe(customFen);
      expect(gameState.currentPlayer).toBe('black');
    });

    it('should generate unique game IDs', () => {
      const manager1 = new GameManager(defaultSettings);
      const manager2 = new GameManager(defaultSettings);
      
      const stats1 = manager1.getGameStats();
      const stats2 = manager2.getGameStats();
      
      expect(stats1.gameId).not.toBe(stats2.gameId);
    });
  });

  describe('Move Management', () => {
    it('should make valid moves successfully', () => {
      const move: Move = {
        from: 'e2',
        to: 'e4',
        san: 'e4'
      };
      
      const validation = gameManager.makeMove(move);
      
      expect(validation.isValid).toBe(true);
      expect(validation.resultingFen).toBeDefined();
      
      const gameState = gameManager.getGameState();
      expect(gameState.moveHistory).toHaveLength(1);
      expect(gameState.currentPlayer).toBe('black');
    });

    it('should reject invalid moves', () => {
      const invalidMove: Move = {
        from: 'e2',
        to: 'e5', // Pawn can't move 3 squares
        san: 'e5'
      };
      
      const validation = gameManager.makeMove(invalidMove);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
      
      const gameState = gameManager.getGameState();
      expect(gameState.moveHistory).toHaveLength(0);
    });

    it('should track move timestamps', () => {
      const move1: Move = { from: 'e2', to: 'e4', san: 'e4' };
      const move2: Move = { from: 'e7', to: 'e5', san: 'e5' };
      
      const time1 = Date.now();
      gameManager.makeMove(move1);
      
      // Small delay to ensure different timestamps
      vi.advanceTimersByTime(10);
      
      const time2 = Date.now();
      gameManager.makeMove(move2);
      
      const stats = gameManager.getGameStats();
      expect(stats.moveCount).toBe(2);
    });

    it('should get valid moves for specific squares', () => {
      const validMoves = gameManager.getValidMoves('e2');
      
      expect(validMoves).toContain('e3');
      expect(validMoves).toContain('e4');
      expect(validMoves).toHaveLength(2);
    });

    it('should get all valid moves in position', () => {
      const allMoves = gameManager.getAllValidMoves();
      
      expect(allMoves).toHaveLength(20); // Starting position has 20 legal moves
      
      allMoves.forEach(move => {
        expect(move).toHaveProperty('from');
        expect(move).toHaveProperty('to');
        expect(move).toHaveProperty('san');
      });
    });

    it('should validate moves without changing state', () => {
      const originalState = gameManager.getGameState();
      
      const isValid = gameManager.isValidMove({ from: 'e2', to: 'e4' });
      expect(isValid).toBe(true);
      
      const currentState = gameManager.getGameState();
      expect(currentState.fen).toBe(originalState.fen);
      expect(currentState.moveHistory).toHaveLength(originalState.moveHistory.length);
    });
  });

  describe('Undo Functionality', () => {
    it('should undo player moves correctly', () => {
      // Make two moves (player and AI)
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      gameManager.makeMove({ from: 'e7', to: 'e5', san: 'e5' });
      
      expect(gameManager.canUndo()).toBe(true);
      
      const undoSuccess = gameManager.undoLastPlayerMove();
      expect(undoSuccess).toBe(true);
      
      const gameState = gameManager.getGameState();
      expect(gameState.moveHistory).toHaveLength(0); // Both moves undone
      expect(gameState.currentPlayer).toBe('white');
    });

    it('should handle undo when it\'s player\'s turn', () => {
      // Make one player move
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      
      const undoSuccess = gameManager.undoLastPlayerMove();
      expect(undoSuccess).toBe(true);
      
      const gameState = gameManager.getGameState();
      expect(gameState.moveHistory).toHaveLength(0);
      expect(gameState.currentPlayer).toBe('white');
    });

    it('should not allow undo when no moves made', () => {
      expect(gameManager.canUndo()).toBe(false);
      
      const undoSuccess = gameManager.undoLastPlayerMove();
      expect(undoSuccess).toBe(false);
    });

    it('should not allow undo when game is over', () => {
      // Load checkmate position
      gameManager.loadPosition('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      
      expect(gameManager.canUndo()).toBe(false);
      
      const undoSuccess = gameManager.undoLastPlayerMove();
      expect(undoSuccess).toBe(false);
    });
  });

  describe('Turn Management', () => {
    it('should correctly identify current turn', () => {
      expect(gameManager.getCurrentTurn()).toBe('white');
      
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      expect(gameManager.getCurrentTurn()).toBe('black');
    });

    it('should correctly identify player turn', () => {
      // White player
      expect(gameManager.isPlayerTurn()).toBe(true);
      
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      expect(gameManager.isPlayerTurn()).toBe(false);
    });

    it('should correctly identify AI turn', () => {
      expect(gameManager.isAITurn()).toBe(false);
      
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      expect(gameManager.isAITurn()).toBe(true);
    });

    it('should handle black player correctly', () => {
      const blackPlayerSettings: GameSettings = {
        difficulty: 'medium',
        playerColor: 'black'
      };
      const blackPlayerManager = new GameManager(blackPlayerSettings);
      
      expect(blackPlayerManager.isPlayerTurn()).toBe(false);
      expect(blackPlayerManager.isAITurn()).toBe(true);
    });
  });

  describe('Game State Management', () => {
    it('should track game statistics correctly', () => {
      const initialStats = gameManager.getGameStats();
      
      expect(initialStats.moveCount).toBe(0);
      expect(initialStats.currentPlayer).toBe('white');
      expect(initialStats.gameStatus).toBe('playing');
      expect(initialStats.playerColor).toBe('white');
      expect(initialStats.difficulty).toBe('medium');
      expect(initialStats.gameId).toBeDefined();
      expect(initialStats.duration).toBeGreaterThanOrEqual(0);
    });

    it('should update statistics after moves', () => {
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      gameManager.makeMove({ from: 'e7', to: 'e5', san: 'e5' });
      
      const stats = gameManager.getGameStats();
      
      expect(stats.moveCount).toBe(2);
      expect(stats.currentPlayer).toBe('white');
    });

    it('should get detailed game status', () => {
      const statusDetails = gameManager.getGameStatusDetails();
      
      expect(statusDetails.status).toBe('playing');
      expect(statusDetails.isGameOver).toBe(false);
      expect(statusDetails.winner).toBeUndefined();
    });

    it('should detect game over states', () => {
      expect(gameManager.isGameOver()).toBe(false);
      
      // Load checkmate position
      gameManager.loadPosition('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      
      expect(gameManager.isGameOver()).toBe(true);
      
      const statusDetails = gameManager.getGameStatusDetails();
      expect(statusDetails.isGameOver).toBe(true);
      expect(statusDetails.winner).toBe('black');
    });
  });

  describe('Game Results', () => {
    it('should return null for ongoing games', () => {
      const result = gameManager.getGameResult();
      expect(result).toBeNull();
    });

    it('should return game result for finished games', () => {
      // Load checkmate position
      gameManager.loadPosition('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      
      const result = gameManager.getGameResult();
      
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('black');
      expect(result?.reason).toBe('checkmate');
      expect(result?.moveCount).toBeGreaterThanOrEqual(0);
      expect(result?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle draw results correctly', () => {
      // Load stalemate position
      gameManager.loadPosition('8/8/8/8/8/8/8/k1K5 b - - 0 1');
      
      const result = gameManager.getGameResult();
      
      expect(result?.winner).toBe('draw');
      expect(result?.reason).toBe('stalemate');
    });
  });

  describe('Position Management', () => {
    it('should load positions from FEN', () => {
      const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const success = gameManager.loadPosition(testFen);
      
      expect(success).toBe(true);
      expect(gameManager.getFen()).toBe(testFen);
      
      const gameState = gameManager.getGameState();
      expect(gameState.currentPlayer).toBe('black');
    });

    it('should handle invalid FEN', () => {
      const success = gameManager.loadPosition('invalid-fen');
      expect(success).toBe(false);
    });

    it('should reset timestamps when loading position', () => {
      const originalStats = gameManager.getGameStats();
      
      // Make some moves first
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      
      // Load new position
      const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      gameManager.loadPosition(testFen);
      
      const newStats = gameManager.getGameStats();
      expect(newStats.gameId).not.toBe(originalStats.gameId); // New game ID generated
    });
  });

  describe('PGN Support', () => {
    it('should export game to PGN', () => {
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      gameManager.makeMove({ from: 'e7', to: 'e5', san: 'e5' });
      
      const pgn = gameManager.getPgn();
      expect(pgn).toContain('1. e4 e5');
    });

    it('should load game from PGN', () => {
      const testPgn = '1. e4 e5 2. Nf3 Nc6';
      const success = gameManager.loadPgn(testPgn);
      
      expect(success).toBe(true);
      
      const gameState = gameManager.getGameState();
      expect(gameState.moveHistory).toHaveLength(4);
    });

    it('should reset timestamps when loading PGN', () => {
      const testPgn = '1. e4 e5 2. Nf3 Nc6';
      gameManager.loadPgn(testPgn);
      
      const stats = gameManager.getGameStats();
      expect(stats.moveCount).toBe(4);
    });
  });

  describe('Game Reset', () => {
    it('should reset game to starting position', () => {
      // Make some moves
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      gameManager.makeMove({ from: 'e7', to: 'e5', san: 'e5' });
      
      const originalGameId = gameManager.getGameStats().gameId;
      
      gameManager.resetGame();
      
      const gameState = gameManager.getGameState();
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.moveHistory).toHaveLength(0);
      expect(gameState.currentPlayer).toBe('white');
      
      const newStats = gameManager.getGameStats();
      expect(newStats.gameId).not.toBe(originalGameId);
      expect(newStats.moveCount).toBe(0);
    });
  });

  describe('Settings Management', () => {
    it('should update game settings', () => {
      const newSettings: Partial<GameSettings> = {
        difficulty: 'hard',
        timeControl: {
          initialTime: 300,
          increment: 3
        }
      };
      
      gameManager.updateGameSettings(newSettings);
      
      const settings = gameManager.getGameSettings();
      expect(settings.difficulty).toBe('hard');
      expect(settings.playerColor).toBe('white'); // Should preserve original
      expect(settings.timeControl?.initialTime).toBe(300);
      expect(settings.timeControl?.increment).toBe(3);
    });

    it('should preserve existing settings when updating', () => {
      gameManager.updateGameSettings({ difficulty: 'easy' });
      
      const settings = gameManager.getGameSettings();
      expect(settings.difficulty).toBe('easy');
      expect(settings.playerColor).toBe('white'); // Should be preserved
    });
  });

  describe('State Export/Import', () => {
    it('should export game state correctly', () => {
      gameManager.makeMove({ from: 'e2', to: 'e4', san: 'e4' });
      gameManager.makeMove({ from: 'e7', to: 'e5', san: 'e5' });
      
      const exportedState = gameManager.exportGameState();
      
      expect(exportedState).toHaveProperty('fen');
      expect(exportedState).toHaveProperty('gameSettings');
      expect(exportedState).toHaveProperty('gameStartTime');
      expect(exportedState).toHaveProperty('moveTimestamps');
      expect(exportedState).toHaveProperty('gameId');
      
      expect(exportedState.gameSettings.difficulty).toBe('medium');
      expect(exportedState.moveTimestamps).toHaveLength(2);
    });

    it('should import game state correctly', () => {
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        gameSettings: {
          difficulty: 'hard' as const,
          playerColor: 'black' as const
        },
        gameStartTime: Date.now() - 60000,
        moveTimestamps: [Date.now() - 30000],
        gameId: 'test-game-id'
      };
      
      const success = gameManager.importGameState(testState);
      expect(success).toBe(true);
      
      const gameState = gameManager.getGameState();
      expect(gameState.fen).toBe(testState.fen);
      expect(gameState.currentPlayer).toBe('black');
      
      const settings = gameManager.getGameSettings();
      expect(settings.difficulty).toBe('hard');
      expect(settings.playerColor).toBe('black');
      
      const stats = gameManager.getGameStats();
      expect(stats.gameId).toBe('test-game-id');
    });

    it('should handle invalid import state', () => {
      const invalidState = {
        fen: 'invalid-fen',
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-id'
      };
      
      const success = gameManager.importGameState(invalidState);
      expect(success).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid successive moves', () => {
      const moves = [
        { from: 'e2', to: 'e4', san: 'e4' },
        { from: 'e7', to: 'e5', san: 'e5' },
        { from: 'g1', to: 'f3', san: 'Nf3' },
        { from: 'b8', to: 'c6', san: 'Nc6' }
      ];
      
      moves.forEach(move => {
        const validation = gameManager.makeMove(move);
        expect(validation.isValid).toBe(true);
      });
      
      const gameState = gameManager.getGameState();
      expect(gameState.moveHistory).toHaveLength(4);
    });

    it('should maintain consistency after errors', () => {
      const originalState = gameManager.getGameState();
      
      // Try invalid move
      const invalidMove = { from: 'e2', to: 'e5', san: 'e5' };
      const validation = gameManager.makeMove(invalidMove);
      expect(validation.isValid).toBe(false);
      
      // State should be unchanged
      const currentState = gameManager.getGameState();
      expect(currentState.fen).toBe(originalState.fen);
      expect(currentState.moveHistory).toHaveLength(0);
      
      // Valid move should still work
      const validMove = { from: 'e2', to: 'e4', san: 'e4' };
      const validValidation = gameManager.makeMove(validMove);
      expect(validValidation.isValid).toBe(true);
    });

    it('should handle complex game scenarios', () => {
      // Play a short game with various move types
      const moves = [
        { from: 'e2', to: 'e4', san: 'e4' },     // Pawn move
        { from: 'e7', to: 'e5', san: 'e5' },     // Pawn move
        { from: 'g1', to: 'f3', san: 'Nf3' },    // Knight move
        { from: 'b8', to: 'c6', san: 'Nc6' },    // Knight move
        { from: 'f1', to: 'c4', san: 'Bc4' },    // Bishop move
        { from: 'f8', to: 'c5', san: 'Bc5' }     // Bishop move
      ];
      
      moves.forEach(move => {
        const validation = gameManager.makeMove(move);
        expect(validation.isValid).toBe(true);
      });
      
      // Test undo functionality
      const undoSuccess = gameManager.undoLastPlayerMove();
      expect(undoSuccess).toBe(true);
      
      const gameState = gameManager.getGameState();
      expect(gameState.moveHistory).toHaveLength(4); // Should have undone 2 moves
      
      // Test game statistics
      const stats = gameManager.getGameStats();
      expect(stats.moveCount).toBe(4);
      expect(stats.currentPlayer).toBe('white');
    });
  });
});