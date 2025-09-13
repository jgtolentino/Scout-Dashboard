import * as Sentry from '@sentry/nextjs';
import { CaptureContext } from '@sentry/types';

// Sentry configuration types
interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

// Initialize Sentry with production-ready configuration
export function initSentry(config: Partial<SentryConfig> = {}) {
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';

  Sentry.init({
    dsn: config.dsn || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: config.environment || environment,
    
    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate ?? (isProduction ? 0.1 : 1.0),
    
    // Session Replay
    replaysSessionSampleRate: config.replaysSessionSampleRate ?? (isProduction ? 0.1 : 0),
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 1.0,
    
    // Additional options
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      // Don't send events in development unless explicitly enabled
      if (!isProduction && !process.env.SENTRY_SEND_IN_DEV) {
        return null;
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', /^https:\/\/yourapp\.com\/api/],
        // Automatic instrumentation
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        // Mask sensitive content
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
        // Privacy options
        networkDetailAllowUrls: [window.location.origin],
        networkCaptureBodies: false,
        networkRequestHeaders: false,
        networkResponseHeaders: false,
      }),
    ],
    
    // Error filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Facebook related errors
      'fb_xd_fragment',
      // Network errors
      'NetworkError',
      'Non-Error promise rejection captured',
      // Ignore benign errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
    
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      // Facebook SDK
      /graph\.facebook\.com/i,
      // Google Analytics
      /google-analytics\.com/i,
      // Third-party scripts
      /googletagmanager\.com/i,
    ],
  });
}

// Custom error boundary for React components
export function captureException(error: Error, context?: CaptureContext) {
  if (process.env.NODE_ENV === 'production') {
    return Sentry.captureException(error, context);
  } else {
    console.error('Sentry Error:', error, context);
  }
}

// User context for better error tracking
export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
} | null) {
  Sentry.setUser(user);
}

// Add custom breadcrumb for user actions
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: any;
}) {
  Sentry.addBreadcrumb({
    timestamp: Date.now() / 1000,
    ...breadcrumb,
  });
}

// Custom transaction for performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

// Profiling for performance issues
export function profileComponent(componentName: string) {
  return Sentry.withProfiler(componentName);
}

// Error levels
export enum ErrorLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Debug = 'debug',
}

// Capture message with level
export function captureMessage(message: string, level: ErrorLevel = ErrorLevel.Info) {
  Sentry.captureMessage(message, level);
}

// Performance monitoring utilities
export const performance = {
  // Mark navigation timing
  markNavigation: (routeName: string) => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    if (transaction) {
      transaction.setName(routeName);
      transaction.setTag('route', routeName);
    }
  },
  
  // Measure API call performance
  measureApiCall: async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const transaction = startTransaction(`api.${apiName}`, 'http.client');
    
    try {
      const result = await apiCall();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  },
  
  // Track component render time
  measureRender: (componentName: string, renderFn: () => void) => {
    const transaction = startTransaction(`render.${componentName}`, 'ui.react.render');
    
    try {
      renderFn();
      transaction.setStatus('ok');
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  },
};

// Analytics event tracking
export const analytics = {
  // Track custom events
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    addBreadcrumb({
      message: eventName,
      category: 'analytics',
      data: properties,
    });
    
    // Also send to Vercel Analytics if available
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('event', eventName, properties);
    }
  },
  
  // Track page views
  trackPageView: (pageName: string, properties?: Record<string, any>) => {
    addBreadcrumb({
      message: `Page View: ${pageName}`,
      category: 'navigation',
      data: properties,
    });
    
    // Vercel Analytics page view
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('pageview', properties);
    }
  },
};

// Enhanced error capture with performance monitoring
export function captureExceptionWithPerformance(
  error: Error,
  context?: CaptureContext & { performanceData?: Record<string, any> }
) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      if (context?.performanceData) {
        scope.setContext('performance', context.performanceData);
      }
      
      // Add memory info if available
      if (typeof window !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        scope.setContext('memory', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
      
      return Sentry.captureException(error, context);
    });
  } else {
    console.error('Sentry Error:', error, context);
  }
}

// Export Sentry instance for direct access
export { Sentry };