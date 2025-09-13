// Real-time metrics collection for system health monitoring
// Tracks performance metrics and provides health status

'use strict';

// In-memory metrics storage
let metrics = {
  requests: {
    total: 0,
    errors: 0,
    responseTimes: [],
    lastReset: Date.now()
  },
  cache: {
    hits: 0,
    misses: 0,
    errors: 0
  },
  health: {
    status: 'healthy',
    lastCheck: new Date().toISOString(),
    uptime: 0
  }
};

// Configuration
const METRICS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes rolling window
const MAX_RESPONSE_TIMES = 1000; // Keep last 1000 response times
const HEALTH_THRESHOLDS = {
  errorRate: 0.05,    // 5% error rate threshold
  p99Latency: 800,    // 800ms P99 latency threshold
  p95Latency: 500     // 500ms P95 latency threshold
};

/**
 * Record a request with response time and error status
 */
function recordRequest(responseTime, isError = false) {
  metrics.requests.total++;
  if (isError) {
    metrics.requests.errors++;
  }
  
  // Add response time to rolling window
  metrics.requests.responseTimes.push({
    time: responseTime,
    timestamp: Date.now()
  });
  
  // Keep only recent response times
  if (metrics.requests.responseTimes.length > MAX_RESPONSE_TIMES) {
    metrics.requests.responseTimes = metrics.requests.responseTimes.slice(-MAX_RESPONSE_TIMES);
  }
  
  // Clean old response times (outside window)
  const cutoff = Date.now() - METRICS_WINDOW_MS;
  metrics.requests.responseTimes = metrics.requests.responseTimes.filter(
    entry => entry.timestamp > cutoff
  );
}

/**
 * Record cache operation
 */
function recordCache(operation, isError = false) {
  if (isError) {
    metrics.cache.errors++;
  } else if (operation === 'hit') {
    metrics.cache.hits++;
  } else if (operation === 'miss') {
    metrics.cache.misses++;
  }
}

/**
 * Calculate percentile from response times
 */
function calculatePercentile(responseTimes, percentile) {
  if (responseTimes.length === 0) return 0;
  
  const sorted = responseTimes.map(entry => entry.time).sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get current metrics summary
 */
function getMetrics() {
  const now = Date.now();
  const windowStart = now - METRICS_WINDOW_MS;
  
  // Filter recent response times
  const recentResponseTimes = metrics.requests.responseTimes.filter(
    entry => entry.timestamp > windowStart
  );
  
  // Calculate percentiles
  const p50 = calculatePercentile(recentResponseTimes, 50);
  const p95 = calculatePercentile(recentResponseTimes, 95);
  const p99 = calculatePercentile(recentResponseTimes, 99);
  
  // Calculate error rate
  const recentRequests = metrics.requests.total;
  const recentErrors = metrics.requests.errors;
  const errorRate = recentRequests > 0 ? recentErrors / recentRequests : 0;
  
  // Calculate cache hit rate
  const totalCacheOps = metrics.cache.hits + metrics.cache.misses;
  const cacheHitRate = totalCacheOps > 0 ? metrics.cache.hits / totalCacheOps : 0;
  
  return {
    requests: {
      total: recentRequests,
      errors: recentErrors,
      errorRate,
      responseTime: {
        p50,
        p95,
        p99,
        count: recentResponseTimes.length
      }
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      errors: metrics.cache.errors,
      hitRate: cacheHitRate
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Determine system health status based on metrics
 */
function getHealthStatus() {
  const currentMetrics = getMetrics();
  const { errorRate, responseTime } = currentMetrics.requests;
  
  // Determine status based on thresholds
  let status = 'healthy';
  let issues = [];
  
  if (errorRate > HEALTH_THRESHOLDS.errorRate) {
    status = 'degraded';
    issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
  }
  
  if (responseTime.p99 > HEALTH_THRESHOLDS.p99Latency) {
    status = 'degraded';
    issues.push(`High P99 latency: ${responseTime.p99}ms`);
  }
  
  if (responseTime.p95 > HEALTH_THRESHOLDS.p95Latency && status === 'healthy') {
    status = 'degraded';
    issues.push(`High P95 latency: ${responseTime.p95}ms`);
  }
  
  // If we have critical issues, mark as error
  if (errorRate > HEALTH_THRESHOLDS.errorRate * 2 || responseTime.p99 > HEALTH_THRESHOLDS.p99Latency * 2) {
    status = 'error';
  }
  
  return {
    status,
    issues,
    metrics: {
      errorRate: (errorRate * 100).toFixed(2) + '%',
      p99: responseTime.p99 + 'ms',
      p95: responseTime.p95 + 'ms',
      cacheHitRate: (currentMetrics.cache.hitRate * 100).toFixed(1) + '%'
    },
    lastCheck: new Date().toISOString(),
    uptime: Math.round(currentMetrics.uptime)
  };
}

/**
 * Reset metrics (useful for testing)
 */
function resetMetrics() {
  metrics = {
    requests: {
      total: 0,
      errors: 0,
      responseTimes: [],
      lastReset: Date.now()
    },
    cache: {
      hits: 0,
      misses: 0,
      errors: 0
    },
    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 0
    }
  };
}

/**
 * Express middleware to automatically track requests
 */
function metricsMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
      const responseTime = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      
      // Don't track health/status endpoints to avoid noise
      if (!req.path.includes('/health') && !req.path.includes('/status')) {
        recordRequest(responseTime, isError);
      }
      
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

module.exports = {
  recordRequest,
  recordCache,
  getMetrics,
  getHealthStatus,
  resetMetrics,
  metricsMiddleware,
  HEALTH_THRESHOLDS
};
