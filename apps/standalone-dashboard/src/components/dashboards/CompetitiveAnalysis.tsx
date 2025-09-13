import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { scaleLinear, scaleBand, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { ParentSize } from '@visx/responsive';
import { Arc, Pie } from '@visx/shape';
import { HeatmapRect } from '@visx/heatmap';
import { curveBasis } from '@visx/curve';
import { 
  TrendingUp, 
  Award, 
  Target, 
  ArrowRightLeft,
  Download,
  Eye,
  EyeOff 
} from 'lucide-react';
import { ChartErrorBoundary } from '../ErrorBoundary';
import useDataStore from '@/store/dataStore';

interface CompetitiveAnalysisProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
}

export default function CompetitiveAnalysis({ filters }: CompetitiveAnalysisProps) {
  const { datasets } = useDataStore();
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  // Brand performance trends over time
  const brandTrends = useMemo(() => {
    const brands = ['Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'P&G', 'Oishi'];
    const timePoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return brands.map(brand => ({
      brand,
      data: timePoints.map((date, i) => ({
        date,
        x: i,
        gmv: Math.floor(Math.random() * 50000) + 30000 + 
             (brand === 'Coca-Cola' ? 20000 : 0) + // Market leader boost
             (Math.sin(i / 5) * 10000), // Some variation
      })),
    }));
  }, [filters]);

  // Market share distribution (donut chart)
  const marketShareData = useMemo(() => {
    return [
      { brand: 'Coca-Cola', value: 28.5, revenue: 425000 },
      { brand: 'Pepsi', value: 19.2, revenue: 287000 },
      { brand: 'Nestle', value: 15.8, revenue: 236000 },
      { brand: 'Unilever', value: 12.3, revenue: 184000 },
      { brand: 'P&G', value: 8.7, revenue: 130000 },
      { brand: 'Oishi', value: 6.9, revenue: 103000 },
      { brand: 'Others', value: 8.6, revenue: 128000 },
    ];
  }, [filters]);

  // Brand substitution flows
  const substitutionData = useMemo(() => {
    return [
      { from: 'Coca-Cola', to: 'Pepsi', volume: 1250, percentage: 15.2 },
      { from: 'Coca-Cola', to: 'RC Cola', volume: 890, percentage: 10.8 },
      { from: 'Pepsi', to: 'Coca-Cola', volume: 1080, percentage: 13.1 },
      { from: 'Pepsi', to: 'Sprite', volume: 720, percentage: 8.7 },
      { from: 'Marlboro', to: 'Philip Morris', volume: 650, percentage: 7.9 },
      { from: 'Safeguard', to: 'Palmolive', volume: 580, percentage: 7.0 },
      { from: 'Lucky Me', to: 'Payless', volume: 520, percentage: 6.3 },
      { from: 'Tide', to: 'Surf', volume: 460, percentage: 5.6 },
    ];
  }, [filters]);

  // Brand-category affinity heatmap
  const affinityData = useMemo(() => {
    const brands = ['Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'P&G', 'Oishi'];
    const categories = ['Beverages', 'Snacks', 'Personal Care', 'Household'];
    
    return brands.map((brand, brandIndex) =>
      categories.map((category, categoryIndex) => ({
        brand,
        category,
        brandIndex,
        categoryIndex,
        affinity: Math.random() * 100,
        // Higher affinity for logical brand-category pairs
        ...(brand === 'Coca-Cola' && category === 'Beverages' ? { affinity: 95 } : {}),
        ...(brand === 'Oishi' && category === 'Snacks' ? { affinity: 88 } : {}),
        ...(brand === 'Unilever' && category === 'Personal Care' ? { affinity: 92 } : {}),
        ...(brand === 'P&G' && category === 'Household' ? { affinity: 90 } : {}),
      }))
    ).flat();
  }, [filters]);

  const toggleBrand = (brand: string) => {
    const newSelected = new Set(selectedBrands);
    if (newSelected.has(brand)) {
      newSelected.delete(brand);
    } else {
      newSelected.add(brand);
    }
    setSelectedBrands(newSelected);
  };

  const handleExport = (chartType: string, format: 'png' | 'csv') => {
    console.log(`Exporting ${chartType} as ${format}`);
  };

  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Competitive Analysis</h2>
        <p className="text-gray-600 mt-1">
          Brand performance comparison, market share analysis, and competitive intelligence
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Market Leader</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">Coca-Cola</p>
              <p className="text-xs text-green-600 mt-1">28.5% market share</p>
            </div>
            <Award className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fastest Growing</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">Oishi</p>
              <p className="text-xs text-green-600 mt-1">+23.4% growth</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Substitution Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">15.2%</p>
              <p className="text-xs text-amber-600 mt-1">When out of stock</p>
            </div>
            <ArrowRightLeft className="text-amber-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Brand Loyalty</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">72.8%</p>
              <p className="text-xs text-dashboard-600 mt-1">Average retention</p>
            </div>
            <Target className="text-dashboard-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand GMV Trends */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Brand GMV Trends (30 Days)</h3>
            <button
              onClick={() => handleExport('brand-trends', 'png')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          {/* Brand toggles */}
          <div className="flex flex-wrap gap-2 mb-4">
            {brandTrends.map((brand, index) => (
              <button
                key={brand.brand}
                onClick={() => toggleBrand(brand.brand)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedBrands.has(brand.brand) || selectedBrands.size === 0
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                {brand.brand}
                {selectedBrands.has(brand.brand) ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </button>
            ))}
          </div>

          <ChartErrorBoundary>
            <ParentSize>
              {({ width }) => {
                const height = 300;
                const margin = { top: 20, right: 20, bottom: 40, left: 60 };
                const xMax = width - margin.left - margin.right;
                const yMax = height - margin.top - margin.bottom;

                const allData = brandTrends.flatMap(brand => brand.data);
                const xScale = scaleLinear({
                  range: [0, xMax],
                  domain: [0, 29],
                });

                const yScale = scaleLinear({
                  range: [yMax, 0],
                  domain: [0, Math.max(...allData.map(d => d.gmv)) * 1.1],
                });

                const visibleBrands = selectedBrands.size === 0 
                  ? brandTrends 
                  : brandTrends.filter(brand => selectedBrands.has(brand.brand));

                return (
                  <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                      <GridRows
                        scale={yScale}
                        width={xMax}
                        strokeDasharray="3,3"
                        stroke="#e5e7eb"
                      />
                      
                      {visibleBrands.map((brand, index) => (
                        <LinePath
                          key={brand.brand}
                          data={brand.data}
                          x={(d) => xScale(d.x) ?? 0}
                          y={(d) => yScale(d.gmv) ?? 0}
                          stroke={colors[brandTrends.indexOf(brand) % colors.length]}
                          strokeWidth={3}
                          curve={curveBasis}
                        />
                      ))}

                      <AxisBottom
                        top={yMax}
                        scale={xScale}
                        stroke="#6b7280"
                        tickStroke="#6b7280"
                        tickFormat={(value) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (29 - value));
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                        numTicks={6}
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
                        tickFormat={(value) => `₱${(value / 1000).toFixed(0)}K`}
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

        {/* Market Share Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Market Share Distribution</h3>
            <button
              onClick={() => handleExport('market-share', 'png')}
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

                return (
                  <div className="flex items-center">
                    <svg width={width * 0.6} height={height}>
                      <Group top={centerY} left={centerX * 0.6}>
                        <Pie
                          data={marketShareData}
                          pieValue={(d) => d.value}
                          pieSortValues={() => -1}
                          outerRadius={radius}
                          innerRadius={radius * 0.6}
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
                        {marketShareData.map((item, index) => (
                          <div key={item.brand} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <span>{item.brand}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{item.value}%</div>
                              <div className="text-xs text-gray-500">
                                ₱{(item.revenue / 1000).toFixed(0)}K
                              </div>
                            </div>
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

        {/* Brand Substitution Flows */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Brand Substitution Flows</h3>
            <button
              onClick={() => handleExport('substitution', 'png')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {substitutionData.map((flow, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">{flow.from}</span>
                  <ArrowRightLeft size={16} className="text-gray-400" />
                  <span className="text-gray-600">{flow.to}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{flow.volume} switches</div>
                    <div className="text-xs text-gray-500">{flow.percentage}% rate</div>
                  </div>
                  <div 
                    className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                  >
                    <div 
                      className="h-full bg-dashboard-500 transition-all duration-300"
                      style={{ width: `${flow.percentage * 5}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brand-Category Affinity Heatmap */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Brand-Category Affinity</h3>
            <button
              onClick={() => handleExport('affinity', 'png')}
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
                const margin = { top: 20, right: 20, bottom: 60, left: 80 };
                const xMax = width - margin.left - margin.right;
                const yMax = height - margin.top - margin.bottom;

                const brands = ['Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'P&G', 'Oishi'];
                const categories = ['Beverages', 'Snacks', 'Personal Care', 'Household'];

                const cellWidth = xMax / categories.length;
                const cellHeight = yMax / brands.length;

                const maxAffinity = Math.max(...affinityData.map(d => d.affinity));
                const colorScale = scaleLinear({
                  range: ['#f7f7f7', '#1FA8C9'],
                  domain: [0, maxAffinity],
                });

                return (
                  <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                      {affinityData.map((d) => (
                        <rect
                          key={`affinity-${d.brand}-${d.category}`}
                          x={d.categoryIndex * cellWidth}
                          y={d.brandIndex * cellHeight}
                          width={cellWidth - 1}
                          height={cellHeight - 1}
                          fill={colorScale(d.affinity)}
                          stroke="#ffffff"
                          strokeWidth={1}
                        />
                      ))}

                      {/* Category labels */}
                      {categories.map((category, i) => (
                        <text
                          key={`category-${category}`}
                          x={i * cellWidth + cellWidth / 2}
                          y={yMax + 20}
                          textAnchor="middle"
                          fontSize={11}
                          fill="#6b7280"
                        >
                          {category}
                        </text>
                      ))}

                      {/* Brand labels */}
                      {brands.map((brand, i) => (
                        <text
                          key={`brand-${brand}`}
                          x={-10}
                          y={i * cellHeight + cellHeight / 2}
                          textAnchor="end"
                          dominantBaseline="middle"
                          fontSize={11}
                          fill="#6b7280"
                        >
                          {brand}
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