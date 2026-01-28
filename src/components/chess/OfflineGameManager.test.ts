/**
 * Unit Tests for OfflineGameManager
 * Tests offline gameplay and synchronization functionality
 * Requirements: 7.3 - Network error handling and offline support
 */

import { OfflineGameManager } from './OfflineGameManager';
import { GameSettings } from './GameManager';
import { networkService } from './NetworkService';

// Mock the NetworkService
jest.mock('./NetworkService', () => ({
  networkService: {
    canPerformOnlineOperations: jest.fn(),
    subscribe: jest.fn(),
    addPendingOperation: jest.fn(),
    getNetworkStatus: jest.fn(),
    getOfflineCapabilities: jest.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock window events
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

// Mock chess.js
jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation(() => ({
    moves: jest.fn().mockReturnValue(['e4', 'Nf3', 'Bc4']),
    move: jest.fn().mockReturnValue({
      from: 'e2',
      to: 'e4',
      san: 'e4',
      promotion: undefined
    }),
    history: jest.fn().mockReturnValue([]),
    fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }))
}));

describe('OfflineGameManager', () => {
  let offlineGameManager: OfflineGameManager;
  let mockNetworkService: jest.Mocked<typeof networkService>;

  const defaultSettings: GameSettings = {
    difficulty: 'medium',
    playerColor: 'white'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    mockNetworkService = networkService as jest.Mocked<typeof networkService>;
    mockNetworkService.canPerformOnlineOperations.mockReturnValue(false);
    mockNetworkService.subscribe.mockReturnValue(() => {});
    mockNetworkService.getNetworkStatus.mockReturnValue({
      isOnline: false,
      isBackendAvailable: false,
      lastChecked: Date.now(),
      connectionQuality: 'offline',
      retryCount: 0
    });
    mockNetworkService.getOfflineCapabilities.mockReturnValue({
      canPlayLocally: true,
      canSaveGameState: true,
      canLoadGameState: true,
      hasLocalAI: true,
      pendingOperations: []
    });

    offlineGameManager = new OfflineGameManager(defaultSettings);
  });

  afterEach(() => {
    offlineGameManager.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize in offline mode when network unavailable', () => {
      expect(offlineGameManager.isOfflineMode()).toBe(true);
    });

    test('should initialize in online mode when network available', () => {
      mockNetworkService.canPerformOnlineOperations.mockReturnValue(true);
      const onlineManager = new OfflineGameManager(defaultSettings);
      
      expect(onlineManager.isOfflineMode()).toBe(false);
      onlineManager.cleanup();
    });

    test('should load offline state from localStorage', () => {
      const savedOfflineState = {
        isOfflineMode: true,
        pendingMoves: [{ from: 'e2', to: 'e4', san: 'e4' }],
        pendingOperations: [],
        syncStatus: 'pending'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedOfflineState));
      
      const manager = new OfflineGameManager(defaultSettings);
      const offlineState = manager.getOfflineState();
      
      expect(offlineState.pendingMoves).toHaveLength(1);
      expect(offlineState.syncStatus).toBe('pending');
      
      manager.cleanup();
    });
  });

  describe('Offline Move Handling', () => {
    test('should make moves offline successfully', () => {
      const move = { from: 'e2', to: 'e4', san: 'e4' };
      const result = offlineGameManager.makeOfflineMove(move);
      
      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(offlineGameManager.getPendingMovesCount()).toBe(1);
    });

    test('should reject invalid moves', () => {
      // Mock invalid move
      jest.spyOn(offlineGameManager, 'makeMove').mockReturnValue({
        isValid: false,
        error: 'Invalid move'
      });

      const move = { from: 'a1', to: 'a8', san: 'invalid' };
      const result = offlineGameManager.makeOfflineMove(move);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid move');
      expect(offlineGameManager.getPendingMovesCount()).toBe(0);
    });

    test('should track pending moves for sync', () => {
      const moves = [
        { from: 'e2', to: 'e4', san: 'e4' },
        { from: 'd2', to: 'd4', san: 'd4' }
      ];

      moves.forEach(move => {
        offlineGameManager.makeOfflineMove(move);
      });

      expect(offlineGameManager.getPendingMovesCount()).toBe(2);
      
      const offlineState = offlineGameManager.getOfflineState();
      expect(offlineState.syncStatus).toBe('pending');
    });
  });

  describe('Offline AI Move Generation', () => {
    test('should generate AI moves in easy mode', async () => {
      const settings: GameSettings = { difficulty: 'easy', playerColor: 'white' };
      const easyManager = new OfflineGameManager(settings);
      
      const result = await easyManager.generateOfflineAIMove();
      
      expect(result.success).toBe(true);
      expect(result.move).toBeDefined();
      expect(result.move?.san).toBeDefined();
      
      easyManager.cleanup();
    });

    test('should generate AI moves in medium mode', async () => {
      const settings: GameSettings = { difficulty: 'medium', playerColor: 'white' };
      const mediumManager = new OfflineGameManager(settings);
      
      const result = await mediumManager.generateOfflineAIMove();
      
      expect(result.success).toBe(true);
      expect(result.move).toBeDefined();
      
      mediumManager.cleanup();
    });

    test('should generate AI moves in hard mode', async () => {
      const settings: GameSettings = { difficulty: 'hard', playerColor: 'white' };
      const hardManager = new OfflineGameManager(settings);
      
      const result = await hardManager.generateOfflineAIMove();
      
      expect(result.success).toBe(true);
      expect(result.move).toBeDefined();
      
      hardManager.cleanup();
    });

    test('should handle AI generation failure', async () => {
      // Mock chess.js to return no moves
      const { Chess } = await import('chess.js');
      const mockChess = Chess as jest.MockedClass<typeof Chess>;
      mockChess.mockImplementation(() => ({
        moves: jest.fn().mockReturnValue([]),
        move: jest.fn(),
        history: jest.fn().mockReturnValue([]),
        fen: jest.fn()
      } as any));

      const result = await offlineGameManager.generateOfflineAIMove();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No legal moves available');
    });

    test('should respect local AI enabled setting', async () => {
      offlineGameManager.setLocalAIEnabled(false);
      
      const result = await offlineGameManager.generateOfflineAIMove();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Local AI is disabled');
    });
  });

  describe('Network Status Changes', () => {
    test('should handle network restoration', () => {
      // Start offline
      expect(offlineGameManager.isOfflineMode()).toBe(true);
      
      // Simulate network restoration
      const mockSubscribe = mockNetworkService.subscribe.mock.calls[0][0];
      mockSubscribe({
        isOnline: true,
        isBackendAvailable: true,
        lastChecked: Date.now(),
        connectionQuality: 'good',
        retryCount: 0
      });
      
      // Should attempt sync (we can't easily test the async sync here)
      expect(offlineGameManager.getOfflineState().isOfflineMode).toBe(false);
    });

    test('should handle network loss', () => {
      // Start online
      mockNetworkService.canPerformOnlineOperations.mockReturnValue(true);
      const onlineManager = new OfflineGameManager(defaultSettings);
      
      expect(onlineManager.isOfflineMode()).toBe(false);
      
      // Simulate network loss
      const mockSubscribe = mockNetworkService.subscribe.mock.calls[0][0];
      mockSubscribe({
        isOnline: false,
        isBackendAvailable: false,
        lastChecked: Date.now(),
        connectionQuality: 'offline',
        retryCount: 0
      });
      
      expect(onlineManager.getOfflineState().isOfflineMode).toBe(true);
      
      onlineManager.cleanup();
    });
  });

  describe('Synchronization', () => {
    test('should sync pending moves when network available', async () => {
      // Add some pending moves
      offlineGameManager.makeOfflineMove({ from: 'e2', to: 'e4', san: 'e4' });
      offlineGameManager.makeOfflineMove({ from: 'd2', to: 'd4', san: 'd4' });
      
      expect(offlineGameManager.getPendingMovesCount()).toBe(2);
      
      // Mock network as available
      mockNetworkService.canPerformOnlineOperations.mockReturnValue(true);
      
      const syncResult = await offlineGameManager.attemptSync();
      
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedMoves).toBe(2);
      expect(offlineGameManager.getPendingMovesCount()).toBe(0);
    });

    test('should not sync when network unavailable', async () => {
      offlineGameManager.makeOfflineMove({ from: 'e2', to: 'e4', san: 'e4' });
      
      mockNetworkService.canPerformOnlineOperations.mockReturnValue(false);
      
      const syncResult = await offlineGameManager.attemptSync();
      
      expect(syncResult.success).toBe(false);
      expect(syncResult.errors).toContain('Network not available');
      expect(offlineGameManager.getPendingMovesCount()).toBe(1);
    });

    test('should handle empty pending moves', async () => {
      mockNetworkService.canPerformOnlineOperations.mockReturnValue(true);
      
      const syncResult = await offlineGameManager.attemptSync();
      
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedMoves).toBe(0);
    });
  });

  describe('State Persistence', () => {
    test('should save offline state to localStorage', () => {
      offlineGameManager.makeOfflineMove({ from: 'e2', to: 'e4', san: 'e4' });
      
      // Trigger save by waiting for the interval or calling it directly
      // Since we can't easily test the interval, we'll verify the localStorage call
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should clear offline state', () => {
      offlineGameManager.makeOfflineMove({ from: 'e2', to: 'e4', san: 'e4' });
      
      offlineGameManager.clearOfflineState();
      
      expect(offlineGameManager.getPendingMovesCount()).toBe(0);
      expect(offlineGameManager.getOfflineState().syncStatus).toBe('synced');
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Game State Export/Import', () => {
    test('should export offline game state', () => {
      offlineGameManager.makeOfflineMove({ from: 'e2', to: 'e4', san: 'e4' });
      
      const exportedState = offlineGameManager.exportOfflineGameState();
      
      expect(exportedState).toHaveProperty('offlineState');
      expect(exportedState).toHaveProperty('networkStatus');
      expect(exportedState).toHaveProperty('capabilities');
      expect(exportedState.offlineState.pendingMoves).toHaveLength(1);
    });

    test('should provide sync status information', () => {
      offlineGameManager.makeOfflineMove({ from: 'e2', to: 'e4', san: 'e4' });
      
      const syncStatus = offlineGameManager.getSyncStatus();
      
      expect(syncStatus.status).toBe('pending');
      expect(syncStatus.pendingMoves).toBe(1);
      expect(syncStatus.canSync).toBe(false); // Network unavailable
    });
  });

  describe('Local AI Settings', () => {
    test('should enable/disable local AI', () => {
      expect(offlineGameManager.isLocalAIEnabled()).toBe(true);
      
      offlineGameManager.setLocalAIEnabled(false);
      expect(offlineGameManager.isLocalAIEnabled()).toBe(false);
      
      offlineGameManager.setLocalAIEnabled(true);
      expect(offlineGameManager.isLocalAIEnabled()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources properly', () => {
      const unsubscribeMock = jest.fn();
      mockNetworkService.subscribe.mockReturnValue(unsubscribeMock);
      
      const manager = new OfflineGameManager(defaultSettings);
      manager.cleanup();
      
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mockWindow.removeEventListener).toHaveBeenCalled();
    });
  });
});