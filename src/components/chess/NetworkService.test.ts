/**
 * Unit Tests for NetworkService
 * Tests network connectivity detection and offline support functionality
 * Requirements: 7.3 - Network error handling and offline support
 */

import { NetworkService, NetworkError } from './NetworkService';

// Mock global objects
const mockNavigator = {
  onLine: true
};

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

const mockFetch = jest.fn();

// Mock window and document
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { origin: 'http://localhost:3000' },
  dispatchEvent: jest.fn()
};

const mockDocument = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  hidden: false
};

// Setup mocks
beforeAll(() => {
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
  });

  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });

  Object.defineProperty(global, 'fetch', {
    value: mockFetch,
    writable: true
  });

  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
  });

  Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true
  });

  // Mock setTimeout and clearTimeout
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigator.onLine = true;
  mockFetch.mockClear();
});

describe('NetworkService', () => {
  let networkService: NetworkService;

  beforeEach(() => {
    // Reset singleton instance
    (NetworkService as any).instance = undefined;
    networkService = NetworkService.getInstance();
  });

  afterEach(() => {
    networkService.stopMonitoring();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = NetworkService.getInstance();
      const instance2 = NetworkService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Network Status Detection', () => {
    test('should detect online status from navigator', () => {
      mockNavigator.onLine = true;
      const status = networkService.getNetworkStatus();
      expect(status.isOnline).toBe(true);
    });

    test('should detect offline status from navigator', () => {
      mockNavigator.onLine = false;
      const status = networkService.getNetworkStatus();
      expect(status.isOnline).toBe(false);
    });

    test('should test backend connectivity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const status = await networkService.checkNetworkStatus();
      expect(status.isBackendAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    test('should handle backend connectivity failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const status = await networkService.checkNetworkStatus();
      expect(status.isBackendAvailable).toBe(false);
    });

    test('should handle backend timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true }), 10000);
        })
      );

      const statusPromise = networkService.checkNetworkStatus();
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(6000);
      
      const status = await statusPromise;
      expect(status.isBackendAvailable).toBe(false);
    });
  });

  describe('Network Status Subscription', () => {
    test('should notify subscribers of status changes', () => {
      const listener = jest.fn();
      const unsubscribe = networkService.subscribe(listener);

      // Should call immediately with current status
      expect(listener).toHaveBeenCalledTimes(1);

      // Simulate status change
      mockNavigator.onLine = false;
      networkService['handleOfflineEvent']();

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOnline: false,
          isBackendAvailable: false
        })
      );

      unsubscribe();
    });

    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      networkService.subscribe(errorListener);
      networkService.subscribe(goodListener);

      // Should not throw and should still call good listener
      expect(() => {
        networkService['handleOfflineEvent']();
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('Offline Capabilities', () => {
    test('should report offline capabilities', () => {
      const capabilities = networkService.getOfflineCapabilities();
      
      expect(capabilities).toEqual({
        canPlayLocally: true,
        canSaveGameState: true, // localStorage is available in test
        canLoadGameState: true,
        hasLocalAI: true,
        pendingOperations: []
      });
    });

    test('should handle missing localStorage', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      const capabilities = networkService.getOfflineCapabilities();
      
      expect(capabilities.canSaveGameState).toBe(false);
      expect(capabilities.canLoadGameState).toBe(false);

      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });
  });

  describe('Pending Operations', () => {
    test('should add pending operations', () => {
      const operationId = networkService.addPendingOperation({
        type: 'move',
        data: { from: 'e2', to: 'e4' },
        maxRetries: 3
      });

      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');

      const capabilities = networkService.getOfflineCapabilities();
      expect(capabilities.pendingOperations).toHaveLength(1);
      expect(capabilities.pendingOperations[0].type).toBe('move');
    });

    test('should remove pending operations', () => {
      const operationId = networkService.addPendingOperation({
        type: 'move',
        data: { from: 'e2', to: 'e4' },
        maxRetries: 3
      });

      const removed = networkService.removePendingOperation(operationId);
      expect(removed).toBe(true);

      const capabilities = networkService.getOfflineCapabilities();
      expect(capabilities.pendingOperations).toHaveLength(0);
    });

    test('should return false when removing non-existent operation', () => {
      const removed = networkService.removePendingOperation('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('Error Parsing', () => {
    test('should parse timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';

      const parsedError = networkService.parseNetworkError(timeoutError);
      
      expect(parsedError.type).toBe('timeout');
      expect(parsedError.retryable).toBe(true);
      expect(parsedError.retryAfter).toBe(3);
    });

    test('should parse connection errors', () => {
      const connectionError = new TypeError('Failed to fetch');

      const parsedError = networkService.parseNetworkError(connectionError);
      
      expect(parsedError.type).toBe('connection');
      expect(parsedError.retryable).toBe(true);
      expect(parsedError.retryAfter).toBe(5);
    });

    test('should parse server errors', () => {
      const serverError = { status: 500, message: 'Internal Server Error' };

      const parsedError = networkService.parseNetworkError(serverError);
      
      expect(parsedError.type).toBe('server');
      expect(parsedError.retryable).toBe(true);
      expect(parsedError.retryAfter).toBe(10);
    });

    test('should parse API errors', () => {
      const apiError = { status: 400, message: 'Bad Request' };

      const parsedError = networkService.parseNetworkError(apiError);
      
      expect(parsedError.type).toBe('api');
      expect(parsedError.retryable).toBe(false);
    });

    test('should parse rate limit errors as retryable', () => {
      const rateLimitError = { status: 429, message: 'Too Many Requests' };

      const parsedError = networkService.parseNetworkError(rateLimitError);
      
      expect(parsedError.type).toBe('api');
      expect(parsedError.retryable).toBe(true);
      expect(parsedError.retryAfter).toBe(60);
    });

    test('should handle unknown errors', () => {
      const unknownError = null;

      const parsedError = networkService.parseNetworkError(unknownError);
      
      expect(parsedError.type).toBe('unknown');
      expect(parsedError.retryable).toBe(true);
      expect(parsedError.retryAfter).toBe(5);
    });
  });

  describe('Retry Logic', () => {
    test('should calculate exponential backoff delay', () => {
      const baseDelay = 1000;
      
      expect(networkService.calculateRetryDelay(0, baseDelay)).toBe(1000);
      expect(networkService.calculateRetryDelay(1, baseDelay)).toBe(2000);
      expect(networkService.calculateRetryDelay(2, baseDelay)).toBe(4000);
      expect(networkService.calculateRetryDelay(3, baseDelay)).toBe(8000);
    });

    test('should cap retry delay at maximum', () => {
      const delay = networkService.calculateRetryDelay(10, 1000);
      expect(delay).toBe(30000); // Max 30 seconds
    });

    test('should determine if retry is appropriate', () => {
      const retryableError: NetworkError = {
        type: 'timeout',
        message: 'Timeout',
        retryable: true
      };

      const nonRetryableError: NetworkError = {
        type: 'api',
        message: 'Bad request',
        retryable: false
      };

      // Should retry retryable errors under max attempts
      expect(networkService.shouldRetry(retryableError, 1)).toBe(true);
      expect(networkService.shouldRetry(retryableError, 2)).toBe(true);

      // Should not retry after max attempts
      expect(networkService.shouldRetry(retryableError, 3)).toBe(false);

      // Should not retry non-retryable errors
      expect(networkService.shouldRetry(nonRetryableError, 1)).toBe(false);
    });

    test('should not retry when offline', () => {
      mockNavigator.onLine = false;
      networkService['updateNetworkStatus']({ isOnline: false });

      const retryableError: NetworkError = {
        type: 'timeout',
        message: 'Timeout',
        retryable: true
      };

      expect(networkService.shouldRetry(retryableError, 1)).toBe(false);
    });
  });

  describe('Network Statistics', () => {
    test('should provide network statistics', () => {
      const stats = networkService.getNetworkStats();
      
      expect(stats).toHaveProperty('isOnline');
      expect(stats).toHaveProperty('isBackendAvailable');
      expect(stats).toHaveProperty('connectionQuality');
      expect(stats).toHaveProperty('lastChecked');
      expect(stats).toHaveProperty('retryCount');
      expect(stats).toHaveProperty('pendingOperations');
      expect(stats).toHaveProperty('uptime');
    });

    test('should format last checked time', () => {
      const stats = networkService.getNetworkStats();
      expect(typeof stats.lastChecked).toBe('string');
    });
  });

  describe('Online Operations Check', () => {
    test('should allow online operations when both online and backend available', () => {
      networkService['updateNetworkStatus']({
        isOnline: true,
        isBackendAvailable: true
      });

      expect(networkService.canPerformOnlineOperations()).toBe(true);
    });

    test('should not allow online operations when offline', () => {
      networkService['updateNetworkStatus']({
        isOnline: false,
        isBackendAvailable: false
      });

      expect(networkService.canPerformOnlineOperations()).toBe(false);
    });

    test('should not allow online operations when backend unavailable', () => {
      networkService['updateNetworkStatus']({
        isOnline: true,
        isBackendAvailable: false
      });

      expect(networkService.canPerformOnlineOperations()).toBe(false);
    });
  });
});