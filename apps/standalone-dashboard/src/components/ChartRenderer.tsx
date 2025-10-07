import React from 'react';
import { ChartConfig } from '@/types';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';

interface ChartRendererProps {
  config: ChartConfig;
  height?: number;
}

export default function ChartRenderer({ config, height }: ChartRendererProps) {
  switch (config.type) {
    case 'line':
      return <LineChart config={config} height={height} />;
    case 'bar':
      return <BarChart config={config} height={height} />;
    case 'pie':
      return <PieChart config={config} height={height} />;
    default:
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500">Chart type "{config.type}" not implemented yet</p>
        </div>
      );
  }
}