import React, { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from './ui/Skeleton';

// Lazy load chart components
export const TransactionTrendsLazy = lazy(() => import('./charts/TransactionTrends'));
export const ProductMixChartLazy = lazy(() => import('./charts/ProductMixChart'));
export const BrandPerformanceLazy = lazy(() => import('./charts/BrandPerformance'));
export const RegionalHeatMapLazy = lazy(() => import('./charts/RegionalHeatMap'));
export const TimeHeatMapLazy = lazy(() => import('./charts/TimeHeatMap'));
export const AIInsightsPanelLazy = lazy(() => import('./charts/AIInsightsPanel'));

// Lazy load AI chat components
export const ChatInterfaceLazy = lazy(() => import('./ai-chat/ChatInterface'));
export const ChatInputLazy = lazy(() => import('./ai-chat/ChatInput'));

// Lazy load shared widgets
export const ChoroplethMapLazy = lazy(() => import('../shared/widgets/ChoroplethMap'));
export const CompetitiveTableLazy = lazy(() => import('../shared/widgets/CompetitiveTable'));

// Custom loading fallbacks for different component types
const ChartSkeleton = () => (
  <div className="glass-panel rounded-lg p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
      <div className="h-64 bg-gray-100 rounded mb-4"></div>
      <div className="flex gap-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

const ChatSkeleton = () => (
  <div className="glass-panel rounded-lg p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-10 bg-gray-100 rounded"></div>
    </div>
  </div>
);

const MapSkeleton = () => (
  <div className="glass-panel rounded-lg p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
      <div className="h-96 bg-gray-100 rounded mb-4"></div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
      </div>
    </div>
  </div>
);

// Higher-order component for lazy loading with custom skeletons
function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback: React.ReactElement = <Skeleton />
) {
  return function LazyComponent(props: T) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Export wrapped components with appropriate skeletons
export const TransactionTrends = withLazyLoading(TransactionTrendsLazy, <ChartSkeleton />);
export const ProductMixChart = withLazyLoading(ProductMixChartLazy, <ChartSkeleton />);
export const BrandPerformance = withLazyLoading(BrandPerformanceLazy, <ChartSkeleton />);
export const RegionalHeatMap = withLazyLoading(RegionalHeatMapLazy, <ChartSkeleton />);
export const TimeHeatMap = withLazyLoading(TimeHeatMapLazy, <ChartSkeleton />);
export const AIInsightsPanel = withLazyLoading(AIInsightsPanelLazy, <ChartSkeleton />);

export const ChatInterface = withLazyLoading(ChatInterfaceLazy, <ChatSkeleton />);
export const ChatInput = withLazyLoading(ChatInputLazy, <ChatSkeleton />);

export const ChoroplethMap = withLazyLoading(ChoroplethMapLazy, <MapSkeleton />);
export const CompetitiveTable = withLazyLoading(CompetitiveTableLazy, <ChartSkeleton />);

// Export the HOC for other components
export { withLazyLoading };

// Preload critical components on idle
export const preloadCriticalComponents = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      TransactionTrendsLazy.preload?.();
      ProductMixChartLazy.preload?.();
      BrandPerformanceLazy.preload?.();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      TransactionTrendsLazy.preload?.();
      ProductMixChartLazy.preload?.();
      BrandPerformanceLazy.preload?.();
    }, 100);
  }
};

// Component to trigger preloading
export const ComponentPreloader: React.FC = () => {
  React.useEffect(() => {
    preloadCriticalComponents();
  }, []);
  
  return null;
};