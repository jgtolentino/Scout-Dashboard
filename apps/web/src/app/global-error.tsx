'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Handler for Root Layout Errors
 * - Catches errors that occur in the root layout
 * - Provides minimal, secure error UI
 * - Enhanced Sentry reporting
 * - Graceful recovery mechanisms
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Enhanced error reporting for global errors
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary', 'global_error');
      scope.setLevel('fatal'); // Global errors are critical
      
      // Set enhanced context for global errors
      scope.setContext('global_error_details', {
        name: error.name,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 100) : 'unknown',
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight,
        } : null,
        memory: typeof window !== 'undefined' && (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
        } : null,
      });

      // Add breadcrumbs for global error context
      scope.addBreadcrumb({
        message: 'Global error boundary triggered',
        level: 'fatal',
        category: 'error',
        data: {
          errorName: error.name,
          hasDigest: !!error.digest,
        },
      });

      // Set fingerprint for better error grouping
      scope.setFingerprint(['global-error', error.name, error.digest || 'no-digest']);
      
      // Capture the exception
      const eventId = Sentry.captureException(error);
      
      // Store event ID for user feedback
      if (typeof window !== 'undefined') {
        (window as any).__sentryErrorEventId = eventId;
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error:', error);
    }
  }, [error]);

  const isProduction = process.env.NODE_ENV === 'production';

  // Minimal error handling to avoid recursive errors
  const handleReset = () => {
    try {
      Sentry.addBreadcrumb({
        message: 'User attempted global error recovery',
        level: 'info',
        category: 'user_action',
      });
      reset();
    } catch (resetError) {
      // If reset fails, fallback to page reload
      window.location.reload();
    }
  };

  const handleReload = () => {
    try {
      Sentry.addBreadcrumb({
        message: 'User initiated page reload from global error',
        level: 'info',
        category: 'user_action',
      });
      window.location.reload();
    } catch (reloadError) {
      // Last resort - navigate to home
      window.location.href = '/';
    }
  };

  return (
    <html lang="en">
      <head>
        <title>System Error - Scout Dashboard</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
            }
            .error-container {
              max-width: 500px;
              width: 100%;
              text-align: center;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              padding: 2rem;
            }
            .error-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 4rem;
              height: 4rem;
              background: #fee2e2;
              border-radius: 50%;
              margin-bottom: 1.5rem;
            }
            .error-title {
              font-size: 2rem;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 0.5rem;
            }
            .error-message {
              color: #6b7280;
              margin-bottom: 2rem;
              line-height: 1.5;
            }
            .error-buttons {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
            }
            .error-button {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              text-decoration: none;
              font-size: 0.875rem;
            }
            .error-button:focus {
              outline: 2px solid #3b82f6;
              outline-offset: 2px;
            }
            .error-button-primary {
              background: #dc2626;
              color: white;
            }
            .error-button-primary:hover {
              background: #b91c1c;
            }
            .error-button-secondary {
              background: #f3f4f6;
              color: #374151;
              border: 1px solid #d1d5db;
            }
            .error-button-secondary:hover {
              background: #e5e7eb;
            }
            .error-details {
              margin-top: 1.5rem;
              padding: 1rem;
              background: #f9fafb;
              border-radius: 8px;
              font-size: 0.75rem;
              color: #6b7280;
            }
            @media (max-width: 640px) {
              .error-buttons {
                flex-direction: column;
              }
              .error-button {
                width: 100%;
                justify-content: center;
              }
            }
          `
        }} />
      </head>
      <body>
        <div className="error-container">
          <div className="error-icon">
            <svg 
              width="24" 
              height="24" 
              fill="none" 
              stroke="#dc2626" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="error-title">System Error</h1>
          
          <p className="error-message">
            {isProduction 
              ? 'A critical system error occurred. We\'ve been automatically notified and are working to resolve this issue.'
              : `A critical error occurred: ${error.message}`
            }
          </p>

          <div className="error-buttons">
            <button 
              onClick={handleReset}
              className="error-button error-button-primary"
              type="button"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            <button 
              onClick={handleReload}
              className="error-button error-button-secondary"
              type="button"
            >
              Reload Page
            </button>
          </div>

          <div className="error-details">
            <p>
              Error ID: {error.digest || 'N/A'} • {new Date().toLocaleString()}
            </p>
            {isProduction && (
              <p style={{ marginTop: '0.5rem' }}>
                If this issue persists, please contact technical support.
              </p>
            )}
          </div>
        </div>

        {/* Minimal client-side error recovery script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Global error handler for uncaught errors
            window.onerror = function(message, source, lineno, colno, error) {
              console.error('Uncaught error:', { message, source, lineno, colno, error });
              return false;
            };
            
            // Promise rejection handler
            window.onunhandledrejection = function(event) {
              console.error('Unhandled promise rejection:', event.reason);
              event.preventDefault();
            };
          `
        }} />
      </body>
    </html>
  );
}