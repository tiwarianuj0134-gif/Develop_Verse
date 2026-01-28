/**
 * Network Service for Chess Game
 * Handles network connectivity detection and offline support
 * Requirements: 7.3 - Network error handling and offline support
 */

export interface NetworkStatus {
  isOnline: boolean;
  isBackendAvailable: boolean;
  lastChecked: number;
  connectionQuality: 'good' | 'poor' | 'offline';
  retryCount: number;
  nextRetryAt?: number;
}

export interface NetworkError {
  type: 'connection' | 'timeout' | 'server' | 'api' | 'unknown';
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
  originalError?: any;
}

export interface OfflineCapabilities {
  canPlayLocally: boolean;
  canSaveGameState: boolean;
  canLoadGameState: boolean;
  hasLocalAI: boolean;
  pendingOperations: PendingOperation[];
}

export interface PendingOperation {
  id: string;
  type: 'move' | 'create_game' | 'reset_game' | 'ai_move';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class NetworkService {
  private static instance: NetworkService;
  private networkStatus: NetworkStatus;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private pendingOperations: Map<string, PendingOperation> = new Map();
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private readonly BACKEND_TIMEOUT = 5000; // 5 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_BACKOFF_BASE = 2000; // 2 seconds

  private constructor() {
    this.networkStatus = {
      isOnline: navigator.onLine,
      isBackendAvailable: false,
      lastChecked: Date.now(),
      connectionQuality: 'offline',
      retryCount: 0
    };

    this.initializeNetworkMonitoring();
    this.startPeriodicChecks();
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * Initialize network event listeners
   */
  private initializeNetworkMonitoring(): void {
    // Listen for browser online/offline events
    window.addEventListener('online', this.handleOnlineEvent.bind(this));
    window.addEventListener('offline', this.handleOfflineEvent.bind(this));

    // Listen for visibility changes to check connection when tab becomes active
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Initial network check
    this.checkNetworkStatus();
  }

  /**
   * Start periodic network status checks
   */
  private startPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkNetworkStatus();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop periodic network checks
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    window.removeEventListener('online', this.handleOnlineEvent.bind(this));
    window.removeEventListener('offline', this.handleOfflineEvent.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Handle browser online event
   */
  private handleOnlineEvent(): void {
    console.log('Network: Browser reports online');
    this.checkNetworkStatus();
  }

  /**
   * Handle browser offline event
   */
  private handleOfflineEvent(): void {
    console.log('Network: Browser reports offline');
    this.updateNetworkStatus({
      isOnline: false,
      isBackendAvailable: false,
      connectionQuality: 'offline',
      lastChecked: Date.now()
    });
  }

  /**
   * Handle visibility change (tab focus)
   */
  private handleVisibilityChange(): void {
    if (!document.hidden) {
      // Tab became visible, check network status
      this.checkNetworkStatus();
    }
  }

  /**
   * Check current network status
   */
  public async checkNetworkStatus(): Promise<NetworkStatus> {
    const startTime = Date.now();
    
    // First check if browser thinks we're online
    const browserOnline = navigator.onLine;
    
    if (!browserOnline) {
      this.updateNetworkStatus({
        isOnline: false,
        isBackendAvailable: false,
        connectionQuality: 'offline',
        lastChecked: Date.now()
      });
      return this.networkStatus;
    }

    // Test backend connectivity
    try {
      const backendAvailable = await this.testBackendConnectivity();
      const responseTime = Date.now() - startTime;
      
      let connectionQuality: 'good' | 'poor' | 'offline' = 'good';
      if (responseTime > 3000) {
        connectionQuality = 'poor';
      } else if (responseTime > 1000) {
        connectionQuality = 'poor';
      }

      this.updateNetworkStatus({
        isOnline: true,
        isBackendAvailable: backendAvailable,
        connectionQuality: backendAvailable ? connectionQuality : 'poor',
        lastChecked: Date.now(),
        retryCount: 0 // Reset retry count on successful check
      });

      // Process pending operations if we're back online
      if (backendAvailable && this.pendingOperations.size > 0) {
        this.processPendingOperations();
      }

    } catch (error) {
      console.warn('Network check failed:', error);
      
      this.updateNetworkStatus({
        isOnline: browserOnline,
        isBackendAvailable: false,
        connectionQuality: 'offline',
        lastChecked: Date.now(),
        retryCount: this.networkStatus.retryCount + 1
      });
    }

    return this.networkStatus;
  }

  /**
   * Test backend connectivity with timeout
   */
  private async testBackendConnectivity(): Promise<boolean> {
    try {
      // Create a simple fetch request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.BACKEND_TIMEOUT);

      // Try to reach a simple endpoint (health check or similar)
      // For now, we'll test with a simple request that should work
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response?.ok || false;

    } catch (error: any) {
      // If the health endpoint doesn't exist, try a different approach
      if (error.name === 'AbortError') {
        console.warn('Backend connectivity test timed out');
        return false;
      }

      // Try a more basic connectivity test
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), this.BACKEND_TIMEOUT);

        // Test with a simple request to the current origin
        const response = await fetch(window.location.origin, {
          method: 'HEAD',
          signal: controller2.signal,
          cache: 'no-cache'
        });

        clearTimeout(timeoutId2);
        return response?.ok || false;

      } catch (fallbackError) {
        console.warn('Backend connectivity test failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Update network status and notify listeners
   */
  private updateNetworkStatus(updates: Partial<NetworkStatus>): void {
    const previousStatus = { ...this.networkStatus };
    this.networkStatus = { ...this.networkStatus, ...updates };

    // Log significant status changes
    if (previousStatus.isOnline !== this.networkStatus.isOnline) {
      console.log(`Network status changed: ${this.networkStatus.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    }

    if (previousStatus.isBackendAvailable !== this.networkStatus.isBackendAvailable) {
      console.log(`Backend availability changed: ${this.networkStatus.isBackendAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`);
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.networkStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Subscribe to network status changes
   */
  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current status
    listener(this.networkStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if we can perform online operations
   */
  public canPerformOnlineOperations(): boolean {
    return this.networkStatus.isOnline && this.networkStatus.isBackendAvailable;
  }

  /**
   * Get offline capabilities
   */
  public getOfflineCapabilities(): OfflineCapabilities {
    return {
      canPlayLocally: true, // Chess can always be played locally
      canSaveGameState: typeof Storage !== 'undefined',
      canLoadGameState: typeof Storage !== 'undefined',
      hasLocalAI: true, // We have fallback AI
      pendingOperations: Array.from(this.pendingOperations.values())
    };
  }

  /**
   * Add operation to pending queue for when network is restored
   */
  public addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): string {
    const id = `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingOp: PendingOperation = {
      id,
      timestamp: Date.now(),
      retryCount: 0,
      ...operation
    };

    this.pendingOperations.set(id, pendingOp);
    
    console.log(`Added pending operation: ${operation.type}`, pendingOp);
    
    return id;
  }

  /**
   * Remove pending operation
   */
  public removePendingOperation(id: string): boolean {
    return this.pendingOperations.delete(id);
  }

  /**
   * Process all pending operations when network is restored
   */
  private async processPendingOperations(): Promise<void> {
    if (this.pendingOperations.size === 0) {
      return;
    }

    console.log(`Processing ${this.pendingOperations.size} pending operations`);

    const operations = Array.from(this.pendingOperations.values())
      .sort((a, b) => a.timestamp - b.timestamp); // Process in chronological order

    for (const operation of operations) {
      try {
        await this.retryPendingOperation(operation);
      } catch (error) {
        console.error(`Failed to process pending operation ${operation.id}:`, error);
        
        // If we've exceeded max retries, remove the operation
        if (operation.retryCount >= operation.maxRetries) {
          console.warn(`Removing failed operation ${operation.id} after ${operation.retryCount} retries`);
          this.pendingOperations.delete(operation.id);
        } else {
          // Increment retry count
          operation.retryCount++;
          this.pendingOperations.set(operation.id, operation);
        }
      }
    }
  }

  /**
   * Retry a specific pending operation
   */
  private async retryPendingOperation(operation: PendingOperation): Promise<void> {
    // This would be implemented by the chess game to handle specific operation types
    // For now, we'll emit an event that the chess game can listen to
    const event = new CustomEvent('retryPendingOperation', {
      detail: operation
    });
    
    window.dispatchEvent(event);
    
    // Remove the operation from pending queue (the handler should re-add if it fails)
    this.pendingOperations.delete(operation.id);
  }

  /**
   * Parse network errors and provide user-friendly messages
   */
  public parseNetworkError(error: any): NetworkError {
    if (!error) {
      return {
        type: 'unknown',
        message: 'An unknown network error occurred',
        retryable: true,
        retryAfter: 5
      };
    }

    const errorMessage = error.message || error.toString() || 'Unknown error';
    
    // Connection errors
    if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please check your internet connection.',
        retryable: true,
        retryAfter: 3,
        originalError: error
      };
    }

    // Network connectivity errors
    if (error.name === 'TypeError' && errorMessage.includes('fetch')) {
      return {
        type: 'connection',
        message: 'Unable to connect to the server. Please check your internet connection.',
        retryable: true,
        retryAfter: 5,
        originalError: error
      };
    }

    // Server errors
    if (error.status >= 500) {
      return {
        type: 'server',
        message: 'Server is temporarily unavailable. Please try again later.',
        retryable: true,
        retryAfter: 10,
        originalError: error
      };
    }

    // API errors
    if (error.status >= 400 && error.status < 500) {
      return {
        type: 'api',
        message: 'Request failed. Please try again.',
        retryable: error.status === 429, // Only retry rate limit errors
        retryAfter: error.status === 429 ? 60 : undefined,
        originalError: error
      };
    }

    // Default case
    return {
      type: 'unknown',
      message: 'A network error occurred. Please try again.',
      retryable: true,
      retryAfter: 5,
      originalError: error
    };
  }

  /**
   * Calculate next retry delay with exponential backoff
   */
  public calculateRetryDelay(retryCount: number, baseDelay: number = this.RETRY_BACKOFF_BASE): number {
    return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }

  /**
   * Check if we should retry an operation
   */
  public shouldRetry(error: NetworkError, retryCount: number): boolean {
    if (!error.retryable || retryCount >= this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    // Don't retry if we're offline
    if (!this.networkStatus.isOnline) {
      return false;
    }

    return true;
  }

  /**
   * Force a network status check
   */
  public async forceNetworkCheck(): Promise<NetworkStatus> {
    return this.checkNetworkStatus();
  }

  /**
   * Get network statistics
   */
  public getNetworkStats(): {
    isOnline: boolean;
    isBackendAvailable: boolean;
    connectionQuality: string;
    lastChecked: string;
    retryCount: number;
    pendingOperations: number;
    uptime: number;
  } {
    return {
      isOnline: this.networkStatus.isOnline,
      isBackendAvailable: this.networkStatus.isBackendAvailable,
      connectionQuality: this.networkStatus.connectionQuality,
      lastChecked: new Date(this.networkStatus.lastChecked).toLocaleTimeString(),
      retryCount: this.networkStatus.retryCount,
      pendingOperations: this.pendingOperations.size,
      uptime: Date.now() - this.networkStatus.lastChecked
    };
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance();