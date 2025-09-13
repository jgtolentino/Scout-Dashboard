import React, { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { ChartConfig } from '@/types';
import useDataStore from '@/store/dataStore';
import { aggregateData } from '@/utils/dataProcessing';

interface BarChartProps {
  config: ChartConfig;
  height?: number;
}

export default function BarChart({ config, height = 400 }: BarChartProps) {
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
    
    // Aggregate data
    if (config.xAxis && config.yAxis && config.aggregation) {
      processedData = aggregateData(
        processedData,
        config.xAxis,
        Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis,
        config.aggregation
      );
    }
    
    // Sort by value for better visualization
    processedData.sort((a, b) => {
      const yField = Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis;
      return (b[yField!] || 0) - (a[yField!] || 0);
    });
    
    // Limit to top N items if specified
    if (config.options?.topN && config.options.topN > 0) {
      processedData = processedData.slice(0, config.options.topN);
    }
    
    return processedData;
  }, [datasets, config]);

  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxisTick = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold mb-4">{config.title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{ top: 20, right: 60, bottom: 20, left: 120 }}
          layout="horizontal"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tickFormatter={formatYAxisTick}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            dataKey={config.xAxis}
            type="category"
            stroke="transparent"
            fontSize={0}
            width={0}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {config.yAxis && (Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis]).map((yField, index) => (
            <Bar
              key={yField}
              dataKey={yField}
              fill={config.color || colors[index % colors.length]}
              radius={[0, 4, 4, 0]}
            >
              {/* Always show category labels inside bars */}
              <LabelList
                dataKey={config.xAxis}
                position="insideLeft"
                fill="white"
                fontSize={12}
                fontWeight={600}
              />
              {/* Show values on the right of bars */}
              <LabelList
                dataKey={yField}
                position="right"
                fill="#6b7280"
                fontSize={11}
                formatter={(value: number) => value.toLocaleString()}
              />
              {config.options?.colorByValue && chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}