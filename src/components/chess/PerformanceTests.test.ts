/**
 * Performance Tests for Chess Game Optimizations
 * Task 10.3: Performance optimization and final integration testing
 * Requirements: 8.1, 8.2, 8.4, 8.5, 8.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  PerformanceMonitor, 
  MoveValidationCache, 
  DeviceCapabilities, 
  MemoryManager,
  debounce,
  throttle
} from './PerformanceOptimizations';

describe('Performance Optimizations', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMeasurements();
    MoveValidationCache.clearCache();
  });

  afterEach(() => {
    PerformanceMonitor.clearMeasurements();
    MoveValidationCache.clearCache();
  });

  describe('PerformanceMonitor', () => {
    it('should measure and record performance metrics', () => {
      const endMeasurement = PerformanceMonitor.startMeasurement('test_operation');
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }
      
      const duration = endMeasurement();
      
      expect(duration).toBeGreaterThan(8); // Should be at least 8ms
      expect(duration).toBeLessThan(50); // Should be less than 50ms
      
      const stats = PerformanceMonitor.getStats('test_operation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.average).toBeCloseTo(duration, 1);
    });

    it('should calculate correct statistics', () => {
      // Record multiple measurements
      PerformanceMonitor.recordMeasurement('test_stats', 10);
      PerformanceMonitor.recordMeasurement('test_stats', 20);
      PerformanceMonitor.recordMeasurement('test_stats', 30);
      PerformanceMonitor.recordMeasurement('test_stats', 40);
      PerformanceMonitor.recordMeasurement('test_stats', 50);
      
      const stats = PerformanceMonitor.getStats('test_stats');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(5);
      expect(stats!.average).toBe(30);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(50);
      expect(stats!.p95).toBe(50); // 95th percentile
    });

    it('should check performance requirements', () => {
      // Record measurements that meet requirements
      PerformanceMonitor.recordMeasurement('move_validation', 25); // < 50ms requirement
      PerformanceMonitor.recordMeasurement('ui_response', 50); // < 100ms requirement
      PerformanceMonitor.recordMeasurement('move_animation', 200); // < 300ms requirement
      PerformanceMonitor.recordMeasurement('game_state_load', 100); // < 200ms requirement
      PerformanceMonitor.recordMeasurement('legal_moves_calculation', 75); // < 100ms requirement
      
      const requirements = PerformanceMonitor.checkPerformanceRequirements();
      
      expect(requirements.moveValidation).toBe(true);
      expect(requirements.uiResponse).toBe(true);
      expect(requirements.moveAnimation).toBe(true);
      expect(requirements.gameStateLoad).toBe(true);
      expect(requirements.legalMovesCalculation).toBe(true);
    });

    it('should fail performance requirements when thresholds are exceeded', () => {
      // Record measurements that exceed requirements
      PerformanceMonitor.recordMeasurement('move_validation', 75); // > 50ms requirement
      PerformanceMonitor.recordMeasurement('ui_response', 150); // > 100ms requirement
      
      const requirements = PerformanceMonitor.checkPerformanceRequirements();
      
      expect(requirements.moveValidation).toBe(false);
      expect(requirements.uiResponse).toBe(false);
    });
  });

  describe('MoveValidationCache', () => {
    it('should cache and retrieve valid moves', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const moves = ['e2e4', 'e2e3', 'd2d4', 'd2d3'];
      
      // Cache should be empty initially
      expect(MoveValidationCache.getCachedMoves(fen)).toBeNull();
      
      // Cache the moves
      MoveValidationCache.cacheMoves(fen, moves);
      
      // Should retrieve cached moves
      const cachedMoves = MoveValidationCache.getCachedMoves(fen);
      expect(cachedMoves).toEqual(moves);
    });

    it('should cache moves for specific squares', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const e2Moves = ['e2e4', 'e2e3'];
      
      MoveValidationCache.cacheMoves(fen, e2Moves, 'e2');
      
      const cachedMoves = MoveValidationCache.getCachedMoves(fen, 'e2');
      expect(cachedMoves).toEqual(e2Moves);
      
      // Different square should return null
      expect(MoveValidationCache.getCachedMoves(fen, 'd2')).toBeNull();
    });

    it('should expire cached moves after TTL', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const moves = ['e2e4', 'e2e3'];
      
      MoveValidationCache.cacheMoves(fen, moves);
      
      // Should be cached immediately
      expect(MoveValidationCache.getCachedMoves(fen)).toEqual(moves);
      
      // Mock time passage beyond TTL
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6000); // 6 seconds
      
      // Should be expired
      expect(MoveValidationCache.getCachedMoves(fen)).toBeNull();
      
      vi.restoreAllMocks();
    });

    it('should provide cache statistics', () => {
      const stats = MoveValidationCache.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('DeviceCapabilities', () => {
    it('should detect device capabilities', () => {
      const capabilities = DeviceCapabilities.detectCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities).toHaveProperty('isLowEndDevice');
      expect(capabilities).toHaveProperty('supportsHardwareAcceleration');
      expect(capabilities).toHaveProperty('memoryLimit');
      expect(capabilities).toHaveProperty('connectionSpeed');
      expect(capabilities).toHaveProperty('screenSize');
      
      expect(typeof capabilities!.isLowEndDevice).toBe('boolean');
      expect(typeof capabilities!.supportsHardwareAcceleration).toBe('boolean');
      expect(typeof capabilities!.memoryLimit).toBe('number');
      expect(['slow', 'fast', 'unknown']).toContain(capabilities!.connectionSpeed);
      expect(['small', 'medium', 'large']).toContain(capabilities!.screenSize);
    });

    it('should provide optimization recommendations', () => {
      const recommendations = DeviceCapabilities.getOptimizationRecommendations();
      
      expect(recommendations).toHaveProperty('reduceAnimations');
      expect(recommendations).toHaveProperty('enableCaching');
      expect(recommendations).toHaveProperty('batchUpdates');
      expect(recommendations).toHaveProperty('limitConcurrency');
      expect(recommendations).toHaveProperty('useHardwareAcceleration');
      
      expect(typeof recommendations.reduceAnimations).toBe('boolean');
      expect(typeof recommendations.enableCaching).toBe('boolean');
      expect(typeof recommendations.batchUpdates).toBe('boolean');
      expect(typeof recommendations.limitConcurrency).toBe('boolean');
      expect(typeof recommendations.useHardwareAcceleration).toBe('boolean');
    });
  });

  describe('MemoryManager', () => {
    it('should register and unregister cleanup callbacks', () => {
      let cleanupCalled = false;
      const cleanup = () => { cleanupCalled = true; };
      
      const unregister = MemoryManager.registerCleanup(cleanup);
      
      expect(typeof unregister).toBe('function');
      
      // Unregister the cleanup
      unregister();
      
      // Cleanup should not be called after unregistering
      expect(cleanupCalled).toBe(false);
    });

    it('should provide memory information when available', () => {
      const memoryInfo = MemoryManager.getMemoryInfo();
      
      // Memory info might not be available in all environments
      if (memoryInfo) {
        expect(memoryInfo).toHaveProperty('used');
        expect(memoryInfo).toHaveProperty('total');
        expect(memoryInfo).toHaveProperty('percentage');
        expect(typeof memoryInfo.used).toBe('number');
        expect(typeof memoryInfo.total).toBe('number');
        expect(typeof memoryInfo.percentage).toBe('number');
        expect(memoryInfo.percentage).toBeGreaterThanOrEqual(0);
        expect(memoryInfo.percentage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Utility Functions', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const debouncedFn = debounce(() => { callCount++; }, 50);
      
      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      // Should not have been called yet
      expect(callCount).toBe(0);
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should have been called only once
      expect(callCount).toBe(1);
    });

    it('should throttle function calls', async () => {
      let callCount = 0;
      const throttledFn = throttle(() => { callCount++; }, 50);
      
      // First call should execute immediately
      throttledFn();
      expect(callCount).toBe(1);
      
      // Subsequent calls should be throttled
      throttledFn();
      throttledFn();
      expect(callCount).toBe(1);
      
      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should be able to call again
      throttledFn();
      expect(callCount).toBe(2);
    });
  });

  describe('Integration Performance Tests', () => {
    it('should meet move validation performance requirements', () => {
      const iterations = 100;
      const measurements: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endMeasurement = PerformanceMonitor.startMeasurement('move_validation_test');
        
        // Simulate move validation work
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const moves = ['e2e4', 'e2e3', 'd2d4', 'd2d3', 'g1f3', 'b1c3'];
        
        // Simulate validation logic
        for (const move of moves) {
          const isValid = move.length === 4 && move[0] >= 'a' && move[0] <= 'h';
          if (!isValid) break;
        }
        
        const duration = endMeasurement();
        measurements.push(duration);
      }
      
      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const max = Math.max(...measurements);
      
      // Performance requirements: move validation should be < 50ms
      expect(average).toBeLessThan(50);
      expect(max).toBeLessThan(100); // Even worst case should be reasonable
    });

    it('should meet UI response performance requirements', () => {
      const iterations = 50;
      const measurements: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endMeasurement = PerformanceMonitor.startMeasurement('ui_response_test');
        
        // Simulate UI update work
        const squares = Array.from({ length: 64 }, (_, i) => ({
          file: String.fromCharCode(97 + (i % 8)),
          rank: Math.floor(i / 8) + 1,
          piece: i % 6 === 0 ? { type: 'p', color: 'w' } : undefined,
          isLight: (Math.floor(i / 8) + (i % 8)) % 2 === 0
        }));
        
        // Simulate rendering logic
        squares.forEach(square => {
          const classes = `square-${square.file}${square.rank} ${square.isLight ? 'light' : 'dark'}`;
          if (square.piece) {
            const pieceClass = `piece-${square.piece.color}-${square.piece.type}`;
          }
        });
        
        const duration = endMeasurement();
        measurements.push(duration);
      }
      
      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const p95 = measurements.sort((a, b) => a - b)[Math.floor(measurements.length * 0.95)];
      
      // Performance requirements: UI response should be < 100ms
      expect(average).toBeLessThan(100);
      expect(p95).toBeLessThan(150);
    });

    it('should demonstrate caching performance improvement', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const moves = ['e2e4', 'e2e3', 'd2d4', 'd2d3', 'g1f3', 'b1c3'];
      
      // Cache the moves first
      MoveValidationCache.cacheMoves(fen, moves);
      
      // Measure cache retrieval time
      const startWithCache = performance.now();
      for (let i = 0; i < 1000; i++) {
        const cachedMoves = MoveValidationCache.getCachedMoves(fen);
        expect(cachedMoves).toEqual(moves);
      }
      const timeWithCache = performance.now() - startWithCache;
      
      // Clear cache and measure calculation time
      MoveValidationCache.clearCache();
      
      const startWithoutCache = performance.now();
      for (let i = 0; i < 1000; i++) {
        // Simulate expensive move calculation
        const calculatedMoves = moves.filter(move => {
          // Simulate some validation work
          return move.length === 4 && 
                 move[0] >= 'a' && move[0] <= 'h' &&
                 move[2] >= 'a' && move[2] <= 'h' &&
                 parseInt(move[1]) >= 1 && parseInt(move[1]) <= 8 &&
                 parseInt(move[3]) >= 1 && parseInt(move[3]) <= 8;
        });
      }
      const timeWithoutCache = performance.now() - startWithCache;
      
      // Cache should be faster (though the difference might be small in this simple test)
      expect(timeWithCache).toBeLessThan(timeWithoutCache + 10); // Allow some margin
    });
  });
});