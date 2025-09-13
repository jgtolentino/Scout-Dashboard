import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from '../context/FilterContext';
import { ScoreCard } from '../components/ui/ScoreCard';
import ChoroplethMap from '../shared/widgets/ChoroplethMap';
import CompetitiveTable from '../shared/widgets/CompetitiveTable';

export default function Overview() {
  const { filters } = useFilters();
  
  // Get date range from filters or default to last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  
  const p_start = filters.dateRange?.start || startDate.toISOString().split('T')[0];
  const p_end = filters.dateRange?.end || endDate.toISOString().split('T')[0];

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['overview-kpis', p_start, p_end],
    queryFn: async () => {
      const response = await fetch(`/api/v5/kpis/executive?start=${p_start}&end=${p_end}`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return response.json();
    },
  });

  // Fetch regional revenue data
  const { data: regionRevenue, isLoading: regionLoading } = useQuery({
    queryKey: ['region-revenue', p_start, p_end],
    queryFn: async () => {
      const response = await fetch(`/api/dal/get_region_revenue_summary?p_start=${p_start}&p_end=${p_end}`);
      if (!response.ok) throw new Error('Failed to fetch regional revenue');
      return response.json();
    },
  });

  // Fetch market share data
  const { data: marketShare, isLoading: marketLoading } = useQuery({
    queryKey: ['market-share', p_start, p_end],
    queryFn: async () => {
      const response = await fetch(`/api/dal/get_market_share_by_region?p_start=${p_start}&p_end=${p_end}`);
      if (!response.ok) throw new Error('Failed to fetch market share');
      return response.json();
    },
  });

  // Fetch margin by category
  const { data: margin } = useQuery({
    queryKey: ['margin-by-category'],
    queryFn: async () => {
      const response = await fetch('/api/dal/get_margin_by_category');
      if (!response.ok) throw new Error('Failed to fetch margins');
      return response.json();
    },
  });

  // Combine regional data for the choropleth map
  const mapData = (regionRevenue?.data || []).map((r: any) => {
    const ms = (marketShare?.data || []).find((m: any) => m.region === r.region) || {};
    return {
      region: r.region,
      revenuePhp: Number(r.revenue_php),
      growthPct: r.growth_pct == null ? null : Number(r.growth_pct),
      ourSharePct: ms.our_share_pct == null ? null : Number(ms.our_share_pct),
      topCompetitor: ms.top_competitor || null,
      topCompSharePct: ms.top_comp_share_pct == null ? null : Number(ms.top_comp_share_pct),
      deltaPct: ms.delta_pct == null ? null : Number(ms.delta_pct)
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Executive Overview</h1>
        <p className="text-gray-600 mt-2">Real-time business intelligence and competitive analysis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ScoreCard
          title="Total Revenue"
          value={`₱${(kpis?.data?.total_revenue || 0).toLocaleString()}`}
          delta={kpis?.data?.revenue_growth || 0}
          isLoading={kpisLoading}
        />
        <ScoreCard
          title="Market Share"
          value={`${kpis?.data?.market_share || 0}%`}
          delta={kpis?.data?.market_share_change || 0}
          isLoading={kpisLoading}
        />
        <ScoreCard
          title="Active Regions"
          value={(regionRevenue?.data?.length || 0).toString()}
          delta={0}
          isLoading={regionLoading}
        />
        <ScoreCard
          title="Avg Margin"
          value={`${kpis?.data?.avg_margin || 0}%`}
          delta={kpis?.data?.margin_change || 0}
          isLoading={kpisLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Choropleth Map - Takes up 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          <ChoroplethMap
            title="Revenue Growth & Market Share by Region"
            data={mapData}
          />
        </div>

        {/* Margin Analysis - Takes up 4 columns */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-600 mb-4">Margin by Category</div>
            <div className="space-y-2">
              {(margin?.data || []).slice(0, 5).map((m: any, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{m.category}</span>
                  <span className="text-sm font-medium">₱{Number(m.margin_php).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competitive Analysis Table - Full width */}
        <div className="col-span-12">
          <CompetitiveTable 
            rows={(marketShare?.data || []).map((m: any) => ({
              region: m.region,
              ourSharePct: m.our_share_pct,
              topCompetitor: m.top_competitor,
              topCompSharePct: m.top_comp_share_pct,
              deltaPct: m.delta_pct
            }))}
          />
        </div>

        {/* Insights Panel */}
        <div className="col-span-12">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-medium mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700 font-medium">Top Performing Region</div>
                <div className="text-lg font-bold text-blue-900 mt-1">
                  {mapData.length > 0 ? mapData.sort((a: any, b: any) => b.revenuePhp - a.revenuePhp)[0].region : '—'}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700 font-medium">Highest Growth</div>
                <div className="text-lg font-bold text-green-900 mt-1">
                  {mapData.length > 0 ? 
                    `${mapData.sort((a: any, b: any) => (b.growthPct || 0) - (a.growthPct || 0))[0].region} (+${mapData[0].growthPct}%)` 
                    : '—'}
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-sm text-amber-700 font-medium">Competitive Threat</div>
                <div className="text-lg font-bold text-amber-900 mt-1">
                  {marketShare?.data?.length > 0 ? 
                    marketShare.data.find((m: any) => m.delta_pct < 0)?.region || 'None' 
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}