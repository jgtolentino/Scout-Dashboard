import * as Sentry from '@sentry/nextjs';

/**
 * Performance monitoring utilities for Sentry
 */

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private transaction: Sentry.Transaction | null = null;

  constructor(transactionName?: string, operation = 'custom') {
    if (transactionName) {
      this.transaction = Sentry.startTransaction({
        name: transactionName,
        op: operation,
      });
    }
  }

  /**
   * Start timing a specific operation
   */
  startTiming(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End timing for an operation
   */
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No timing started for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    // Update metric
    metric.endTime = endTime;
    metric.duration = duration;

    // Add span to transaction if available
    if (this.transaction) {
      const span = this.transaction.startChild({
        op: 'measure',
        description: name,
        data: metric.metadata,
      });
      span.setData('duration_ms', duration);
      span.finish();
    }

    return duration;
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTiming(name, metadata);
    
    try {
      const result = await operation();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      
      // Add error context to transaction
      if (this.transaction) {
        this.transaction.setStatus('internal_error');
        this.transaction.setTag('error', true);
      }
      
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startTiming(name, metadata);
    
    try {
      const result = operation();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      
      if (this.transaction) {
        this.transaction.setStatus('internal_error');
        this.transaction.setTag('error', true);
      }
      
      throw error;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Add custom data to the transaction
   */
  addData(key: string, value: any): void {
    if (this.transaction) {
      this.transaction.setData(key, value);
    }
  }

  /**
   * Add tags to the transaction
   */
  addTag(key: string, value: string): void {
    if (this.transaction) {
      this.transaction.setTag(key, value);
    }
  }

  /**
   * Set transaction status
   */
  setStatus(status: Sentry.SpanStatusType): void {
    if (this.transaction) {
      this.transaction.setStatus(status);
    }
  }

  /**
   * Finish the transaction and send metrics
   */
  finish(): void {
    if (this.transaction) {
      // Add summary metrics
      const metrics = this.getMetrics();
      const totalDuration = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
      
      this.transaction.setData('total_operations', metrics.length);
      this.transaction.setData('total_duration_ms', totalDuration);
      this.transaction.setData('metrics', metrics);
      
      this.transaction.finish();
    }
  }
}

/**
 * API call performance monitoring
 */
export async function monitorApiCall<T>(
  endpoint: string,
  apiCall: () => Promise<T>,
  options: {
    expectedDuration?: number;
    tags?: Record<string, string>;
    metadata?: Record<string, any>;
  } = {}
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name: `API ${endpoint}`,
    op: 'http.client',
  });

  const startTime = performance.now();

  try {
    // Add initial context
    transaction.setTag('endpoint', endpoint);
    if (options.tags) {
      Object.entries(options.tags).forEach(([key, value]) => {
        transaction.setTag(key, value);
      });
    }

    // Execute API call
    const result = await apiCall();
    const duration = performance.now() - startTime;

    // Record success metrics
    transaction.setStatus('ok');
    transaction.setData('duration_ms', duration);
    transaction.setData('success', true);

    // Check if duration exceeds expectations
    if (options.expectedDuration && duration > options.expectedDuration) {
      transaction.setTag('slow_request', 'true');
      Sentry.addBreadcrumb({
        message: `Slow API call detected: ${endpoint}`,
        level: 'warning',
        data: {
          duration,
          expected: options.expectedDuration,
        },
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Record error metrics
    transaction.setStatus('internal_error');
    transaction.setData('duration_ms', duration);
    transaction.setData('success', false);
    transaction.setData('error', error instanceof Error ? error.message : 'Unknown error');

    // Capture error with context
    Sentry.withScope((scope) => {
      scope.setTag('api_endpoint', endpoint);
      scope.setLevel('error');
      scope.setContext('api_call', {
        endpoint,
        duration,
        metadata: options.metadata,
      });
      Sentry.captureException(error);
    });

    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Component render performance monitoring
 */
export function monitorComponentRender(componentName: string) {
  const transaction = Sentry.startTransaction({
    name: `Render ${componentName}`,
    op: 'ui.react.render',
  });

  return {
    finish: () => transaction.finish(),
    addData: (key: string, value: any) => transaction.setData(key, value),
    addTag: (key: string, value: string) => transaction.setTag(key, value),
  };
}

/**
 * Database query performance monitoring
 */
export async function monitorDatabaseQuery<T>(
  queryName: string,
  query: () => Promise<T>,
  options: {
    table?: string;
    operation?: string;
    expectedRows?: number;
  } = {}
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name: `DB ${queryName}`,
    op: 'db.query',
  });

  try {
    transaction.setTag('query_name', queryName);
    if (options.table) transaction.setTag('table', options.table);
    if (options.operation) transaction.setTag('operation', options.operation);

    const startTime = performance.now();
    const result = await query();
    const duration = performance.now() - startTime;

    transaction.setStatus('ok');
    transaction.setData('duration_ms', duration);
    transaction.setData('success', true);

    // Add result metrics if available
    if (Array.isArray(result)) {
      transaction.setData('rows_returned', result.length);
      
      if (options.expectedRows && result.length > options.expectedRows * 2) {
        transaction.setTag('large_result_set', 'true');
        Sentry.addBreadcrumb({
          message: `Large result set detected: ${queryName}`,
          level: 'warning',
          data: {
            rows: result.length,
            expected: options.expectedRows,
          },
        });
      }
    }

    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    transaction.setData('success', false);

    Sentry.withScope((scope) => {
      scope.setTag('query_name', queryName);
      if (options.table) scope.setTag('table', options.table);
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Web Vitals monitoring
 */
export function initWebVitalsMonitoring(): void {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Monitor Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS((metric) => {
      Sentry.addBreadcrumb({
        message: 'Core Web Vital: CLS',
        level: 'info',
        data: metric,
      });
      
      if (metric.value > 0.1) {
        Sentry.captureMessage(`Poor CLS detected: ${metric.value}`, 'warning');
      }
    });

    getFID((metric) => {
      Sentry.addBreadcrumb({
        message: 'Core Web Vital: FID',
        level: 'info',
        data: metric,
      });
      
      if (metric.value > 100) {
        Sentry.captureMessage(`Poor FID detected: ${metric.value}ms`, 'warning');
      }
    });

    getFCP((metric) => {
      Sentry.addBreadcrumb({
        message: 'Core Web Vital: FCP',
        level: 'info',
        data: metric,
      });
    });

    getLCP((metric) => {
      Sentry.addBreadcrumb({
        message: 'Core Web Vital: LCP',
        level: 'info',
        data: metric,
      });
      
      if (metric.value > 2500) {
        Sentry.captureMessage(`Poor LCP detected: ${metric.value}ms`, 'warning');
      }
    });

    getTTFB((metric) => {
      Sentry.addBreadcrumb({
        message: 'Core Web Vital: TTFB',
        level: 'info',
        data: metric,
      });
    });
  }).catch((error) => {
    console.warn('Failed to load web-vitals:', error);
  });
}

/**
 * Memory usage monitoring
 */
export function monitorMemoryUsage(): void {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  
  if (memory) {
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };

    Sentry.addBreadcrumb({
      message: 'Memory Usage',
      level: 'info',
      data: memoryInfo,
    });

    // Alert if memory usage is high
    if (memoryInfo.usage_percentage > 80) {
      Sentry.captureMessage(
        `High memory usage detected: ${memoryInfo.usage_percentage.toFixed(2)}%`,
        'warning'
      );
    }
  }
}

// Export the main performance monitor class
export default PerformanceMonitor;