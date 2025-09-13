// Widget registry for v7 system
import React from 'react';

// Basic widget components
export const LineChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Line Chart'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center' }, 'Line Chart Placeholder')
);

export const BarChart = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Bar Chart'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center' }, 'Bar Chart Placeholder')
);

export const Table = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Table'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center' }, 'Table Placeholder')
);

export const ScorecardList = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Scorecards'),
  React.createElement('div', { className: 'flex gap-4' }, 
    React.createElement('div', { className: 'bg-blue-100 p-2 rounded' }, 'KPI 1'),
    React.createElement('div', { className: 'bg-green-100 p-2 rounded' }, 'KPI 2'),
    React.createElement('div', { className: 'bg-yellow-100 p-2 rounded' }, 'KPI 3')
  )
);

export const RegionSelector = ({ props }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Region'),
  React.createElement('select', { className: 'w-full p-2 border rounded' }, 
    React.createElement('option', {}, 'All Regions'),
    React.createElement('option', {}, 'North'),
    React.createElement('option', {}, 'South')
  )
);

export const Donut = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Donut Chart'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center' }, 'Donut Chart Placeholder')
);

export const Heatmap = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Heatmap'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center' }, 'Heatmap Placeholder')
);

export const Map = ({ props, data }: any) => React.createElement('div', { className: 'p-4 border rounded' }, 
  React.createElement('h3', { className: 'font-semibold mb-2' }, props?.title || 'Map'),
  React.createElement('div', { className: 'h-32 bg-gray-100 rounded flex items-center justify-center' }, 'Map Placeholder')
);

// Widget registry
export const WIDGETS = {
  'line-chart': LineChart,
  'bar-chart': BarChart,
  'table': Table,
  'scorecard-list': ScorecardList,
  'region-selector': RegionSelector,
  'donut': Donut,
  'heatmap': Heatmap,
  'map': Map,
};