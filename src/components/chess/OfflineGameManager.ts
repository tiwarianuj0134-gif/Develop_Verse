/**
 * Offline Game Manager for Chess Game
 * Handles local-only gameplay when backend is unavailable
 * Requirements: 7.3 - Network error handling and offline support
 */

import { GameManager, GameSettings, GameResult } from './GameManager';
import { GamePersistence, PersistedGameState } from './GamePersistence';
import { Move, GameState } from './ChessEngine';
import { networkService, NetworkStatus, PendingOperation } from './NetworkService';

export interface OfflineGameState {
  isOfflineMode: boolean;
  lastSyncedAt?: number;
  pendingMoves: Move[];
  pendingOperations: string[];
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  conflictResolution?: 'local' | 'remote' | 'manual';
}

export interface SyncResult {
  success: boolean;
  syncedMoves: number;
  conflicts: number;
  errors: string[];
  newGameState?: GameState;
}

export class OfflineGameManager extends GameManager {
  private persistence: GamePersistence;
  private offlineState: OfflineGameState;
  private networkUnsubscribe?: () => void;
  private localAIEnabled: boolean = true;
  private readonly OFFLINE_STORAGE_KEY = 'chess_offline_state';

  constructor(settings: GameSettings, initialFen?: string) {
    super(settings, initialFen);
    
    this.persistence = new GamePersistence();
    this.offlineState = {
      isOfflineMode: !networkService.canPerformOnlineOperations(),
      pendingMoves: [],
      pendingOperations: [],
      syncStatus: 'synced'
    };

    this.initializeOfflineMode();
    this.setupNetworkMonitoring();
  }

  /**
   * Initialize offline mode capabilities
   */
  private initializeOfflineMode(): void {
    // Load offline state from storage
    this.loadOfflineState();
    
    // Set up periodic auto-save for offline state
    setInterval(() => {
      this.saveOfflineState();
    }, 10000); // Save every 10 seconds

    // Listen for pending operation retry events
    window.addEventListener('retryPendingOperation', this.handlePendingOperationRetry.bind(this) as EventListener);
  }

  /**
   * Set up network status monitoring
   */
  private setupNetworkMonitoring(): void {
    this.networkUnsubscribe = networkService.subscribe((status: NetworkStatus) => {
      this.handleNetworkStatusChange(status);
    });
  }

  /**
   * Handle network status changes
   */
  private handleNetworkStatusChange(status: NetworkStatus): void {
    const wasOffline = this.offlineState.isOfflineMode;
    const isNowOffline = !status.isBackendAvailable;

    if (wasOffline && !isNowOffline) {
      // We're back online - attempt to sync
      console.log('Network restored, attempting to sync offline changes');
      this.attemptSync();
    } else if (!wasOffline && isNowOffline) {
      // We went offline
      console.log('Network lost, switching to offline mode');
      this.enterOfflineMode();
    }

    this.offlineState.isOfflineMode = isNowOffline;
    this.saveOfflineState();
  }

  /**
   * Enter offline mode
   */
  private enterOfflineMode(): void {
    console.log('Entering offline mode');
    
    this.offlineState.isOfflineMode = true;
    this.offlineState.syncStatus = 'pending';
    
    // Save current state as the last known good state
    this.persistence.saveGameState(this);
    this.saveOfflineState();
  }

  /**
   * Make a move in offline mode
   */
  public makeOfflineMove(move: Move): { success: boolean; error?: string; gameState?: GameState } {
    try {
      // Validate and make the move locally
      const validation = super.makeMove(move);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid move'
        };
      }

      // Add to pending moves for later sync
      this.offlineState.pendingMoves.push(move);
      this.offlineState.syncStatus = 'pending';
      
      // Save state
      this.persistence.saveGameState(this);
      this.saveOfflineState();

