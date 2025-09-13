import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { track } from '@vercel/analytics';

// Vercel Analytics configuration
export interface AnalyticsConfig {
  debug?: boolean;
  mode?: 'production' | 'development';
}

// Initialize Vercel Analytics components
export function AnalyticsProvider({ 
  children,
  config = {} 
}: { 
  children: React.ReactNode;
  config?: AnalyticsConfig;
}) {
  return (
    <>
      {children}
      <Analytics 
        debug={config.debug}
        mode={config.mode || process.env.NODE_ENV as 'production' | 'development'}
      />
      <SpeedInsights />
    </>
  );
}

// Custom event tracking
export const trackEvent = track;

// Predefined event types for consistency
export const events = {
  // User authentication events
  auth: {
    login: (method: string) => trackEvent('auth_login', { method }),
    logout: () => trackEvent('auth_logout'),
    signup: (method: string) => trackEvent('auth_signup', { method }),
    passwordReset: () => trackEvent('auth_password_reset'),
  },
  
  // Dashboard interactions
  dashboard: {
    viewMetric: (metricName: string) => trackEvent('dashboard_view_metric', { metric: metricName }),
    filterChange: (filterType: string, value: any) => trackEvent('dashboard_filter_change', { filterType, value }),
    exportData: (format: string) => trackEvent('dashboard_export', { format }),
    refresh: () => trackEvent('dashboard_refresh'),
  },
  
  // Data operations
  data: {
    create: (entityType: string) => trackEvent('data_create', { entityType }),
    update: (entityType: string, entityId: string) => trackEvent('data_update', { entityType, entityId }),
    delete: (entityType: string, entityId: string) => trackEvent('data_delete', { entityType, entityId }),
    bulkOperation: (operation: string, count: number) => trackEvent('data_bulk_operation', { operation, count }),
  },
  
  // Performance metrics
  performance: {
    slowQuery: (queryName: string, duration: number) => trackEvent('performance_slow_query', { queryName, duration }),
    apiError: (endpoint: string, error: string) => trackEvent('performance_api_error', { endpoint, error }),
    cacheHit: (cacheKey: string) => trackEvent('performance_cache_hit', { cacheKey }),
    cacheMiss: (cacheKey: string) => trackEvent('performance_cache_miss', { cacheKey }),
  },
  
  // Feature usage
  feature: {
    use: (featureName: string) => trackEvent('feature_use', { feature: featureName }),
    enable: (featureName: string) => trackEvent('feature_enable', { feature: featureName }),
    disable: (featureName: string) => trackEvent('feature_disable', { feature: featureName }),
  },
  
  // Search and navigation
  navigation: {
    search: (query: string, resultCount: number) => trackEvent('navigation_search', { query, resultCount }),
    breadcrumbClick: (path: string) => trackEvent('navigation_breadcrumb', { path }),
    menuClick: (menuItem: string) => trackEvent('navigation_menu', { menuItem }),
  },
  
  // Error tracking (complementary to Sentry)
  error: {
    boundary: (errorMessage: string, componentStack: string) => 
      trackEvent('error_boundary', { error: errorMessage, componentStack }),
    validation: (field: string, error: string) => 
      trackEvent('error_validation', { field, error }),
    network: (url: string, status: number) => 
      trackEvent('error_network', { url, status }),
  },
};

// Web Vitals tracking
export function trackWebVitals(metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}) {
  // Track to Vercel Analytics
  trackEvent('web_vitals', {
    metric: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: metric.rating,
  });
  
  // Log poor performance metrics
  if (metric.rating === 'poor') {
    console.warn(`Poor ${metric.name} performance:`, metric.value);
  }
}

// Custom hook for tracking page views
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (pathname) {
      const url = searchParams ? `${pathname}?${searchParams}` : pathname;
      trackEvent('page_view', { url });
    }
  }, [pathname, searchParams]);
}

// Conversion tracking
export const conversions = {
  // Track successful actions
  success: (action: string, value?: number) => {
    trackEvent('conversion_success', { action, value });
  },
  
  // Track failed actions
  failure: (action: string, reason: string) => {
    trackEvent('conversion_failure', { action, reason });
  },
  
  // Track funnel steps
  funnelStep: (funnelName: string, step: number, stepName: string) => {
    trackEvent('funnel_step', { funnel: funnelName, step, stepName });
  },
};

// A/B testing support
export const experiments = {
  // Track experiment views
  view: (experimentName: string, variant: string) => {
    trackEvent('experiment_view', { experiment: experimentName, variant });
  },
  
  // Track experiment interactions
  interact: (experimentName: string, variant: string, action: string) => {
    trackEvent('experiment_interact', { experiment: experimentName, variant, action });
  },
};

// Session tracking
export const session = {
  // Track session duration
  duration: (seconds: number) => {
    trackEvent('session_duration', { duration: seconds });
  },
  
  // Track engagement depth
  depth: (level: 'shallow' | 'medium' | 'deep') => {
    trackEvent('session_depth', { level });
  },
};