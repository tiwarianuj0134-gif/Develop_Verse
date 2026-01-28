/**
 * Optimized Chess Engine with Performance Enhancements
 * Task 10.3: Performance optimization and final integration testing
 * Requirements: 8.1, 8.2, 8.4, 8.5, 8.6
 */

import { Chess } from 'chess.js';
import { Move, GameState, MoveValidation, ChessEngine } from './ChessEngine';
import { PerformanceMonitor, MoveValidationCache, debounce } from './PerformanceOptimizations';

export class OptimizedChessEngine extends ChessEngine {
  private moveCache: Map<string, string[]> = new Map();
  private gameStateCache: Map<string, GameState> = new Map();
  private validationCache: Map<string, boolean> = new Map();
  private readonly CACHE_SIZE_LIMIT = 100;
  private readonly CACHE_TTL = 10000; // 10 seconds
  private lastCacheCleanup = Date.now();

  // Debounced methods for performance
  private debouncedCacheCleanup = debounce(() => this.cleanupCaches(), 5000);

  constructor(fen?: string) {
    super(fen);
  }

  /**
   * Optimized move validation with caching
   */
  makeMove(move: { from: string; to: string; promotion?: string }): MoveValidation {
    const endMeasurement = PerformanceMonitor.startMeasurement('move_validation');
    
    try {
      // Check validation cache first
      const cacheKey = `${this.getFen()}:${move.from}:${move.to}:${move.promotion || ''}`;
      const cachedValidation = this.getValidationFromCache(cacheKey);
      
      if (cachedValidation !== null) {
        endMeasurement();
        return cachedValidation;
      }

      // Perform actual validation
      const result = super.makeMove(move);
      
      // Cache the result
      this.cacheValidation(cacheKey, result);
      
      // Trigger cache cleanup if needed
      this.debouncedCacheCleanup();
      
      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Optimized valid moves calculation with caching
   */
  getValidMoves(square?: string): string[] {
    const endMeasurement = PerformanceMonitor.startMeasurement('legal_moves_calculation');
    
    try {
      const fen = this.getFen();
      const cacheKey = `${fen}:${square || 'all'}`;
      
      // Check cache first
      const cachedMoves = MoveValidationCache.getCachedMoves(fen, square);
      if (cachedMoves) {
        endMeasurement();
        return cachedMoves;
      }
      
      // Calculate moves
      const moves = super.getValidMoves(square);
      
      // Cache the result
      MoveValidationCache.cacheMoves(fen, moves, square);
      
      endMeasurement();
      return moves;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Optimized game state retrieval with caching
   */
  getGameState(): GameState {
    const endMeasurement = PerformanceMonitor.startMeasurement('game_state_load');
    
    try {
      const fen = this.getFen();
      const cached = this.gameStateCache.get(fen);
      
      if (cached && this.isGameStateCacheValid(fen)) {
        endMeasurement();
        return cached;
      }
      
      const gameState = super.getGameState();
      
      // Cache the game state
      this.cacheGameState(fen, gameState);
      
      endMeasurement();
      return gameState;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Optimized move validation check
   */
  isValidMove(move: { from: string; to: string; promotion?: string }): boolean {
    const endMeasurement = PerformanceMonitor.startMeasurement('move_validation');
    
    try {
      const cacheKey = `valid:${this.getFen()}:${move.from}:${move.to}:${move.promotion || ''}`;
      const cached = this.validationCache.get(cacheKey);
      
      if (cached !== undefined) {
        endMeasurement();
        return cached;
      }
      
      const isValid = super.isValidMove(move);
      
      // Cache the result
      this.validationCache.set(cacheKey, isValid);
      
      // Limit cache size
      if (this.validationCache.size > this.CACHE_SIZE_LIMIT) {
        const firstKey = this.validationCache.keys().next().value;
        this.validationCache.delete(firstKey);
      }
      
      endMeasurement();
      return isValid;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Batch move validation for multiple moves
   */
  validateMovesBatch(moves: { from: string; to: string; promotion?: string }[]): boolean[] {
    const endMeasurement = PerformanceMonitor.startMeasurement('batch_move_validation');
    
    try {
      const results: boolean[] = [];
      const fen = this.getFen();
      
      // Create a temporary chess instance for batch validation
      const tempChess = new Chess(fen);
      
      for (const move of moves) {
        try {
          const result = tempChess.move(move);
          results.push(result !== null);
          
          // Reset to original position for next move
          tempChess.load(fen);
        } catch {
          results.push(false);
        }
      }
      
      endMeasurement();
      return results;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Get all valid moves with performance optimization
   */
  getAllValidMoves(): Move[] {
    const endMeasurement = PerformanceMonitor.startMeasurement('all_valid_moves');
    
    try {
      const fen = this.getFen();
      const cacheKey = `all_moves:${fen}`;
      
      // Check if we have cached moves for this position
      const cached = this.moveCache.get(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        const moves = cached.map(san => {
          // Parse SAN to get move details
          const tempChess = new Chess(fen);
          const moveObj = tempChess.move(san);
          return {
            from: moveObj.from,
            to: moveObj.to,
            promotion: moveObj.promotion as Move['promotion'],
            san: moveObj.san
          };
        });
        
        endMeasurement();
        return moves;
      }
      
      const moves = super.getAllValidMoves();
      
      // Cache the SAN notation for faster retrieval
      const sanMoves = moves.map(move => move.san);
      this.moveCache.set(cacheKey, sanMoves);
      
      // Limit cache size
      if (this.moveCache.size > this.CACHE_SIZE_LIMIT) {
        const firstKey = this.moveCache.keys().next().value;
        this.moveCache.delete(firstKey);
      }
      
      endMeasurement();
      return moves;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Optimized position loading with validation
   */
  loadPosition(fen: string): boolean {
    const endMeasurement = PerformanceMonitor.startMeasurement('position_load');
    
    try {
      const success = super.loadPosition(fen);
      
      if (success) {
        // Clear caches when position changes
        this.clearPositionCaches();
      }
      
      endMeasurement();
      return success;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Optimized game reset
   */
  reset(): void {
    const endMeasurement = PerformanceMonitor.startMeasurement('game_reset');
    
    try {
      super.reset();
      this.clearAllCaches();
      endMeasurement();
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }

  /**
   * Get validation result from cache
   */
  private getValidationFromCache(cacheKey: string): MoveValidation | null {
    // For now, we don't cache full validation results due to complexity
    // This could be implemented for specific validation patterns
    return null;
  }

  /**
   * Cache validation result
   */
  private cacheValidation(cacheKey: string, result: MoveValidation): void {
    // Implementation would cache validation results
    // Skipped for now due to complexity of caching full validation objects
  }

  /**
   * Cache game state
   */
  private cacheGameState(fen: string, gameState: GameState): void {
    this.gameStateCache.set(fen, { ...gameState });
    
    // Limit cache size
    if (this.gameStateCache.size > this.CACHE_SIZE_LIMIT) {
      const firstKey = this.gameStateCache.keys().next().value;
      this.gameStateCache.delete(firstKey);
    }
  }

  /**
   * Check if game state cache is valid
   */
  private isGameStateCacheValid(fen: string): boolean {
    // Game state cache is valid as long as the FEN matches
    return this.gameStateCache.has(fen);
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(cacheKey: string): boolean {
    // For simplicity, we consider cache valid if it exists
    // In a more sophisticated implementation, we'd check timestamps
    return this.moveCache.has(cacheKey);
  }

  /**
   * Clear position-specific caches
   */
  private clearPositionCaches(): void {
    this.moveCache.clear();
    this.gameStateCache.clear();
    this.validationCache.clear();
    MoveValidationCache.clearCache();
  }

  /**
   * Clear all caches
   */
  private clearAllCaches(): void {
    this.clearPositionCaches();
  }

  /**
   * Cleanup old cache entries
   */
  private cleanupCaches(): void {
    const now = Date.now();
    
    // Only cleanup if enough time has passed
    if (now - this.lastCacheCleanup < this.CACHE_TTL) {
      return;
    }
    
    // Clear caches if they're getting too large
    if (this.moveCache.size > this.CACHE_SIZE_LIMIT * 0.8) {
      // Remove oldest entries (simple FIFO)
      const keysToRemove = Array.from(this.moveCache.keys()).slice(0, 10);
      keysToRemove.forEach(key => this.moveCache.delete(key));
    }
    
    if (this.gameStateCache.size > this.CACHE_SIZE_LIMIT * 0.8) {
      const keysToRemove = Array.from(this.gameStateCache.keys()).slice(0, 10);
      keysToRemove.forEach(key => this.gameStateCache.delete(key));
    }
    
    if (this.validationCache.size > this.CACHE_SIZE_LIMIT * 0.8) {
      const keysToRemove = Array.from(this.validationCache.keys()).slice(0, 10);
      keysToRemove.forEach(key => this.validationCache.delete(key));
    }
    
    this.lastCacheCleanup = now;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    moveCache: number;
    gameStateCache: number;
    validationCache: number;
    globalMoveCache: number;
  } {
    return {
      moveCache: this.moveCache.size,
      gameStateCache: this.gameStateCache.size,
      validationCache: this.validationCache.size,
      globalMoveCache: MoveValidationCache.getCacheStats().size
    };
  }

  /**
   * Preload common positions for better performance
   */
  preloadCommonPositions(): void {
    const commonPositions = [
      // Starting position
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      // After 1.e4
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      // After 1.d4
      'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
      // After 1.Nf3
      'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1'
    ];

    commonPositions.forEach(fen => {
      const tempEngine = new Chess(fen);
      const moves = tempEngine.moves();
      MoveValidationCache.cacheMoves(fen, moves);
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearAllCaches();
  }
}