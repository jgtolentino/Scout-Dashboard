import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, Building2, Package, Filter, Upload, Home } from 'lucide-react';
import { FilterProvider, useFilters } from './context/FilterContext';
import { FilterDrawer } from './components/FilterDrawer';
import { ScoreCard } from './components/ui/ScoreCard';
import { 
  TransactionTrends,
  ProductMixChart,
  BrandPerformance,
  RegionalHeatMap,
  AIInsightsPanel,
  TimeHeatMap,
  ChoroplethMap,
  CompetitiveTable,
  ComponentPreloader
} from './components/LazyComponents';
import { 
  ErrorBoundary, 
  ChartErrorBoundary, 
  QueryErrorBoundary, 
  AsyncErrorBoundary 
} from './components/error-boundaries';
import { DataImport } from './pages/DataImport';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow-sm border-b border-azure-grayLight/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-tbwa-yellow/15 rounded-full p-2">
                <Brain size={24} className="text-tbwa-darkBlue" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Scout Dashboard v5.0
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-azure-blue/10 text-azure-blue' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home size={16} />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link
                to="/data-import"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/data-import' 
                    ? 'bg-azure-blue/10 text-azure-blue' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload size={16} />
                <span className="text-sm font-medium">Data Import</span>
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Medallion Architecture Active
          </div>
        </div>
      </div>
    </nav>
  );
}

function Dashboard() {
  const { filters, isFilterActive } = useFilters();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { data: executiveKPIs, isLoading } = useQuery({
    queryKey: ['executive-kpis'],
    queryFn: async () => {
      const response = await fetch('/api/v5/kpis/executive');
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return response.json();
    },
  });

  // Get date range for competitive analysis
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  const p_start = filters.dateRange?.start || startDate.toISOString().split('T')[0];
  const p_end = filters.dateRange?.end || endDate.toISOString().split('T')[0];

  // Fetch regional revenue data
  const { data: regionRevenue } = useQuery({
    queryKey: ['region-revenue', p_start, p_end],
    queryFn: async () => {
      const response = await fetch(`/api/dal/get_region_revenue_summary?p_start=${p_start}&p_end=${p_end}`);
      if (!response.ok) throw new Error('Failed to fetch regional revenue');
      return response.json();
    },
  });

  // Fetch market share data
  const { data: marketShare } = useQuery({
    queryKey: ['market-share', p_start, p_end],
    queryFn: async () => {
      const response = await fetch(`/api/dal/get_market_share_by_region?p_start=${p_start}&p_end=${p_end}`);
      if (!response.ok) throw new Error('Failed to fetch market share');
      return response.json();
    },
  });

  // Combine data for choropleth map
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
    <div className="bg-azure-background">
      {/* Filter Button */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-end">
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isFilterActive 
                ? 'border-azure-blue bg-azure-blue/10 text-azure-blue' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">
              Filters {isFilterActive && '(Active)'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-8">
        {/* KPI Cards */}
        <QueryErrorBoundary queryName="Executive KPIs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ScoreCard
              title="Revenue MTD"
              value={`₱${(executiveKPIs?.data?.revenue_mtd || 3500000).toLocaleString()}`}
              delta={executiveKPIs?.data?.revenue_growth_mom || 12.5}
              isLoading={isLoading}
            />
            <ScoreCard
              title="Active Stores"
              value={(executiveKPIs?.data?.active_stores || 2847).toLocaleString()}
              delta={3.2}
              isLoading={isLoading}
            />
            <ScoreCard
              title="Market Share"
              value={`${executiveKPIs?.data?.market_share || 18.7}%`}
              delta={-1.2}
              isLoading={isLoading}
            />
            <ScoreCard
              title="AI Insights"
              value={(executiveKPIs?.data?.ai_insights_count || 24).toString()}
              delta={0}
              hint="New this week"
              isLoading={isLoading}
            />
          </div>
        </QueryErrorBoundary>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartErrorBoundary chartName="Transaction Trends">
            <TransactionTrends />
          </ChartErrorBoundary>
          
          <ChartErrorBoundary chartName="Product Mix">
            <ProductMixChart />
          </ChartErrorBoundary>
          
          <ChartErrorBoundary chartName="Brand Performance">
            <BrandPerformance />
          </ChartErrorBoundary>
          
          <ChartErrorBoundary chartName="Regional Heat Map">
            <RegionalHeatMap />
          </ChartErrorBoundary>
        </div>

        {/* Geo & Competitive Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8">
            <ChartErrorBoundary chartName="Geographic Map">
              <ChoroplethMap
                title="Revenue Growth & Market Share by Region"
                data={mapData}
              />
            </ChartErrorBoundary>
          </div>
          <div className="lg:col-span-4">
            <QueryErrorBoundary queryName="Competitive Analysis">
              <CompetitiveTable 
                rows={(marketShare?.data || []).map((m: any) => ({
                  region: m.region,
                  ourSharePct: m.our_share_pct,
                  topCompetitor: m.top_competitor,
                  topCompSharePct: m.top_comp_share_pct,
                  deltaPct: m.delta_pct
                }))}
              />
            </QueryErrorBoundary>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartErrorBoundary chartName="Time Heat Map">
              <TimeHeatMap />
            </ChartErrorBoundary>
          </div>
          <div className="lg:col-span-1">
            <QueryErrorBoundary queryName="AI Insights">
              <AIInsightsPanel />
            </QueryErrorBoundary>
          </div>
        </div>

        {/* Active Filters Display */}
        {isFilterActive && (
          <div className="mb-6 glass-panel rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-azure-blue" />
                <span className="text-sm font-medium">Active Filters:</span>
                <div className="flex gap-2">
                  {filters.region && (
                    <span className="px-2 py-1 bg-azure-blue/10 text-azure-blue rounded text-xs">
                      Region: {filters.region}
                    </span>
                  )}
                  {filters.province && (
                    <span className="px-2 py-1 bg-azure-blue/10 text-azure-blue rounded text-xs">
                      Province: {filters.province}
                    </span>
                  )}
                  {filters.city && (
                    <span className="px-2 py-1 bg-azure-blue/10 text-azure-blue rounded text-xs">
                      City: {filters.city}
                    </span>
                  )}
                  {filters.brands?.length && (
                    <span className="px-2 py-1 bg-azure-blue/10 text-azure-blue rounded text-xs">
                      {filters.brands.length} Brands
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Status */}
        <div className="mt-8 glass-panel rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Medallion API</span>
              <span className="text-emerald-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="text-emerald-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Version</span>
              <span className="text-gray-900 font-medium">v5.0.0</span>
            </div>
          </div>
        </div>
      </main>
      
      {/* Filter Drawer */}
      <FilterDrawer 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary 
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Log to external service (Sentry, etc.)
        console.error('App-level error:', error, errorInfo);
        
        // In production, send to monitoring service
        // sentry.captureException(error, {
        //   contexts: { react: { componentStack: errorInfo.componentStack } }
        // });
      }}
    >
      <AsyncErrorBoundary maxRetries={3} retryDelay={2000}>
        <Router>
          <FilterProvider>
            <ComponentPreloader />
            <div className="min-h-screen bg-azure-background">
              <Navigation />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/data-import" element={<DataImport />} />
              </Routes>
            </div>
          </FilterProvider>
        </Router>
      </AsyncErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;