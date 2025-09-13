'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  beforeCapture?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: Sentry.SeverityLevel;
  showDialog?: boolean;
  dialogOptions?: {
    title?: string;
    subtitle?: string;
    subtitle2?: string;
    labelName?: string;
    labelEmail?: string;
    labelComments?: string;
    labelClose?: string;
    labelSubmit?: string;
    errorGeneric?: string;
    errorFormEntry?: string;
    successMessage?: string;
  };
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Execute beforeCapture callback if provided
    if (this.props.beforeCapture) {
      this.props.beforeCapture(error, errorInfo);
    }

    // Capture error with Sentry
    Sentry.withScope((scope) => {
      // Set error level
      scope.setLevel(this.props.level || 'error');
      
      // Add React component context
      scope.setTag('component', 'ErrorBoundary');
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      
      // Add component props as context (excluding children)
      const { children, fallback, beforeCapture, ...safeProps } = this.props;
      scope.setContext('props', safeProps);
      
      // Capture the exception
      const eventId = Sentry.captureException(error);
      
      this.setState({
        errorInfo,
        eventId,
      });
      
      // Show Sentry dialog if enabled
      if (this.props.showDialog) {
        Sentry.showReportDialog({
          eventId,
          ...this.props.dialogOptions,
        });
      }
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleReportFeedback = (): void => {
    if (this.state.eventId) {
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        ...this.props.dialogOptions,
      });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-6">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>

              {/* Error Content */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  An unexpected error occurred. Our team has been notified and is working on a fix.
                </p>

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 text-left">
                    <details className="bg-gray-50 p-4 rounded-md">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                        Error Details (Development)
                      </summary>
                      <pre className="text-xs text-red-600 overflow-auto">
                        {this.state.error.name}: {this.state.error.message}
                        {this.state.error.stack}
                      </pre>
                    </details>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleReportFeedback}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Report Problem
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Homepage
                  </button>
                </div>

                {/* Event ID (for support) */}
                {this.state.eventId && (
                  <div className="mt-6 text-xs text-gray-500">
                    Error ID: {this.state.eventId}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper
export function withSentryErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryOptions?: Omit<Props, 'children'>
) {
  const WrappedWithErrorBoundary = (props: P) => (
    <SentryErrorBoundary {...errorBoundaryOptions}>
      <WrappedComponent {...props} />
    </SentryErrorBoundary>
  );

  WrappedWithErrorBoundary.displayName = `withSentryErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WrappedWithErrorBoundary;
}

// Hook for functional components
export function useSentryErrorHandler() {
  const captureError = React.useCallback((error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('errorContext', context);
      }
      scope.setTag('source', 'useErrorHandler');
      Sentry.captureException(error);
    });
  }, []);

  const captureMessage = React.useCallback((message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
  }, []);

  return { captureError, captureMessage };
}