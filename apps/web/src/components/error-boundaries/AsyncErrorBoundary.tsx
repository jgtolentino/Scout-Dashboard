import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Wifi, RefreshCw, Clock } from 'lucide-react';

interface AsyncErrorBoundaryState {
  hasError: boolean;
  isRetrying: boolean;
  retryCount: number;
  error?: Error;
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Async Error boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = async (): Promise<void> => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        isRetrying: false,
        retryCount: this.state.retryCount + 1,
        error: undefined
      });
    }, retryDelay);
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      isRetrying: false,
      retryCount: 0,
      error: undefined
    });
  };

  render(): ReactNode {
    const { maxRetries = 3 } = this.props;
    const { hasError, isRetrying, retryCount, error } = this.state;

    if (hasError) {
      const canRetry = retryCount < maxRetries;
      const isNetworkError = error?.message?.includes('fetch') || 
                            error?.message?.includes('network') ||
                            error?.message?.includes('Failed to fetch');

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              {isNetworkError ? (
                <Wifi className="text-blue-600" size={20} />
              ) : (
                <Clock className="text-blue-600" size={20} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-800">
                {isNetworkError ? 'Connection Issue' : 'Loading Error'}
              </h3>
              <p className="text-sm text-blue-600">
                {isNetworkError 
                  ? 'Check your internet connection'
                  : 'Something went wrong while loading'
                }
              </p>
            </div>
          </div>

          {retryCount > 0 && (
            <p className="text-blue-700 text-sm mb-4">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          )}

          <div className="flex gap-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            
            <button
              onClick={this.handleReset}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Reset
            </button>
          </div>

          {!canRetry && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">
                Maximum retry attempts reached. Please refresh the page or contact support.
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default AsyncErrorBoundary;