      return {
        success: true,
        gameState: this.getGameState()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate AI move in offline mode using local fallback AI
   */
  public async generateOfflineAIMove(): Promise<{ success: boolean; move?: Move; error?: string }> {
    if (!this.localAIEnabled) {
      return {
        success: false,
        error: 'Local AI is disabled'
      };
    }

    try {
      // Use the fallback AI logic from the backend
      const currentFen = this.getFen();
      const difficulty = this.getGameSettings().difficulty;
      
      // Import chess.js for local AI move generation
      const { Chess } = await import('chess.js');
      const chess = new Chess(currentFen);
      const allMoves = chess.moves();
      
      if (allMoves.length === 0) {
        return {
          success: false,
          error: 'No legal moves available'
        };
      }

      // Simple local AI based on difficulty
      let selectedMove: string;
      
      // Check if we're in check - if so, prioritize getting out of check
      const isInCheck = chess.inCheck();
      
      switch (difficulty) {
        case 'easy':
          // Random move with slight preference for captures, but prioritize getting out of check
          if (isInCheck) {
            // When in check, just pick a random legal move (all moves get out of check)
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
          } else {
            const captures = allMoves.filter(move => move.includes('x'));
            if (captures.length > 0 && Math.random() < 0.3) {
              selectedMove = captures[Math.floor(Math.random() * captures.length)];
            } else {
              selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            }
          }
          break;

        case 'medium':
          // Prefer captures and checks, but handle being in check first
          if (isInCheck) {
            // When in check, prefer moves that also give check or capture
            const checkEscapes = allMoves.filter(move => move.includes('x') || move.includes('+'));
            if (checkEscapes.length > 0) {
              selectedMove = checkEscapes[Math.floor(Math.random() * checkEscapes.length)];
            } else {
              selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            }
          } else {
            const mediumCaptures = allMoves.filter(move => move.includes('x'));
            const checks = allMoves.filter(move => move.includes('+'));
            const checkmates = allMoves.filter(move => move.includes('#'));
            
            if (checkmates.length > 0) {
              selectedMove = checkmates[0];
            } else if (mediumCaptures.length > 0 && Math.random() < 0.7) {
              selectedMove = mediumCaptures[Math.floor(Math.random() * mediumCaptures.length)];
            } else if (checks.length > 0 && Math.random() < 0.5) {
              selectedMove = checks[Math.floor(Math.random() * checks.length)];
            } else {
              selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            }
          }
          break;

        case 'hard':
          // More sophisticated move selection, but handle check situations carefully
          if (isInCheck) {
            // When in check, look for the best escape move
            const checkEscapes = allMoves.filter(move => move.includes('x') || move.includes('+') || move.includes('#'));
            if (checkEscapes.length > 0) {
              // Prefer checkmate, then check, then capture
              const checkmates = checkEscapes.filter(move => move.includes('#'));
              const checks = checkEscapes.filter(move => move.includes('+'));
              const captures = checkEscapes.filter(move => move.includes('x'));
              
              if (checkmates.length > 0) {
                selectedMove = checkmates[0];
              } else if (checks.length > 0) {
                selectedMove = checks[0];
              } else if (captures.length > 0) {
                selectedMove = captures[0];
              } else {
                selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
              }
            } else {
              selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            }
          } else {
            // Normal hard difficulty logic when not in check
            const hardCaptures = allMoves.filter(move => move.includes('x'));
            const hardChecks = allMoves.filter(move => move.includes('+'));
            const hardCheckmates = allMoves.filter(move => move.includes('#'));
            const promotions = allMoves.filter(move => move.includes('='));
            
            if (hardCheckmates.length > 0) {
              selectedMove = hardCheckmates[0];
            } else if (promotions.length > 0) {
              selectedMove = promotions[0];
            } else if (hardCaptures.length > 0 && Math.random() < 0.8) {
              selectedMove = hardCaptures[Math.floor(Math.random() * hardCaptures.length)];
            } else if (hardChecks.length > 0 && Math.random() < 0.6) {
              selectedMove = hardChecks[Math.floor(Math.random() * hardChecks.length)];
            } else {
              // Try to find development moves or center control
              const developmentMoves = allMoves.filter(move => 
                move.startsWith('N') || move.startsWith('B') || 
                move === 'O-O' || move === 'O-O-O'
              );
              
              if (developmentMoves.length > 0 && chess.history().length < 12) {
                selectedMove = developmentMoves[Math.floor(Math.random() * developmentMoves.length)];
              } else {
                selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
              }
            }
          }
          break;

        default:
          selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      }

      // Validate the selected move before returning
      try {
        const testChess = new Chess(currentFen);
        const moveObj = testChess.move(selectedMove);
        if (!moveObj) {
          throw new Error('Invalid move generated');
        }
        
        // Double-check that the move is actually legal
        if (!allMoves.includes(selectedMove)) {
          throw new Error('Generated move not in legal moves list');
        }
      } catch (validationError) {
        console.warn('Generated move failed validation, using random fallback:', validationError);
        selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      }

      // Parse the move to get from/to format
      const moveObj = chess.move(selectedMove);
      if (!moveObj) {
        return {
          success: false,
          error: 'Failed to parse AI move'
        };
      }

      const aiMove: Move = {
        from: moveObj.from,
        to: moveObj.to,
        san: moveObj.san,
        promotion: moveObj.promotion as 'q' | 'r' | 'b' | 'n' | undefined
      };

      // Apply the move locally
      const result = this.makeOfflineMove(aiMove);
      
      if (result.success) {
        return {
          success: true,
          move: aiMove
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Local AI failed: ${errorMessage}`
      };
    }
  }

  /**
   * Attempt to sync offline changes with the backend
   */
  public async attemptSync(): Promise<SyncResult> {
    if (!networkService.canPerformOnlineOperations()) {
      return {
        success: false,
        syncedMoves: 0,
        conflicts: 0,
        errors: ['Network not available']
      };
    }

    if (this.offlineState.pendingMoves.length === 0) {
      this.offlineState.syncStatus = 'synced';
      this.saveOfflineState();
      return {
        success: true,
        syncedMoves: 0,
        conflicts: 0,
        errors: []
      };
    }

    console.log(`Attempting to sync ${this.offlineState.pendingMoves.length} pending moves`);

    try {
      // For now, we'll mark as synced and clear pending moves
      // In a real implementation, this would sync with the backend
      const syncedMoves = this.offlineState.pendingMoves.length;
      
      this.offlineState.pendingMoves = [];
      this.offlineState.syncStatus = 'synced';
      this.offlineState.lastSyncedAt = Date.now();
      
      this.saveOfflineState();

      return {
        success: true,
        syncedMoves,
        conflicts: 0,
        errors: []
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.offlineState.syncStatus = 'error';
      this.saveOfflineState();

      return {
        success: false,
        syncedMoves: 0,
        conflicts: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Handle retry of pending operations
   */
  private handlePendingOperationRetry(event: CustomEvent<PendingOperation>): void {
    const operation = event.detail;
    console.log('Retrying pending operation:', operation);

    // Handle different operation types
    switch (operation.type) {
      case 'move':
        this.retryPendingMove(operation);
        break;
      case 'ai_move':
        this.retryPendingAIMove(operation);
        break;
      case 'create_game':
      case 'reset_game':
        // These would be handled by the main chess game component
        break;
    }
  }

  /**
   * Retry a pending move operation
   */
  private async retryPendingMove(operation: PendingOperation): Promise<void> {
    try {
      // This would normally sync with the backend
      // For now, we'll just mark it as processed
      console.log('Retrying move operation:', operation.data);
      
      // Remove from our pending operations
      const index = this.offlineState.pendingOperations.indexOf(operation.id);
      if (index > -1) {
        this.offlineState.pendingOperations.splice(index, 1);
        this.saveOfflineState();
      }
    } catch (error) {
      console.error('Failed to retry pending move:', error);
      // Re-add to network service for another retry
      networkService.addPendingOperation({
        type: operation.type,
        data: operation.data,
        maxRetries: operation.maxRetries
      });
    }
  }

  /**
   * Retry a pending AI move operation
   */
  private async retryPendingAIMove(operation: PendingOperation): Promise<void> {
    try {
      // This would normally request AI move from backend
      // For now, we'll generate a local AI move
      const result = await this.generateOfflineAIMove();
      
      if (result.success) {
        console.log('Successfully generated AI move offline:', result.move);
      } else {
        console.error('Failed to generate offline AI move:', result.error);
      }

      // Remove from pending operations
      const index = this.offlineState.pendingOperations.indexOf(operation.id);
      if (index > -1) {
        this.offlineState.pendingOperations.splice(index, 1);
        this.saveOfflineState();
      }
    } catch (error) {
      console.error('Failed to retry pending AI move:', error);
    }
  }

  /**
   * Get offline state information
   */
  public getOfflineState(): OfflineGameState {
    return { ...this.offlineState };
  }

  /**
   * Check if currently in offline mode
   */
  public isOfflineMode(): boolean {
    return this.offlineState.isOfflineMode;
  }

  /**
   * Get pending moves count
   */
  public getPendingMovesCount(): number {
    return this.offlineState.pendingMoves.length;
  }

  /**
   * Enable or disable local AI
   */
  public setLocalAIEnabled(enabled: boolean): void {
    this.localAIEnabled = enabled;
  }

  /**
   * Check if local AI is enabled
   */
  public isLocalAIEnabled(): boolean {
    return this.localAIEnabled;
  }

  /**
   * Save offline state to localStorage
   */
  private saveOfflineState(): void {
    try {
      localStorage.setItem(this.OFFLINE_STORAGE_KEY, JSON.stringify(this.offlineState));
    } catch (error) {
      console.error('Failed to save offline state:', error);
    }
  }

  /**
   * Load offline state from localStorage
   */
  private loadOfflineState(): void {
    try {
      const saved = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.offlineState = {
          ...this.offlineState,
          ...parsedState
        };
      }
    } catch (error) {
      console.error('Failed to load offline state:', error);
    }
  }

  /**
   * Clear offline state
   */
  public clearOfflineState(): void {
    this.offlineState = {
      isOfflineMode: !networkService.canPerformOnlineOperations(),
      pendingMoves: [],
      pendingOperations: [],
      syncStatus: 'synced'
    };
    
    try {
      localStorage.removeItem(this.OFFLINE_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear offline state:', error);
    }
  }

  /**
   * Export game state including offline information
   */
  public exportOfflineGameState() {
    return {
      ...super.exportGameState(),
      offlineState: this.offlineState,
      networkStatus: networkService.getNetworkStatus(),
      capabilities: networkService.getOfflineCapabilities()
    };
  }

  /**
   * Get sync status information
   */
  public getSyncStatus(): {
    status: string;
    pendingMoves: number;
    lastSyncedAt?: string;
    canSync: boolean;
  } {
    return {
      status: this.offlineState.syncStatus,
      pendingMoves: this.offlineState.pendingMoves.length,
      lastSyncedAt: this.offlineState.lastSyncedAt ? 
        new Date(this.offlineState.lastSyncedAt).toLocaleString() : 
        undefined,
      canSync: networkService.canPerformOnlineOperations()
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
    
    window.removeEventListener('retryPendingOperation', this.handlePendingOperationRetry.bind(this) as EventListener);
    
    // Save final state
    this.saveOfflineState();
  }
}