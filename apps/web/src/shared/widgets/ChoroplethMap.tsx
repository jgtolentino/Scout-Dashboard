import React, { useEffect, useRef, useId, useMemo } from 'react';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { 
  TooltipComponent, 
  VisualMapComponent, 
  GeoComponent,
  TitleComponent,
  LegendComponent 
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import phRegions from '../../assets/geo/ph_regions.json';

// Register required components
echarts.use([
  MapChart, 
  TooltipComponent, 
  VisualMapComponent, 
  CanvasRenderer, 
  GeoComponent,
  TitleComponent,
  LegendComponent
]);

// CVD-safe Viridis color palette - perceptually uniform and colorblind-friendly
const VIRIDIS_PALETTE = ['#440154', '#443983', '#31688e', '#21918c', '#35b779', '#8fd744', '#fde725'];

// Color scale modes
type ScaleMode = 'linear' | 'quantile';

type Row = { 
  region: string; 
  revenuePhp: number; 
  growthPct?: number | null; 
  ourSharePct?: number | null; 
  topCompetitor?: string | null; 
  topCompSharePct?: number | null; 
  deltaPct?: number | null;
};

interface ChoroplethMapProps {
  data: Row[];
  title?: string;
  scaleMode?: ScaleMode;
}

const ChoroplethMap: React.FC<ChoroplethMapProps> = ({ data, title, scaleMode = 'linear' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const chartId = useId();
  
  // Generate accessibility summary
  const accessibilitySummary = useMemo(() => {
    if (!data?.length) return 'No regional data available.';
    const totalRevenue = data.reduce((sum, d) => sum + d.revenuePhp, 0);
    const avgMarketShare = data.reduce((sum, d) => sum + (d.ourSharePct || 0), 0) / data.filter(d => d.ourSharePct !== null).length;
    const highestRegion = data.reduce((max, d) => d.revenuePhp > max.revenuePhp ? d : max);
    return `Choropleth map showing revenue data across ${data.length} regions. Total revenue: ₱${totalRevenue.toLocaleString()}. Average market share: ${avgMarketShare.toFixed(1)}%. Highest revenue region: ${highestRegion.region} with ₱${highestRegion.revenuePhp.toLocaleString()}.`;
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);
    
    // Register custom map
    echarts.registerMap('PH', phRegions as any);

    // Prepare data for ECharts
    const mapData = data.map(item => ({
      name: item.region,
      value: item.revenuePhp,
      growth: item.growthPct,
      marketShare: item.ourSharePct,
      competitor: item.topCompetitor,
      competitorShare: item.topCompSharePct,
      delta: item.deltaPct
    }));

    // Configure chart options
    const option: echarts.EChartsOption = {
      title: {
        text: title || 'Revenue by Region',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#6b7280'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data || {};
          return `
            <div style="font-size: 12px;">
              <strong>${params.name}</strong><br/>
              Revenue: ₱${(data.value || 0).toLocaleString()}<br/>
              Growth: ${data.growth !== null ? data.growth + '%' : 'N/A'}<br/>
              Market Share: ${data.marketShare !== null ? data.marketShare + '%' : 'N/A'}<br/>
              ${data.competitor ? `Top Competitor: ${data.competitor} (${data.competitorShare}%)` : ''}
            </div>
          `;
        }
      },
      visualMap: {
        left: 'right',
        min: 0,
        max: Math.max(...data.map(d => d.revenuePhp), 1000000),
        inRange: {
          color: VIRIDIS_PALETTE
        },
        text: ['High', 'Low'],
        calculable: true,
        formatter: (value: number) => '₱' + (value / 1000000).toFixed(1) + 'M',
        // Accessibility: Add title for screen readers
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: 'Revenue',
          type: 'map',
          map: 'PH',
          roam: true,
          emphasis: {
            itemStyle: {
              areaColor: '#fbbf24',
              borderColor: '#f59e0b',
              borderWidth: 2
            },
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            }
          },
          label: {
            show: true,
            fontSize: 10,
            formatter: '{b}'
          },
          itemStyle: {
            borderColor: '#e5e7eb',
            borderWidth: 1
          },
          data: mapData
        }
      ]
    };

    // Set options
    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [data, title]);

  // If no data, show a placeholder
  if (!data || data.length === 0) {
    return (
      <figure className="rounded-lg border p-4" role="img" aria-label="No regional revenue data available">
        <div className="text-sm text-muted-foreground mb-4">{title ?? 'Revenue by Region'}</div>
        <div className="flex items-center justify-center h-[420px] text-gray-400">
          No data available
        </div>
      </figure>
    );
  }

  return (
    <figure 
      className="rounded-lg border bg-white p-4" 
      aria-labelledby={`${chartId}-title`} 
      aria-describedby={`${chartId}-desc`}
    >
      <h3 id={`${chartId}-title`} className="sr-only">{title ?? 'Revenue by Region'}</h3>
      <div 
        ref={chartRef} 
        style={{ height: 480, width: '100%' }}
        className="focus-visible-ring"
        tabIndex={0}
        role="img"
        aria-label={`Interactive choropleth map showing ${title ?? 'revenue by region'}`}
      />
      <p id={`${chartId}-desc`} className="sr-only">{accessibilitySummary}</p>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-xs text-gray-600">Total Revenue</div>
          <div className="text-sm font-semibold">
            ₱{data.reduce((sum, d) => sum + d.revenuePhp, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600">Avg Market Share</div>
          <div className="text-sm font-semibold">
            {(data.reduce((sum, d) => sum + (d.ourSharePct || 0), 0) / data.filter(d => d.ourSharePct !== null).length).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600">Regions</div>
          <div className="text-sm font-semibold">{data.length}</div>
        </div>
      </div>
    </figure>
  );
};

export default ChoroplethMap;