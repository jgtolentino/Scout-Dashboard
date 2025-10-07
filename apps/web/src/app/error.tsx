'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Enhanced Error Page with Security Hardening
 * - No sensitive information exposure
 * - User-friendly error handling
 * - Comprehensive error reporting
 * - Recovery mechanisms
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Capture error in Sentry with enhanced context
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary', 'app_error');
      scope.setLevel('error');
      
      // Add error context without exposing sensitive data
      scope.setContext('error_details', {
        name: error.name,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 100) : 'unknown',
      });

      // Set fingerprint for better error grouping
      scope.setFingerprint(['app-error', error.name, error.digest || 'no-digest']);
      
      Sentry.captureException(error);
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', error);
    }
  }, [error]);

  // Don't expose sensitive error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction 
    ? 'Something unexpected happened. We\'ve been notified and are looking into it.'
    : error.message;

  const errorId = error.digest || 'unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="bg-red-100 rounded-full p-6">
            <AlertTriangle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Oops!
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            Something went wrong
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {errorMessage}
          </p>
          {!isProduction && error.digest && (
            <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <button
            onClick={() => {
              // Add breadcrumb for retry attempt
              Sentry.addBreadcrumb({
                message: 'User attempted error recovery',
                level: 'info',
                category: 'user_action',
                data: { errorId, action: 'retry' },
              });
              reset();
            }}
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={() => {
              Sentry.addBreadcrumb({
                message: 'User navigated to home from error',
                level: 'info',
                category: 'user_action',
                data: { errorId, action: 'go_home' },
              });
              window.location.href = '/';
            }}
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </button>
        </div>

        {/* Error Details Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            What happened?
          </h3>
          <div className="space-y-3 text-sm text-gray-600 text-left">
            <div className="flex items-start">
              <Bug className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>
                An unexpected error occurred while loading this page. 
                Our team has been automatically notified.
              </span>
            </div>
            <div className="flex items-start">
              <RefreshCw className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>
                Try refreshing the page or navigating back to the dashboard.
              </span>
            </div>
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>
                If the problem persists, please contact support with the error ID above.
              </span>
            </div>
          </div>
        </div>

        {/* Technical Details (Development Only) */}
        {!isProduction && (
          <details className="bg-gray-100 rounded-lg p-4 text-left">
            <summary className="font-medium text-gray-900 cursor-pointer">
              Technical Details (Development)
            </summary>
            <div className="mt-4 space-y-2 text-sm font-mono">
              <div>
                <strong>Error:</strong> {error.name}
              </div>
              <div>
                <strong>Message:</strong> {error.message}
              </div>
              {error.digest && (
                <div>
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-2 p-2 bg-gray-200 rounded text-xs overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-500">
          Error reported automatically • {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}