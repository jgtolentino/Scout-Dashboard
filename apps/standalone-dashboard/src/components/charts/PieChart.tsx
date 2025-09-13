import React, { useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { ChartConfig } from '@/types';
import useDataStore from '@/store/dataStore';
import { aggregateData } from '@/utils/dataProcessing';

interface PieChartProps {
  config: ChartConfig;
  height?: number;
}

export default function PieChart({ config, height = 400 }: PieChartProps) {
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
    if (config.groupBy && config.yAxis && config.aggregation) {
      processedData = aggregateData(
        processedData,
        config.groupBy,
        Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis,
        config.aggregation
      );
    }
    
    // Sort by value and limit to top items
    processedData.sort((a, b) => {
      const yField = Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis;
      return (b[yField!] || 0) - (a[yField!] || 0);
    });
    
    // Group small values into "Others"
    const threshold = config.options?.threshold || 0.02; // 2% default
    const total = processedData.reduce((sum, d) => {
      const yField = Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis;
      return sum + (d[yField!] || 0);
    }, 0);
    
    const significantData: any[] = [];
    let othersValue = 0;
    
    processedData.forEach(d => {
      const yField = Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis;
      const value = d[yField!] || 0;
      const percentage = value / total;
      
      if (percentage >= threshold && significantData.length < 10) {
        significantData.push({
          name: d[config.groupBy!],
          value: value,
          percentage: (percentage * 100).toFixed(1),
        });
      } else {
        othersValue += value;
      }
    });
    
    if (othersValue > 0) {
      significantData.push({
        name: 'Others',
        value: othersValue,
        percentage: ((othersValue / total) * 100).toFixed(1),
      });
    }
    
    return significantData;
  }, [datasets, config]);

  const colors = [
    '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#fb923c', '#0891b2', '#d946ef',
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Value: {data.value.toLocaleString()}</p>
          <p className="text-sm">Percentage: {data.payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold mb-4">{config.title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={config.options?.showLabels ? renderCustomizedLabel : false}
            outerRadius={config.options?.donut ? 120 : 140}
            innerRadius={config.options?.donut ? 60 : 0}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
            {config.options?.donut && (
              <Label
                value={totalValue.toLocaleString()}
                position="center"
                className="text-2xl font-bold"
              />
            )}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {config.options?.showLegend !== false && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => `${value} (${entry.payload.percentage}%)`}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}