import { GameManager, GameSettings } from './GameManager';

export interface PersistedGameState {
  fen: string;
  gameSettings: GameSettings;
  gameStartTime: number;
  moveTimestamps: number[];
  gameId: string;
  lastSaved: number;
}

export class GamePersistence {
  private static readonly STORAGE_KEY = 'chess_game_state';
  private static readonly AUTO_SAVE_INTERVAL = 5000; // 5 seconds
  
  private autoSaveTimer: NodeJS.Timeout | null = null;

  /**
   * Save game state to localStorage
   */
  saveGameState(gameManager: GameManager): boolean {
    try {
      const gameState = gameManager.exportGameState();
      const persistedState: PersistedGameState = {
        ...gameState,
        lastSaved: Date.now()
      };
      
      localStorage.setItem(
        GamePersistence.STORAGE_KEY, 
        JSON.stringify(persistedState)
      );
      
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  loadGameState(): PersistedGameState | null {
    try {
      const savedState = localStorage.getItem(GamePersistence.STORAGE_KEY);
      if (!savedState) {
        return null;
      }
      
      const parsedState = JSON.parse(savedState) as PersistedGameState;
      
      // Validate the saved state structure
      if (!this.isValidPersistedState(parsedState)) {
        console.warn('Invalid saved game state, clearing storage');
        this.clearSavedState();
        return null;
      }
      
      return parsedState;
    } catch (error) {
      console.error('Failed to load game state:', error);
      this.clearSavedState();
      return null;
    }
  }

  /**
   * Clear saved game state
   */
  clearSavedState(): void {
    try {
      localStorage.removeItem(GamePersistence.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear saved state:', error);
    }
  }

  /**
   * Check if there's a saved game state
   */
  hasSavedState(): boolean {
    return localStorage.getItem(GamePersistence.STORAGE_KEY) !== null;
  }

  /**
   * Get the age of the saved state in milliseconds
   */
  getSavedStateAge(): number | null {
    const savedState = this.loadGameState();
    if (!savedState) {
      return null;
    }
    
    return Date.now() - savedState.lastSaved;
  }

  /**
   * Start auto-save functionality
   */
  startAutoSave(gameManager: GameManager): void {
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(() => {
      // Only auto-save if the game is in progress
      if (!gameManager.isGameOver()) {
        this.saveGameState(gameManager);
      }
    }, GamePersistence.AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Restore game manager from saved state
   */
  restoreGameManager(savedState: PersistedGameState): GameManager | null {
    try {
      const gameManager = new GameManager(savedState.gameSettings);
      const success = gameManager.importGameState(savedState);
      
      if (!success) {
        console.error('Failed to import game state');
        return null;
      }
      
      return gameManager;
    } catch (error) {
      console.error('Failed to restore game manager:', error);
      return null;
    }
  }

  /**
   * Validate the structure of a persisted state
   */
  private isValidPersistedState(state: any): state is PersistedGameState {
    return (
      state &&
      typeof state.fen === 'string' &&
      state.gameSettings &&
      typeof state.gameSettings.difficulty === 'string' &&
      typeof state.gameSettings.playerColor === 'string' &&
      typeof state.gameStartTime === 'number' &&
      Array.isArray(state.moveTimestamps) &&
      typeof state.gameId === 'string' &&
      typeof state.lastSaved === 'number'
    );
  }

  /**
   * Export game state as a shareable string
   */
  exportGameAsString(gameManager: GameManager): string {
    const gameState = gameManager.exportGameState();
    const exportData = {
      ...gameState,
      exportedAt: Date.now(),
      version: '1.0'
    };
    
    return btoa(JSON.stringify(exportData));
  }

  /**
   * Import game state from a shareable string
   */
  importGameFromString(importString: string): GameManager | null {
    try {
      const decodedData = JSON.parse(atob(importString));
      
      if (!this.isValidPersistedState(decodedData)) {
        throw new Error('Invalid import data structure');
      }
      
      return this.restoreGameManager(decodedData);
    } catch (error) {
      console.error('Failed to import game from string:', error);
      return null;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    hasStorage: boolean;
    storageSize: number;
    maxStorage: number;
  } {
    try {
      const hasStorage = typeof Storage !== 'undefined';
      let storageSize = 0;
      let maxStorage = 0;
      
      if (hasStorage) {
        const savedState = localStorage.getItem(GamePersistence.STORAGE_KEY);
        storageSize = savedState ? savedState.length : 0;
        
        // Estimate max storage (usually 5-10MB for localStorage)
        maxStorage = 5 * 1024 * 1024; // 5MB estimate
      }
      
      return {
        hasStorage,
        storageSize,
        maxStorage
      };
    } catch (error) {
      return {
        hasStorage: false,
        storageSize: 0,
        maxStorage: 0
      };
    }
  }
}