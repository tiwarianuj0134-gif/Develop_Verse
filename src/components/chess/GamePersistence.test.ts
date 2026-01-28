/**
 * Comprehensive Unit Tests for GamePersistence
 * Tests game state persistence, auto-save, and state recovery
 * Requirements: 4.3, 7.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GamePersistence } from './GamePersistence';
import { GameManager, GameSettings } from './GameManager';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock GameManager
vi.mock('./GameManager', () => ({
  GameManager: vi.fn().mockImplementation((settings: GameSettings, fen?: string) => ({
    exportGameState: vi.fn(() => ({
      fen: fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      gameSettings: settings,
      gameStartTime: Date.now(),
      moveTimestamps: [],
      gameId: 'test-game-id'
    })),
    importGameState: vi.fn(() => true),
    getGameSettings: vi.fn(() => settings),
    getFen: vi.fn(() => fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }))
}));

describe('GamePersistence', () => {
  let persistence: GamePersistence;
  let mockGameManager: GameManager;
  let defaultSettings: GameSettings;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    persistence = new GamePersistence();
    defaultSettings = {
      difficulty: 'medium',
      playerColor: 'white'
    };
    mockGameManager = new GameManager(defaultSettings);
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    persistence.stopAutoSave();
  });

  describe('Basic Persistence', () => {
    it('should save game state to localStorage', () => {
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: [Date.now()],
        gameId: 'test-game-id'
      };

      persistence.saveGameState(mockGameManager);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chess-game-state',
        expect.stringContaining('"gameSettings"')
      );
    });

    it('should load game state from localStorage', () => {
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        gameSettings: defaultSettings,
        gameStartTime: Date.now() - 60000,
        moveTimestamps: [Date.now() - 30000],
        gameId: 'test-game-id',
        timestamp: Date.now() - 30000
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testState));

      const loadedState = persistence.loadGameState();

      expect(loadedState).toEqual(testState);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chess-game-state');
    });

    it('should return null when no saved state exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const loadedState = persistence.loadGameState();

      expect(loadedState).toBeNull();
    });

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const loadedState = persistence.loadGameState();

      expect(loadedState).toBeNull();
    });

    it('should clear saved state', () => {
      persistence.clearSavedState();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chess-game-state');
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should start auto-save with default interval', () => {
      persistence.startAutoSave(mockGameManager);

      // Fast-forward time to trigger auto-save
      vi.advanceTimersByTime(30000); // Default 30 second interval

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should start auto-save with custom interval', () => {
      persistence.startAutoSave(mockGameManager, 10000); // 10 second interval

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should stop auto-save', () => {
      persistence.startAutoSave(mockGameManager);
      persistence.stopAutoSave();

      // Fast-forward time - should not trigger save
      vi.advanceTimersByTime(60000);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not start multiple auto-save intervals', () => {
      persistence.startAutoSave(mockGameManager);
      persistence.startAutoSave(mockGameManager); // Second call should stop first

      // Fast-forward time
      vi.advanceTimersByTime(30000);

      // Should only save once per interval
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should handle auto-save errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      persistence.startAutoSave(mockGameManager);

      // Should not throw error
      expect(() => {
        vi.advanceTimersByTime(30000);
      }).not.toThrow();
    });
  });

  describe('State Age Calculation', () => {
    it('should return null when no saved state exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const age = persistence.getSavedStateAge();

      expect(age).toBeNull();
    });

    it('should calculate age of saved state', () => {
      const timestamp = Date.now() - 60000; // 1 minute ago
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: timestamp,
        moveTimestamps: [],
        gameId: 'test-game-id',
        timestamp
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testState));

      const age = persistence.getSavedStateAge();

      expect(age).toBeCloseTo(60000, -2); // Within 100ms tolerance
    });

    it('should handle corrupted timestamp data', () => {
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-game-id'
        // Missing timestamp
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testState));

      const age = persistence.getSavedStateAge();

      expect(age).toBeNull();
    });
  });

  describe('Game Manager Restoration', () => {
    it('should restore GameManager from saved state', () => {
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        gameSettings: {
          difficulty: 'hard' as const,
          playerColor: 'black' as const
        },
        gameStartTime: Date.now() - 60000,
        moveTimestamps: [Date.now() - 30000],
        gameId: 'test-game-id',
        timestamp: Date.now() - 30000
      };

      const restoredManager = persistence.restoreGameManager(testState);

      expect(restoredManager).toBeDefined();
      expect(GameManager).toHaveBeenCalledWith(
        testState.gameSettings,
        testState.fen
      );
    });

    it('should return null for invalid state', () => {
      const invalidState = {
        // Missing required fields
        fen: 'invalid-fen'
      };

      const restoredManager = persistence.restoreGameManager(invalidState as any);

      expect(restoredManager).toBeNull();
    });

    it('should handle restoration errors', () => {
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-game-id',
        timestamp: Date.now()
      };

      // Mock GameManager constructor to throw
      const { GameManager } = require('./GameManager');
      GameManager.mockImplementationOnce(() => {
        throw new Error('Failed to create GameManager');
      });

      const restoredManager = persistence.restoreGameManager(testState);

      expect(restoredManager).toBeNull();
    });
  });

  describe('State Validation', () => {
    it('should validate complete game state', () => {
      const validState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-game-id',
        timestamp: Date.now()
      };

      const restoredManager = persistence.restoreGameManager(validState);

      expect(restoredManager).toBeDefined();
    });

    it('should reject state with missing FEN', () => {
      const invalidState = {
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-game-id',
        timestamp: Date.now()
      };

      const restoredManager = persistence.restoreGameManager(invalidState as any);

      expect(restoredManager).toBeNull();
    });

    it('should reject state with missing game settings', () => {
      const invalidState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-game-id',
        timestamp: Date.now()
      };

      const restoredManager = persistence.restoreGameManager(invalidState as any);

      expect(restoredManager).toBeNull();
    });

    it('should reject state with invalid game settings', () => {
      const invalidState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: {
          difficulty: 'invalid-difficulty',
          playerColor: 'invalid-color'
        },
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-game-id',
        timestamp: Date.now()
      };

      const restoredManager = persistence.restoreGameManager(invalidState as any);

      expect(restoredManager).toBeNull();
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle localStorage quota exceeded', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => {
        persistence.saveGameState(mockGameManager);
      }).not.toThrow();
    });

    it('should handle localStorage access denied', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      expect(() => {
        persistence.saveGameState(mockGameManager);
      }).not.toThrow();
    });

    it('should handle localStorage not available', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      expect(() => {
        const tempPersistence = new GamePersistence();
        tempPersistence.saveGameState(mockGameManager);
      }).not.toThrow();

      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });

    it('should handle JSON serialization errors', () => {
      // Mock GameManager to return circular reference
      mockGameManager.exportGameState = vi.fn(() => {
        const obj: any = {};
        obj.circular = obj;
        return obj;
      });

      expect(() => {
        persistence.saveGameState(mockGameManager);
      }).not.toThrow();
    });
  });

  describe('Multiple Game States', () => {
    it('should overwrite previous saved state', () => {
      // Save first state
      persistence.saveGameState(mockGameManager);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);

      // Save second state
      persistence.saveGameState(mockGameManager);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);

      // Both calls should use the same key
      expect(mockLocalStorage.setItem).toHaveBeenNthCalledWith(
        1,
        'chess-game-state',
        expect.any(String)
      );
      expect(mockLocalStorage.setItem).toHaveBeenNthCalledWith(
        2,
        'chess-game-state',
        expect.any(String)
      );
    });

    it('should handle rapid successive saves', () => {
      // Rapidly save multiple times
      for (let i = 0; i < 10; i++) {
        persistence.saveGameState(mockGameManager);
      }

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(10);
    });
  });

  describe('State Timestamps', () => {
    it('should add timestamp when saving', () => {
      const beforeSave = Date.now();
      persistence.saveGameState(mockGameManager);
      const afterSave = Date.now();

      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);

      expect(parsedData.timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(parsedData.timestamp).toBeLessThanOrEqual(afterSave);
    });

    it('should preserve original timestamps when loading', () => {
      const originalTimestamp = Date.now() - 60000;
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: originalTimestamp,
        moveTimestamps: [originalTimestamp + 30000],
        gameId: 'test-game-id',
        timestamp: originalTimestamp
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testState));

      const loadedState = persistence.loadGameState();

      expect(loadedState?.timestamp).toBe(originalTimestamp);
      expect(loadedState?.gameStartTime).toBe(originalTimestamp);
    });
  });

  describe('Integration with GameManager', () => {
    it('should save and restore complete game session', () => {
      // Create a game manager with some state
      const gameSettings: GameSettings = {
        difficulty: 'hard',
        playerColor: 'black',
        timeControl: {
          initialTime: 600,
          increment: 5
        }
      };

      const gameManager = new GameManager(gameSettings);
      
      // Save the state
      persistence.saveGameState(gameManager);

      // Simulate loading from localStorage
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      mockLocalStorage.getItem.mockReturnValue(savedData);

      // Load and restore
      const loadedState = persistence.loadGameState();
      expect(loadedState).toBeDefined();

      const restoredManager = persistence.restoreGameManager(loadedState!);
      expect(restoredManager).toBeDefined();
    });

    it('should handle auto-save during gameplay', () => {
      persistence.startAutoSave(mockGameManager, 1000); // 1 second for testing

      // Simulate game progression
      vi.advanceTimersByTime(1000);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(1000);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very old saved states', () => {
      const veryOldTimestamp = Date.now() - (365 * 24 * 60 * 60 * 1000); // 1 year ago
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: veryOldTimestamp,
        moveTimestamps: [],
        gameId: 'old-game-id',
        timestamp: veryOldTimestamp
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testState));

      const age = persistence.getSavedStateAge();
      expect(age).toBeGreaterThan(300 * 24 * 60 * 60 * 1000); // More than 300 days

      const restoredManager = persistence.restoreGameManager(testState);
      expect(restoredManager).toBeDefined(); // Should still work
    });

    it('should handle empty move timestamps array', () => {
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: [],
        gameId: 'test-game-id',
        timestamp: Date.now()
      };

      const restoredManager = persistence.restoreGameManager(testState);
      expect(restoredManager).toBeDefined();
    });

    it('should handle large move history', () => {
      const largeTimestamps = Array.from({ length: 100 }, (_, i) => Date.now() + i * 1000);
      const testState = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameSettings: defaultSettings,
        gameStartTime: Date.now(),
        moveTimestamps: largeTimestamps,
        gameId: 'test-game-id',
        timestamp: Date.now()
      };

      const restoredManager = persistence.restoreGameManager(testState);
      expect(restoredManager).toBeDefined();
    });
  });
});