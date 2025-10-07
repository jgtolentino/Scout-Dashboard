import React, { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import { ChartConfig } from '@/types';
import useDataStore from '@/store/dataStore';
import { aggregateData } from '@/utils/dataProcessing';
import { format } from 'date-fns';

interface LineChartProps {
  config: ChartConfig;
  height?: number;
}

export default function LineChart({ config, height = 400 }: LineChartProps) {
  const { datasets } = useDataStore();
  
  const chartData = useMemo(() => {
    const dataset = datasets.find(d => d.id === config.datasetId);
    if (!dataset) return [];
    
    let processedData = [...dataset.data];
    
    // Apply filters
    if (config.filters && config.filters.length > 0) {
      config.filters.forEach(filter => {
        processedData = processedData.filter(row => {
          const value = row[filter.column];
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'greater_than':
              return Number(value) > Number(filter.value);
            case 'less_than':
              return Number(value) < Number(filter.value);
            default:
              return true;
          }
        });
      });
    }
    
    // Aggregate if needed
    if (config.groupBy && config.yAxis && config.aggregation) {
      processedData = aggregateData(
        processedData,
        config.groupBy,
        Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis,
        config.aggregation
      );
    }
    
    // Sort by X axis
    if (config.xAxis) {
      processedData.sort((a, b) => {
        const aVal = a[config.xAxis!];
        const bVal = b[config.xAxis!];
        
        // Try to parse as dates first
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return aDate.getTime() - bDate.getTime();
        }
        
        // Then as numbers
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // Finally as strings
        return String(aVal).localeCompare(String(bVal));
      });
    }
    
    return processedData;
  }, [datasets, config]);

  const formatXAxisTick = (value: any) => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM dd');
    }
    return value;
  };

  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold mb-4">{config.title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={config.xAxis}
            tickFormatter={formatXAxisTick}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          {chartData.length > 50 && <Brush dataKey={config.xAxis} height={30} stroke="#0ea5e9" />}
          
          {config.yAxis && (Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis]).map((yField, index) => (
            <Line
              key={yField}
              type="monotone"
              dataKey={yField}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], r: 3 }}
              activeDot={{ r: 6 }}
            />
          ))}
          
          {/* Add reference lines for mean */}
          {config.options?.showMean && config.yAxis && (
            <ReferenceLine
              y={chartData.reduce((sum, d) => sum + (d[Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis] || 0), 0) / chartData.length}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label="Mean"
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}