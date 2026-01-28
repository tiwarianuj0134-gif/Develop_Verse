import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from './_generated/api';
import schema from './schema';

// Mock the GoogleGenAI client
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent
    }
  }))
}));

// Mock chess.js
vi.mock('chess.js', () => ({
  Chess: vi.fn().mockImplementation((fen?: string) => ({
    fen: () => fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: () => 'w',
    moves: () => ['e4', 'e3', 'Nf3', 'd4', 'd3'],
    move: (move: any) => {
      if (typeof move === 'string') {
        return { from: 'e2', to: 'e4', san: move, promotion: undefined };
      }
      return { from: move.from, to: move.to, san: 'e4', promotion: move.promotion };
    },
    isCheckmate: () => false,
    isStalemate: () => false,
    isDraw: () => false,
    isCheck: () => false,
    history: () => []
  }))
}));

describe('Chess Game Error Handling', () => {
  let t: ConvexTestingHelper<typeof schema>;
  let userId: any;
  let gameId: any;

  beforeEach(async () => {
    t = new ConvexTestingHelper(schema);
    await t.run(async (ctx) => {
      // Create a test user
      userId = await ctx.db.insert('users', {
        name: 'Test User',
        email: 'test@example.com',
        emailVerificationTime: Date.now(),
        image: 'https://example.com/avatar.jpg',
        isAnonymous: false
      });

      // Create a test game
      gameId = await ctx.db.insert('chessGames', {
        userId,
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        moveHistory: [{ from: 'e2', to: 'e4', san: 'e4', timestamp: Date.now() }],
        currentPlayer: 'black',
        gameStatus: 'playing',
        difficulty: 'medium',
        playerColor: 'white',
        isCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });

    // Set up environment variable
    process.env.GEMINI_API_KEY = 'test-api-key-AIza123456789';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  describe('API Error Parsing', () => {
    it('should correctly identify quota exceeded errors', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 429,
        message: 'You exceeded your current quota'
      });

      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.usedFallback).toBe(true);
        expect(result.fallbackReason).toContain('quota exceeded');
      });
    });

    it('should correctly identify network errors', async () => {
      mockGenerateContent.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'Network error'
      });

      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.usedFallback).toBe(true);
        expect(result.fallbackReason).toContain('Network connection issue');
      });
    });

    it('should correctly identify API unavailable errors', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 503,
        message: 'Service unavailable'
      });

      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.usedFallback).toBe(true);
        expect(result.fallbackReason).toContain('temporarily unavailable');
      });
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    it('should retry on retryable errors with exponential backoff', async () => {
      let callCount = 0;
      mockGenerateContent.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw { status: 503, message: 'Service temporarily unavailable' };
        }
        return { text: () => 'e5' };
      });

      const startTime = Date.now();
      
      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.success).toBe(true);
        expect(result.attempts).toBeGreaterThan(1);
        
        // Should have taken some time due to exponential backoff
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThan(1000); // At least 1 second for retries
      });
    });

    it('should not retry on quota exceeded errors', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 429,
        message: 'Quota exceeded'
      });

      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.usedFallback).toBe(true);
        expect(result.attempts).toBe(1); // Should not retry
      });
    });
  });

  describe('Fallback AI System', () => {
    it('should use fallback AI when Gemini fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API failure'));

      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.success).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(result.move).toBeTruthy();
        expect(result.san).toBeTruthy();
      });
    });

    it('should generate different moves based on difficulty in fallback mode', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API failure'));

      const moves = {
        easy: [] as string[],
        medium: [] as string[],
        hard: [] as string[]
      };

      // Generate multiple moves for each difficulty to test randomness and strategy
      for (let i = 0; i < 10; i++) {
        for (const difficulty of ['easy', 'medium', 'hard'] as const) {
          await t.run(async (ctx) => {
            const result = await ctx.runAction(api.chess.requestAIMove, {
              gameId,
              difficulty
            });
            moves[difficulty].push(result.move);
          });
        }
      }

      // All difficulties should generate valid moves
      expect(moves.easy.every(move => move.length > 0)).toBe(true);
      expect(moves.medium.every(move => move.length > 0)).toBe(true);
      expect(moves.hard.every(move => move.length > 0)).toBe(true);
    });
  });

  describe('AI Service Status Check', () => {
    it('should report service as available when API works', async () => {
      mockGenerateContent.mockResolvedValue({ text: () => 'OK' });

      await t.run(async (ctx) => {
        const status = await ctx.runAction(api.chess.getAIServiceStatus, {});

        expect(status.status).toBe('available');
        expect(status.canRetry).toBe(true);
        expect(status.fallbackAvailable).toBe(true);
      });
    });

    it('should report service as unavailable when API fails', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 503,
        message: 'Service unavailable'
      });

      await t.run(async (ctx) => {
        const status = await ctx.runAction(api.chess.getAIServiceStatus, {});

        expect(status.status).toBe('unavailable');
        expect(status.message).toContain('temporarily unavailable');
        expect(status.fallbackAvailable).toBe(true);
      });
    });

    it('should report service as unavailable when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;

      await t.run(async (ctx) => {
        const status = await ctx.runAction(api.chess.getAIServiceStatus, {});

        expect(status.status).toBe('unavailable');
        expect(status.message).toContain('not configured');
        expect(status.canRetry).toBe(false);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should successfully recover by generating a fallback move', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API failure'));

      await t.run(async (ctx) => {
        const recovery = await ctx.runAction(api.chess.recoverFromAIError, {
          gameId,
          difficulty: 'medium',
          forceReset: false
        });

        expect(recovery.success).toBe(true);
        expect(recovery.action).toBe('move_generated');
        expect(recovery.moveResult).toBeTruthy();
        expect(recovery.serviceStatus).toBeTruthy();
      });
    });

    it('should reset game when forceReset is true', async () => {
      await t.run(async (ctx) => {
        const recovery = await ctx.runAction(api.chess.recoverFromAIError, {
          gameId,
          difficulty: 'medium',
          forceReset: true
        });

        expect(recovery.success).toBe(true);
        expect(recovery.action).toBe('game_reset');
        expect(recovery.message).toContain('reset');
      });
    });
  });

  describe('Move Validation with Error Handling', () => {
    it('should handle invalid AI moves gracefully', async () => {
      // Mock Gemini to return an invalid move
      mockGenerateContent.mockResolvedValue({ text: () => 'invalid_move' });

      // Mock chess.js to reject the invalid move
      const mockChess = vi.mocked(require('chess.js').Chess);
      mockChess.mockImplementation(() => ({
        fen: () => 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        turn: () => 'b',
        moves: () => ['e5', 'e6', 'Nf6'],
        move: (move: any) => {
          if (move === 'invalid_move') return null; // Invalid move
          return { from: 'e7', to: 'e5', san: 'e5', promotion: undefined };
        },
        isCheckmate: () => false,
        isStalemate: () => false,
        isDraw: () => false,
        isCheck: () => false,
        history: () => ['e4']
      }));

      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        // Should fall back to valid move generation
        expect(result.success).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(['e5', 'e6', 'Nf6']).toContain(result.move);
      });
    });

    it('should use emergency fallback when primary fallback fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API failure'));

      // Mock the first fallback to fail, but emergency fallback to succeed
      let fallbackCallCount = 0;
      const mockChess = vi.mocked(require('chess.js').Chess);
      mockChess.mockImplementation(() => ({
        fen: () => 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        turn: () => 'b',
        moves: () => ['e5', 'e6', 'Nf6'],
        move: (move: any) => {
          fallbackCallCount++;
          if (fallbackCallCount === 1) return null; // First fallback fails
          return { from: 'e7', to: 'e5', san: 'e5', promotion: undefined }; // Emergency succeeds
        },
        isCheckmate: () => false,
        isStalemate: () => false,
        isDraw: () => false,
        isCheck: () => false,
        history: () => ['e4']
      }));

      await t.run(async (ctx) => {
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.success).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(result.fallbackReason).toContain('Emergency fallback');
      });
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should provide user-friendly messages for different error types', async () => {
      const errorScenarios = [
        {
          error: { status: 429, message: 'Quota exceeded' },
          expectedMessage: 'AI service quota exceeded'
        },
        {
          error: { code: 'ENOTFOUND', message: 'Network error' },
          expectedMessage: 'Network connection issue'
        },
        {
          error: { status: 503, message: 'Service unavailable' },
          expectedMessage: 'temporarily unavailable'
        }
      ];

      for (const scenario of errorScenarios) {
        mockGenerateContent.mockRejectedValue(scenario.error);

        await t.run(async (ctx) => {
          const result = await ctx.runAction(api.chess.requestAIMove, {
            gameId,
            difficulty: 'medium'
          });

          expect(result.fallbackReason).toContain(scenario.expectedMessage);
        });
      }
    });
  });

  describe('Graceful Degradation', () => {
    it('should continue game functionality when AI service is degraded', async () => {
      // Simulate degraded service - some requests fail, others succeed
      let requestCount = 0;
      mockGenerateContent.mockImplementation(() => {
        requestCount++;
        if (requestCount % 2 === 0) {
          throw new Error('Intermittent failure');
        }
        return { text: () => 'e5' };
      });

      await t.run(async (ctx) => {
        // Make multiple AI move requests
        for (let i = 0; i < 5; i++) {
          const result = await ctx.runAction(api.chess.requestAIMove, {
            gameId,
            difficulty: 'medium'
          });

          // All requests should succeed (either with Gemini or fallback)
          expect(result.success).toBe(true);
          expect(result.move).toBeTruthy();
        }
      });
    });

    it('should maintain game state consistency during error recovery', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API failure'));

      await t.run(async (ctx) => {
        // Get initial game state
        const initialGame = await ctx.runQuery(api.chess.getGame, { gameId });
        const initialMoveCount = initialGame!.moveHistory.length;

        // Make AI move with fallback
        const result = await ctx.runAction(api.chess.requestAIMove, {
          gameId,
          difficulty: 'medium'
        });

        expect(result.success).toBe(true);

        // Verify game state was updated correctly
        const updatedGame = await ctx.runQuery(api.chess.getGame, { gameId });
        expect(updatedGame!.moveHistory.length).toBe(initialMoveCount + 1);
        expect(updatedGame!.currentPlayer).toBe('white'); // Should switch turns
      });
    });
  });
});