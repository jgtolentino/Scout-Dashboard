// Widget registry for v7 system with Figma components
import React from 'react';
import ScorecardList from './ScorecardList';
import { RegionSelector } from './RegionSelector';
import { StockChart } from './StockChart';
import { TradingView } from './TradingView';
import { FinancialMetrics } from './FinancialMetrics';
import { InteractiveChart } from './InteractiveChart';
import { DataVisualizationKit } from './DataVisualizationKit';
import { ResponsiveChart } from './ResponsiveChart';

// Real widget components
export { default as ScorecardList } from './ScorecardList';
export { RegionSelector } from './RegionSelector';
export { StockChart } from './StockChart';
export { TradingView } from './TradingView';
export { FinancialMetrics } from './FinancialMetrics';
export { InteractiveChart } from './InteractiveChart';
export { DataVisualizationKit } from './DataVisualizationKit';
export { ResponsiveChart } from './ResponsiveChart';

// Placeholder components for widgets that need implementation
export const LineChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Line Chart'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500' }, 'Line Chart - Ready for implementation')
);

export const BarChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Bar Chart'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500' }, 'Bar Chart - Ready for implementation')
);

export const Table = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Table'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500' }, 'Table - Ready for implementation')
);

export const Donut = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Donut Chart'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500' }, 'Donut Chart - Ready for implementation')
);

export const Heatmap = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Heatmap'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500' }, 'Heatmap - Ready for implementation')
);

export const Map = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Map'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500' }, 'Map - Ready for implementation')
);

// Advanced Figma-inspired chart components (placeholders ready for implementation)
export const CandlestickChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-green-50 to-red-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Candlestick Chart'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '📈'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, 'Financial OHLC Data')
    )
  )
);

export const TreemapChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-blue-50 to-purple-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Treemap'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '🗺️'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, 'Hierarchical Data')
    )
  )
);

export const SankeyChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-teal-50 to-cyan-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Sankey Diagram'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '🌊'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, 'Flow Analysis')
    )
  )
);

export const RadarChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-indigo-50 to-purple-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Radar Chart'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '🎯'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, 'Multi-dimensional')
    )
  )
);

export const BubbleChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-pink-50 to-rose-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Bubble Chart'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '🫧'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, '3D Correlations')
    )
  )
);

export const WaterfallChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-emerald-50 to-teal-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Waterfall Chart'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '💧'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, 'Cumulative Impact')
    )
  )
);

export const GanttChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-orange-50 to-amber-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Gantt Chart'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '📊'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, 'Timeline Planning')
    )
  )
);

export const NetworkChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded bg-gradient-to-br from-violet-50 to-purple-50' },
  React.createElement('h3', { className: 'font-semibold mb-2 text-gray-800' }, props?.title || 'Network Graph'),
  React.createElement('div', { className: 'h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'text-2xl mb-1' }, '🕸️'),
      React.createElement('div', { className: 'text-sm text-gray-600' }, 'Relationship Mapping')
    )
  )
);

// Enhanced widget registry with Figma & Stockbot components
export const WIDGETS = {
  // Core charts
  'line-chart': LineChart,
  'bar-chart': BarChart,
  'table': Table,
  'donut': Donut,
  'heatmap': Heatmap,
  'map': Map,
  
  // Scout components
  'scorecard-list': ScorecardList,
  'region-selector': RegionSelector,
  
  // Financial/Stockbot-style components
  'stock-chart': StockChart,
  'trading-view': TradingView,
  'financial-metrics': FinancialMetrics,
  'interactive-chart': InteractiveChart,
  
  // Figma Data Visualization Kit
  'data-viz-kit': DataVisualizationKit,
  'responsive-chart': ResponsiveChart,
  
  // Advanced chart types
  'candlestick': CandlestickChart,
  'treemap': TreemapChart,
  'sankey': SankeyChart,
  'radar': RadarChart,
  'bubble': BubbleChart,
  'waterfall': WaterfallChart,
  'gantt': GanttChart,
  'network': NetworkChart,
};