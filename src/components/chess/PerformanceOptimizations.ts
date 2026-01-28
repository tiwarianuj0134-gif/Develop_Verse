/**
 * Performance Optimizations for Chess Game
 * Task 10.3: Performance optimization and final integration testing
 * Requirements: 8.1, 8.2, 8.4, 8.5, 8.6
 */

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();
  private static readonly MAX_MEASUREMENTS = 100;

  /**
   * Start performance measurement
   */
  static startMeasurement(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMeasurement(name, duration);
      return duration;
    };
  }

  /**
   * Record a performance measurement
   */
  static recordMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    const measurements = this.measurements.get(name)!;
    measurements.push(duration);
    
    // Keep only the last MAX_MEASUREMENTS
    if (measurements.length > this.MAX_MEASUREMENTS) {
      measurements.shift();
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, average, min, max, p95 };
  }

  /**
   * Get all performance statistics
   */
  static getAllStats(): Record<string, ReturnType<typeof PerformanceMonitor.getStats>> {
    const stats: Record<string, ReturnType<typeof PerformanceMonitor.getStats>> = {};
    
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name);
    }
    
    return stats;
  }

  /**
   * Clear all measurements
   */
  static clearMeasurements(): void {
    this.measurements.clear();
  }

  /**
   * Check if performance requirements are met
   */
  static checkPerformanceRequirements(): {
    moveValidation: boolean; // Should be < 50ms
    uiResponse: boolean; // Should be < 100ms
    moveAnimation: boolean; // Should be < 300ms
    gameStateLoad: boolean; // Should be < 200ms
    legalMovesCalculation: boolean; // Should be < 100ms
  } {
    const moveValidationStats = this.getStats('move_validation');
    const uiResponseStats = this.getStats('ui_response');
    const moveAnimationStats = this.getStats('move_animation');
    const gameStateLoadStats = this.getStats('game_state_load');
    const legalMovesStats = this.getStats('legal_moves_calculation');

    return {
      moveValidation: !moveValidationStats || moveValidationStats.p95 < 50,
      uiResponse: !uiResponseStats || uiResponseStats.p95 < 100,
      moveAnimation: !moveAnimationStats || moveAnimationStats.p95 < 300,
      gameStateLoad: !gameStateLoadStats || gameStateLoadStats.p95 < 200,
      legalMovesCalculation: !legalMovesStats || legalMovesStats.p95 < 100
    };
  }
}

/**
 * Move validation cache for improved performance
 */
export class MoveValidationCache {
  private static cache: Map<string, { moves: string[]; timestamp: number }> = new Map();
  private static readonly CACHE_TTL = 5000; // 5 seconds
  private static readonly MAX_CACHE_SIZE = 100;

