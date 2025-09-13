import React, { ReactNode } from 'react';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  queryName?: string;
  onRetry?: () => void;
}

const QueryFallback: React.FC<{ queryName?: string; onRetry?: () => void }> = ({ 
  queryName, 
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center p-6 bg-orange-50 border border-orange-200 rounded-lg">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-orange-100 rounded-full">
        <Database className="text-orange-600" size={20} />
      </div>
      <div>
        <h3 className="text-base font-medium text-orange-800">
          Data Loading Failed
        </h3>
        {queryName && (
          <p className="text-sm text-orange-600">{queryName}</p>
        )}
      </div>
    </div>
    
    <div className="flex items-start gap-2 mb-4">
      <AlertCircle className="text-orange-500 mt-0.5" size={16} />
      <p className="text-orange-700 text-sm text-center max-w-sm">
        Unable to fetch data from the server. Please check your connection and try again.
      </p>
    </div>

    <button
      onClick={onRetry || (() => window.location.reload())}
      className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
    >
      <RefreshCw size={14} />
      Retry Query
    </button>
  </div>
);

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({ 
  children, 
  queryName,
  onRetry 
}) => {
  return (
    <ErrorBoundary
      fallbackComponent={<QueryFallback queryName={queryName} onRetry={onRetry} />}
      onError={(error, errorInfo) => {
        // Log query-specific errors
        console.error(`Query Error in ${queryName || 'Unknown Query'}:`, error);
        
        // Could send to monitoring service
        // monitoring.captureException(error, {
        //   tags: {
        //     component: 'query',
        //     query_name: queryName
        //   },
        //   extra: {
        //     component_stack: errorInfo.componentStack
        //   }
        // });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default QueryErrorBoundary;