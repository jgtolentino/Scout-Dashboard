import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { BarChart, Bar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { ParentSize } from '@visx/responsive';
import { HeatmapRect } from '@visx/heatmap';
import { Arc } from '@visx/shape';
import { Pie } from '@visx/shape';
import { LinePath } from '@visx/shape';
import { curveBasis } from '@visx/curve';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  ArrowUp, 
  ArrowDown,
  Download 
} from 'lucide-react';
import { ChartErrorBoundary } from '../ErrorBoundary';
import useDataStore from '@/store/dataStore';

interface DashboardOverviewProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
}

export default function DashboardOverview({ filters }: DashboardOverviewProps) {
  const { datasets } = useDataStore();

  // Generate executive KPI data
  const kpiData = useMemo(() => {
    const salesData = datasets.find(d => d.id === 'sales-data')?.data || [];
    const totalRevenue = salesData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalTransactions = salesData.length;
    const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalUnits = salesData.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const avgUnitsPerTx = totalTransactions > 0 ? totalUnits / totalTransactions : 0;

    return {
      gmv: { value: totalRevenue, change: 12.5, trend: 'up' as const },
      transactions: { value: totalTransactions, change: 8.3, trend: 'up' as const },
      avgBasket: { value: avgBasket, change: 3.8, trend: 'up' as const },
      avgUnitsPerTx: { value: avgUnitsPerTx, change: -1.2, trend: 'down' as const }
    };
  }, [datasets, filters]);

  // Generate 30-day trend data
  const trendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        transactions: Math.floor(Math.random() * 800) + 500 + i * 10,
        gmv: Math.floor(Math.random() * 120000) + 80000 + i * 2000,
        x: i,
      };
    });
  }, [filters]);

  // Generate category performance data
  const categoryData = useMemo(() => {
    const categories = ['Beverages', 'Snacks', 'Personal Care', 'Household', 'Tobacco'];
    return categories.map(category => ({
      category,
      value: Math.floor(Math.random() * 500000) + 100000,
      transactions: Math.floor(Math.random() * 5000) + 2000,
    })).sort((a, b) => b.value - a.value);
  }, [filters]);

  // Generate brand market share data (donut chart data)
  const brandData = useMemo(() => {
    const brands = [
      'Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'P&G', 
      'Oishi', 'Jack n Jill', 'Lucky Me', 'San Miguel', 'Rebisco'
    ];
    
    const data = brands.slice(0, 8).map((brand, index) => ({
      label: brand,
      value: Math.floor(Math.random() * 300000) + 50000 * (8 - index),
    }));

    // Add "Others" category
    data.push({
      label: 'Others',
      value: Math.floor(Math.random() * 200000) + 100000,
    });

    return data;
  }, [filters]);

  // Generate hourly heatmap data
  const heatmapData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return days.map((day, dayIndex) => 
      hours.map((hour) => ({
        day,
        hour,
        dayIndex,
        value: Math.floor(Math.random() * 100) + 20 + 
               (hour >= 6 && hour <= 10 ? 30 : 0) + // Morning boost
               (hour >= 17 && hour <= 21 ? 40 : 0) + // Evening boost
               (dayIndex >= 5 ? 20 : 0), // Weekend boost
      }))
    ).flat();
  }, [filters]);

  const handleExport = (chartType: string, format: 'png' | 'csv') => {
    console.log(`Exporting ${chartType} as ${format}`);
    // Export functionality will be implemented separately
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Executive Overview</h2>
        <p className="text-gray-600 mt-1">
          Key performance indicators and business metrics overview
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Merchandise Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{(kpiData.gmv.value / 1000).toFixed(1)}K
              </p>
              <div className="flex items-center mt-1">
                {kpiData.gmv.trend === 'up' ? (
                  <ArrowUp className="text-green-500" size={16} />
                ) : (
                  <ArrowDown className="text-red-500" size={16} />
                )}
                <span className={`text-sm ml-1 ${
                  kpiData.gmv.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpiData.gmv.change}%
                </span>
              </div>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {kpiData.transactions.value.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUp className="text-green-500" size={16} />
                <span className="text-sm ml-1 text-green-600">
                  {kpiData.transactions.change}%
                </span>
              </div>
            </div>
            <ShoppingCart className="text-dashboard-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Basket Size</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{kpiData.avgBasket.value.toFixed(0)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUp className="text-green-500" size={16} />
                <span className="text-sm ml-1 text-green-600">
                  {kpiData.avgBasket.change}%
                </span>
              </div>
            </div>
            <TrendingUp className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Items per Transaction</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {kpiData.avgUnitsPerTx.value.toFixed(1)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowDown className="text-red-500" size={16} />
                <span className="text-sm ml-1 text-red-600">
                  {Math.abs(kpiData.avgUnitsPerTx.change)}%
                </span>
              </div>
            </div>
            <Package className="text-amber-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction & GMV Trends */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transaction & GMV Trends (30 Days)</h3>
            <button
              onClick={() => handleExport('trends', 'png')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <ChartErrorBoundary>
            <ParentSize>
              {({ width }) => {
                const height = 300;
                const margin = { top: 20, right: 60, bottom: 40, left: 60 };
                const xMax = width - margin.left - margin.right;
                const yMax = height - margin.top - margin.bottom;

                const xScale = scaleBand({
                  range: [0, xMax],
                  domain: trendData.map(d => d.date),
                  padding: 0.1,
                });

                const transactionScale = scaleLinear({
                  range: [yMax, 0],
                  domain: [0, Math.max(...trendData.map(d => d.transactions))],
                });

                const gmvScale = scaleLinear({
                  range: [yMax, 0],
                  domain: [0, Math.max(...trendData.map(d => d.gmv))],
                });

                return (
                  <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                      <GridRows
                        scale={transactionScale}
                        width={xMax}
                        strokeDasharray="3,3"
                        stroke="#e5e7eb"
                      />
                      
                      {/* Transaction bars */}
                      {trendData.map((d) => {
                        const barHeight = yMax - (transactionScale(d.transactions) ?? 0);
                        return (
                          <Bar
                            key={`bar-${d.date}`}
                            x={xScale(d.date)}
                            y={yMax - barHeight}
                            width={xScale.bandwidth()}
                            height={barHeight}
                            fill="#0ea5e9"
                            opacity={0.7}
                          />
                        );
                      })}

                      {/* GMV line */}
                      <LinePath
                        data={trendData}
                        x={(d) => (xScale(d.date) ?? 0) + xScale.bandwidth() / 2}
                        y={(d) => gmvScale(d.gmv) ?? 0}
                        stroke="#10b981"
                        strokeWidth={3}
                        curve={curveBasis}
                      />

                      <AxisBottom
                        top={yMax}
                        scale={xScale}
                        stroke="#6b7280"
                        tickStroke="#6b7280"
                        tickLabelProps={() => ({
                          fill: '#6b7280',
                          fontSize: 11,
                          textAnchor: 'middle',
                        })}
                      />
                      
                      <AxisLeft
                        scale={transactionScale}
                        stroke="#6b7280"
                        tickStroke="#6b7280"
                        tickLabelProps={() => ({
                          fill: '#6b7280',
                          fontSize: 11,
                          textAnchor: 'end',
                        })}
                      />
                    </Group>
                  </svg>
                );
              }}
            </ParentSize>
          </ChartErrorBoundary>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Category Performance</h3>
            <button
              onClick={() => handleExport('category', 'png')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <ChartErrorBoundary>
            <ParentSize>
              {({ width }) => {
                const height = 300;
                const margin = { top: 20, right: 60, bottom: 40, left: 120 };
                const xMax = width - margin.left - margin.right;
                const yMax = height - margin.top - margin.bottom;

                // Horizontal bar chart: swap x and y scales
                const yScale = scaleBand({
                  range: [0, yMax],
                  domain: categoryData.map(d => d.category),
                  padding: 0.2,
                });

                const xScale = scaleLinear({
                  range: [0, xMax],
                  domain: [0, Math.max(...categoryData.map(d => d.value))],
                });

                const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

                return (
                  <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                      <GridRows
                        scale={xScale}
                        width={xMax}
                        height={yMax}
                        strokeDasharray="3,3"
                        stroke="#e5e7eb"
                        numTicks={5}
                      />
                      
                      {categoryData.map((d, i) => {
                        const barWidth = xScale(d.value) ?? 0;
                        const barY = yScale(d.category) ?? 0;
                        const barHeight = yScale.bandwidth();
                        
                        return (
                          <g key={`bar-${d.category}`}>
                            <Bar
                              x={0}
                              y={barY}
                              width={barWidth}
                              height={barHeight}
                              fill={colors[i % colors.length]}
                              rx={4}
                            />
                            {/* Label inside bar */}
                            <text
                              x={barWidth - 10}
                              y={barY + barHeight / 2}
                              textAnchor="end"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize={12}
                              fontWeight="600"
                            >
                              {d.category}
                            </text>
                            {/* Value label */}
                            <text
                              x={barWidth + 5}
                              y={barY + barHeight / 2}
                              textAnchor="start"
                              dominantBaseline="middle"
                              fill="#6b7280"
                              fontSize={11}
                              fontWeight="500"
                            >
                              ₱{(d.value / 1000).toFixed(0)}K
                            </text>
                          </g>
                        );
                      })}

                      <AxisBottom
                        top={yMax}
                        scale={xScale}
                        stroke="#6b7280"
                        tickStroke="#6b7280"
                        tickFormat={(value) => `₱${(value / 1000).toFixed(0)}K`}
                        tickLabelProps={() => ({
                          fill: '#6b7280',
                          fontSize: 11,
                          textAnchor: 'middle',
                        })}
                      />
                      
                      <AxisLeft
                        scale={yScale}
                        stroke="#6b7280"
                        tickStroke="#6b7280"
                        hideAxisLine={true}
                        hideTicks={true}
                        tickLabelProps={() => ({
                          fill: 'transparent',
                          fontSize: 0,
                        })}
                      />
                    </Group>
                  </svg>
                );
              }}
            </ParentSize>
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Market Share - Donut Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Brand Market Share</h3>
            <button
              onClick={() => handleExport('brand-share', 'png')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <ChartErrorBoundary>
            <ParentSize>
              {({ width }) => {
                const height = 300;
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(width, height) / 2 - 40;
                const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6b7280'];

                return (
                  <div className="flex items-center">
                    <svg width={width * 0.6} height={height}>
                      <Group top={centerY} left={centerX * 0.6}>
                        <Pie
                          data={brandData}
                          pieValue={(d) => d.value}
                          pieSortValues={() => -1}
                          outerRadius={radius}
                          innerRadius={radius * 0.6} // Creates donut effect
                        >
                          {(pie) => {
                            return pie.arcs.map((arc, index) => {
                              return (
                                <g key={`arc-${index}`}>
                                  <Arc
                                    arc={arc}
                                    fill={colors[index % colors.length]}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                  />
                                </g>
                              );
                            });
                          }}
                        </Pie>
                      </Group>
                    </svg>
                    
                    {/* Legend */}
                    <div className="flex-1 pl-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {brandData.map((brand, index) => (
                          <div key={brand.label} className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="flex-1">{brand.label}</span>
                            <span className="font-medium">
                              ₱{(brand.value / 1000).toFixed(0)}K
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }}
            </ParentSize>
          </ChartErrorBoundary>
        </div>

        {/* Hourly Transaction Heatmap */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Hourly Transaction Heatmap</h3>
            <button
              onClick={() => handleExport('heatmap', 'png')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <ChartErrorBoundary>
            <ParentSize>
              {({ width }) => {
                const height = 300;
                const margin = { top: 20, right: 20, bottom: 40, left: 60 };
                const xMax = width - margin.left - margin.right;
                const yMax = height - margin.top - margin.bottom;

                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const hours = Array.from({ length: 24 }, (_, i) => i);

                const cellWidth = xMax / 24;
                const cellHeight = yMax / 7;

                const maxValue = Math.max(...heatmapData.map(d => d.value));
                const colorScale = scaleLinear({
                  range: ['#f7f7f7', '#1FA8C9'],
                  domain: [0, maxValue],
                });

                return (
                  <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                      <HeatmapRect
                        data={heatmapData}
                        xScale={() => 0}
                        yScale={() => 0}
                        colorScale={colorScale}
                        binWidth={cellWidth}
                        binHeight={cellHeight}
                        gap={1}
                      >
                        {(heatmap) =>
                          heatmap.map((heatmapBins) =>
                            heatmapBins.map((bin) => (
                              <rect
                                key={`heatmap-rect-${bin.row}-${bin.column}`}
                                className="visx-heatmap-rect"
                                width={cellWidth - 1}
                                height={cellHeight - 1}
                                x={bin.column * cellWidth}
                                y={bin.row * cellHeight}
                                fill={colorScale(bin.datum?.value || 0)}
                                stroke="#ffffff"
                                strokeWidth={1}
                              />
                            ))
                          )
                        }
                      </HeatmapRect>

                      {/* Hour labels */}
                      {hours.map((hour, i) => (
                        <text
                          key={`hour-${hour}`}
                          x={i * cellWidth + cellWidth / 2}
                          y={yMax + 20}
                          textAnchor="middle"
                          fontSize={10}
                          fill="#6b7280"
                        >
                          {hour}:00
                        </text>
                      ))}

                      {/* Day labels */}
                      {days.map((day, i) => (
                        <text
                          key={`day-${day}`}
                          x={-10}
                          y={i * cellHeight + cellHeight / 2}
                          textAnchor="end"
                          dominantBaseline="middle"
                          fontSize={11}
                          fill="#6b7280"
                        >
                          {day}
                        </text>
                      ))}
                    </Group>
                  </svg>
                );
              }}
            </ParentSize>
          </ChartErrorBoundary>
        </div>
      </div>
    </div>
  );
}