  /**
   * Get cached valid moves for a position
   */
  static getCachedMoves(fen: string, square?: string): string[] | null {
    const cacheKey = `${fen}:${square || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.moves;
  }

  /**
   * Cache valid moves for a position
   */
  static cacheMoves(fen: string, moves: string[], square?: string): void {
    const cacheKey = `${fen}:${square || 'all'}`;
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(cacheKey, {
      moves: [...moves],
      timestamp: Date.now()
    });
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    // This would require tracking hits/misses in a real implementation
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // Placeholder
    };
  }
}

/**
 * Debounced function utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Throttled function utility for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static cleanupCallbacks: Set<() => void> = new Set();

  /**
   * Start memory management
   */
  static startMemoryManagement(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop memory management
   */
  static stopMemoryManagement(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Register a cleanup callback
   */
  static registerCleanup(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);
    
    // Return unregister function
    return () => {
      this.cleanupCallbacks.delete(callback);
    };
  }

  /**
   * Perform cleanup operations
   */
  private static performCleanup(): void {
    // Clear old cache entries
    MoveValidationCache.clearCache();
    
    // Clear old performance measurements
    const stats = PerformanceMonitor.getAllStats();
    for (const [, stat] of Object.entries(stats)) {
      if (stat && stat.count > 50) {
        // Keep only recent measurements
        PerformanceMonitor.clearMeasurements();
        break;
      }
    }
    
    // Run registered cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });
    
    // Force garbage collection if available (development only)
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Get memory usage information
   */
  static getMemoryInfo(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    
    return null;
  }
}

/**
 * Batch processing utility for performance optimization
 */
export class BatchProcessor {
  private static batches: Map<string, {
    items: any[];
    processor: (items: any[]) => void;
    timeout: NodeJS.Timeout;
    maxSize: number;
    maxWait: number;
  }> = new Map();

  /**
   * Add item to batch for processing
   */
  static addToBatch<T>(
    batchId: string,
    item: T,
    processor: (items: T[]) => void,
    options: {
      maxSize?: number;
      maxWait?: number;
    } = {}
  ): void {
    const { maxSize = 10, maxWait = 100 } = options;
    
    let batch = this.batches.get(batchId);
    
    if (!batch) {
      batch = {
        items: [],
        processor: processor as (items: any[]) => void,
        timeout: setTimeout(() => this.processBatch(batchId), maxWait),
        maxSize,
        maxWait
      };
      this.batches.set(batchId, batch);
    }
    
    batch.items.push(item);
    
    // Process immediately if batch is full
    if (batch.items.length >= batch.maxSize) {
      this.processBatch(batchId);
    }
  }

  /**
   * Process a batch immediately
   */
  private static processBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return;
    }
    
    // Clear timeout
    clearTimeout(batch.timeout);
    
    // Process items
    if (batch.items.length > 0) {
      try {
        batch.processor(batch.items);
      } catch (error) {
        console.error(`Error processing batch ${batchId}:`, error);
      }
    }
    
    // Remove batch
    this.batches.delete(batchId);
  }

  /**
   * Clear all batches
   */
  static clearAllBatches(): void {
    for (const [batchId, batch] of this.batches) {
      clearTimeout(batch.timeout);
    }
    this.batches.clear();
  }
}

/**
 * Performance optimization configuration
 */
export const PERFORMANCE_CONFIG = {
  // Move validation optimization
  ENABLE_MOVE_CACHE: true,
  MOVE_CACHE_TTL: 5000,
  
  // UI optimization
  DEBOUNCE_UI_UPDATES: true,
  UI_UPDATE_DEBOUNCE_MS: 16, // ~60fps
  
  // Network optimization
  ENABLE_REQUEST_BATCHING: true,
  BATCH_REQUEST_DELAY: 50,
  
  // Memory management
  ENABLE_MEMORY_MANAGEMENT: true,
  CLEANUP_INTERVAL_MS: 60000,
  
  // Performance monitoring
  ENABLE_PERFORMANCE_MONITORING: true,
  MAX_PERFORMANCE_SAMPLES: 100,
  
  // Animation optimization
  ENABLE_HARDWARE_ACCELERATION: true,
  REDUCE_ANIMATIONS_ON_LOW_END: true,
  
  // Rendering optimization
  ENABLE_VIRTUAL_RENDERING: false, // For future implementation
  RENDER_BATCH_SIZE: 8
} as const;

/**
 * Device capability detection for performance optimization
 */
export class DeviceCapabilities {
  private static capabilities: {
    isLowEndDevice: boolean;
    supportsHardwareAcceleration: boolean;
    memoryLimit: number;
    connectionSpeed: 'slow' | 'fast' | 'unknown';
    screenSize: 'small' | 'medium' | 'large';
  } | null = null;

  /**
   * Detect device capabilities
   */
  static detectCapabilities(): typeof DeviceCapabilities.capabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    // Detect low-end device
    const isLowEndDevice = this.detectLowEndDevice();
    
    // Detect hardware acceleration support
    const supportsHardwareAcceleration = this.detectHardwareAcceleration();
    
    // Estimate memory limit
    const memoryLimit = this.estimateMemoryLimit();
    
    // Detect connection speed
    const connectionSpeed = this.detectConnectionSpeed();
    
    // Detect screen size
    const screenSize = this.detectScreenSize();

    this.capabilities = {
      isLowEndDevice,
      supportsHardwareAcceleration,
      memoryLimit,
      connectionSpeed,
      screenSize
    };

    return this.capabilities;
  }

  /**
   * Detect if device is low-end
   */
  private static detectLowEndDevice(): boolean {
    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 1;
    if (cores <= 2) {
      return true;
    }

    // Check memory if available
    const memory = MemoryManager.getMemoryInfo();
    if (memory && memory.total < 1024 * 1024 * 1024) { // Less than 1GB
      return true;
    }

    // Check user agent for known low-end devices
    const userAgent = navigator.userAgent.toLowerCase();
    const lowEndPatterns = [
      'android 4', 'android 5', 'android 6',
      'iphone os 9', 'iphone os 10',
      'windows phone'
    ];

    return lowEndPatterns.some(pattern => userAgent.includes(pattern));
  }

  /**
   * Detect hardware acceleration support
   */
  private static detectHardwareAcceleration(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  /**
   * Estimate memory limit
   */
  private static estimateMemoryLimit(): number {
    const memory = MemoryManager.getMemoryInfo();
    if (memory) {
      return memory.total;
    }

    // Fallback estimation based on device type
    // Check hardware concurrency (CPU cores) for estimation
    const cores = navigator.hardwareConcurrency || 1;
    if (cores <= 2) {
      return 512 * 1024 * 1024; // 512MB for low-end devices
    }

    return 2 * 1024 * 1024 * 1024; // 2GB default
  }

  /**
   * Detect connection speed
   */
  private static detectConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType) {
        return ['slow-2g', '2g', '3g'].includes(connection.effectiveType) ? 'slow' : 'fast';
      }
    }

    return 'unknown';
  }

  /**
   * Detect screen size category
   */
  private static detectScreenSize(): 'small' | 'medium' | 'large' {
    const width = window.innerWidth;
    
    if (width < 768) {
      return 'small';
    } else if (width < 1024) {
      return 'medium';
    } else {
      return 'large';
    }
  }

  /**
   * Get optimization recommendations based on device capabilities
   */
  static getOptimizationRecommendations(): {
    reduceAnimations: boolean;
    enableCaching: boolean;
    batchUpdates: boolean;
    limitConcurrency: boolean;
    useHardwareAcceleration: boolean;
  } {
    const capabilities = this.detectCapabilities();
    
    return {
      reduceAnimations: capabilities?.isLowEndDevice || false,
      enableCaching: true,
      batchUpdates: capabilities?.isLowEndDevice || false,
      limitConcurrency: capabilities?.isLowEndDevice || false,
      useHardwareAcceleration: capabilities?.supportsHardwareAcceleration || false
    };
  }
}

// Initialize memory management
MemoryManager.startMemoryManagement();