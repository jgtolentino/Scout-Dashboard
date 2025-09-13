import React, { ReactNode } from 'react';
import { TrendingDown, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartName?: string;
  onRetry?: () => void;
}

const ChartFallback: React.FC<{ chartName?: string; onRetry?: () => void }> = ({ 
  chartName, 
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg min-h-[300px]">
    <div className="flex items-center gap-3 mb-4">
      <TrendingDown className="text-gray-400" size={32} />
      <div>
        <h3 className="text-lg font-medium text-gray-700">
          Chart Unavailable
        </h3>
        {chartName && (
          <p className="text-sm text-gray-500">{chartName}</p>
        )}
      </div>
    </div>
    
    <p className="text-gray-600 mb-4 text-center max-w-sm">
      Unable to load chart data. This could be due to a data processing error or network issue.
    </p>

    <button
      onClick={onRetry || (() => window.location.reload())}
      className="flex items-center gap-2 px-4 py-2 bg-azure-blue text-white rounded-lg hover:bg-azure-blue/90 transition-colors"
    >
      <RefreshCw size={16} />
      Reload Chart
    </button>
  </div>
);

export const ChartErrorBoundary: React.FC<ChartErrorBoundaryProps> = ({ 
  children, 
  chartName,
  onRetry 
}) => {
  return (
    <ErrorBoundary
      fallbackComponent={<ChartFallback chartName={chartName} onRetry={onRetry} />}
      onError={(error, errorInfo) => {
        // Log chart-specific errors
        console.error(`Chart Error in ${chartName || 'Unknown Chart'}:`, error);
        
        // Could send to analytics service
        // analytics.track('chart_error', {
        //   chart_name: chartName,
        //   error_message: error.message,
        //   component_stack: errorInfo.componentStack
        // });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ChartErrorBoundary;