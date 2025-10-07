/**
 * Performance utilities for Scout Dashboard v5.0
 * 
 * Utilities for measuring and optimizing frontend performance
 */

// Performance monitoring
export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

/**
 * Measure Core Web Vitals
 */
export function measureCoreWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: Partial<PerformanceMetrics> = {};

    // FCP - First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
    }).observe({ entryTypes: ['paint'] });

    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart && entry.startTime) {
          metrics.fid = entry.processingStart - entry.startTime;
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      metrics.cls = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });

    // TTFB - Time to First Byte
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
    }

    // Resolve after a delay to allow metrics to be collected
    setTimeout(() => {
      resolve({
        fcp: metrics.fcp || 0,
        lcp: metrics.lcp || 0,
        fid: metrics.fid || 0,
        cls: metrics.cls || 0,
        ttfb: metrics.ttfb || 0,
      });
    }, 3000);
  });
}

/**
 * Send metrics to analytics service
 */
export function sendMetricsToAnalytics(metrics: PerformanceMetrics) {
  // In production, send to your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics 4
    // gtag('event', 'web_vital', {
    //   name: 'FCP',
    //   value: Math.round(metrics.fcp),
    //   event_category: 'Web Vitals'
    // });
    
    // Example: Send to custom analytics
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    }).catch(console.error);
  } else {
    console.log('Performance Metrics:', metrics);
  }
}

/**
 * Resource loading performance
 */
export function measureResourceTiming() {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const summary = {
    totalResources: resources.length,
    totalSize: 0,
    slowestResource: { name: '', duration: 0 },
    resourceTypes: {} as Record<string, { count: number; totalDuration: number }>
  };

  resources.forEach(resource => {
    const duration = resource.responseEnd - resource.startTime;
    const type = getResourceType(resource.name);
    
    if (duration > summary.slowestResource.duration) {
      summary.slowestResource = { name: resource.name, duration };
    }
    
    if (!summary.resourceTypes[type]) {
      summary.resourceTypes[type] = { count: 0, totalDuration: 0 };
    }
    
    summary.resourceTypes[type].count++;
    summary.resourceTypes[type].totalDuration += duration;
    
    // Estimate size from transfer size if available
    if ('transferSize' in resource) {
      summary.totalSize += resource.transferSize || 0;
    }
  });

  return summary;
}

function getResourceType(url: string): string {
  if (url.includes('.js')) return 'javascript';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
  if (url.match(/\\.(woff|woff2|ttf|otf)$/)) return 'font';
  if (url.includes('api/')) return 'api';
  return 'other';
}

/**
 * Bundle size tracking
 */
export function trackBundleSize() {
  // Track main bundle size
  const scripts = document.querySelectorAll('script[src]');
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  
  const bundleInfo = {
    scripts: scripts.length,
    stylesheets: stylesheets.length,
    estimatedJSSize: 0,
    estimatedCSSSize: 0
  };

  // This would need to be enhanced with actual size measurements
  // For now, we can track the number of assets
  
  return bundleInfo;
}

/**
 * Memory usage monitoring
 */
export function measureMemoryUsage() {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory;
    return {
      usedJSHeapSize: memInfo.usedJSHeapSize,
      totalJSHeapSize: memInfo.totalJSHeapSize,
      jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
      usagePercentage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
    };
  }
  return null;
}

/**
 * Performance budget checker
 */
export interface PerformanceBudget {
  fcp: number; // milliseconds
  lcp: number; // milliseconds
  fid: number; // milliseconds
  cls: number; // score
  bundleSize: number; // bytes
}

export const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1500,    // 1.5s
  lcp: 2500,    // 2.5s
  fid: 100,     // 100ms
  cls: 0.1,     // 0.1 score
  bundleSize: 2 * 1024 * 1024, // 2MB
};

export function checkPerformanceBudget(
  metrics: PerformanceMetrics, 
  budget: PerformanceBudget = DEFAULT_BUDGET
) {
  const violations: string[] = [];
  
  if (metrics.fcp > budget.fcp) {
    violations.push(`FCP: ${metrics.fcp}ms > ${budget.fcp}ms`);
  }
  
  if (metrics.lcp > budget.lcp) {
    violations.push(`LCP: ${metrics.lcp}ms > ${budget.lcp}ms`);
  }
  
  if (metrics.fid > budget.fid) {
    violations.push(`FID: ${metrics.fid}ms > ${budget.fid}ms`);
  }
  
  if (metrics.cls > budget.cls) {
    violations.push(`CLS: ${metrics.cls} > ${budget.cls}`);
  }

  return {
    passed: violations.length === 0,
    violations,
    score: Math.max(0, 100 - (violations.length * 20)) // Simple scoring
  };
}

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitoring() {
  const React = require('react');
  
  React.useEffect(() => {
    // Start monitoring after component mount
    const startTime = performance.now();
    
    measureCoreWebVitals().then(metrics => {
      const budget = checkPerformanceBudget(metrics);
      
      if (!budget.passed && process.env.NODE_ENV === 'development') {
        console.warn('Performance Budget Violations:', budget.violations);
      }
      
      sendMetricsToAnalytics(metrics);
    });
    
    // Cleanup function
    return () => {
      const endTime = performance.now();
      const componentLifetime = endTime - startTime;
      
      if (componentLifetime > 5000) { // 5 seconds
        console.warn(`Component had long lifetime: ${componentLifetime}ms`);
      }
    };
  }, []);
}

// Export for global usage
declare global {
  interface Window {
    __PERFORMANCE_UTILS__: {
      measureCoreWebVitals: typeof measureCoreWebVitals;
      checkPerformanceBudget: typeof checkPerformanceBudget;
      measureResourceTiming: typeof measureResourceTiming;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__PERFORMANCE_UTILS__ = {
    measureCoreWebVitals,
    checkPerformanceBudget,
    measureResourceTiming
  };
}