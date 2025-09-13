import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, Grid, KPICard } from './ui';
import ModuleCard from './components/ModuleCard';
import GlobalFilterBar, { FilterState } from './components/GlobalFilterBar';
import DashboardSkeleton from './components/DashboardSkeleton';
import Alert from './components/Alert';

// Color palette for charts
const COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

interface MoverData {
  brand: string;
  category: string;
  change: number;
}

interface LeaderData {
  brand: string;
  category: string;
  value: number;
}

interface KPIData {
  totalRevenue: number;
  topBrand: { name: string; value: number; category: string };
  fastestGrowth: { name: string; change: number; category: string };
  topCategory: { name: string; value: number };
}

function BrandsDashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [marketShare, setMarketShare] = useState<any[]>([]);
  const [movers, setMovers] = useState<{ gainers: MoverData[], losers: MoverData[] }>({ gainers: [], losers: [] });
  const [leaderboard, setLeaderboard] = useState<LeaderData[]>([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    barangay: 'all',
    category: 'all',
    dateRange: '30d',
    search: '',
  });

  // Always use relative URL in production or when not in dev mode
  const API_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:7072/api/brands' 
    : '/api/brands';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all data in parallel
      const [kpisRes, shareRes, moversRes, leaderRes, insightsRes] = await Promise.all([
        fetch(`${API_BASE}/kpis`),
        fetch(`${API_BASE}/market-share`),
        fetch(`${API_BASE}/movers`),
        fetch(`${API_BASE}/leaderboard`),
        fetch(`${API_BASE}/insights`),
      ]);

      if (!kpisRes.ok || !shareRes.ok || !moversRes.ok || !leaderRes.ok || !insightsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [kpisData, shareData, moversData, leaderData, insightsData] = await Promise.all([
        kpisRes.json(),
        shareRes.json(),
        moversRes.json(),
        leaderRes.json(),
        insightsRes.json(),
      ]);

      setKpis(kpisData);
      setMarketShare(shareData);
      setMovers(moversData);
      setLeaderboard(leaderData);
      setInsights(insightsData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // In a real app, this would trigger a data refetch with the new filters
    console.log('Filters changed:', newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Brand Performance Dashboard</h1>
            <p className="text-gray-600 mt-1">Loading real-time insights...</p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Brand Performance Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time brand analytics and market insights</p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Alert variant="error" onClose={fetchDashboardData}>
            <div>
              <p className="font-semibold">Unable to load dashboard data</p>
              <p className="text-sm mt-1">{error || 'Failed to fetch data'}</p>
              <p className="text-sm text-gray-500 mt-2">Make sure the brands API is running</p>
              <button 
                onClick={fetchDashboardData}
                className="mt-3 px-4 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors text-sm"
              >
                Retry Connection
              </button>
            </div>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Brand Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time brand analytics and market insights</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Global Filter Bar */}
        <GlobalFilterBar onFilterChange={handleFilterChange} />

        {/* KPI Cards */}
        <Grid cols={4} gap="lg" responsive={{ sm: 1, md: 2, lg: 4 }} className="mb-8">
          <KPICard
            accent="primary"
            title="Total Revenue"
            value={`₱${kpis.totalRevenue.toLocaleString()}`}
            subtitle="All brands combined"
          />
          
          <KPICard
            accent="success"
            title="Top Brand"
            value={kpis.topBrand.name}
            subtitle={`₱${kpis.topBrand.value.toLocaleString()} - ${kpis.topBrand.category}`}
          />
          
          <KPICard
            accent="warning"
            title="Fastest Growth"
            value={`${kpis.fastestGrowth.name}`}
            subtitle={`+${kpis.fastestGrowth.change}% - ${kpis.fastestGrowth.category}`}
          />
          
          <KPICard
            accent="primary"
            title="Category Leader"
            value={kpis.topCategory.name}
            subtitle={`₱${kpis.topCategory.value.toLocaleString()}`}
          />
        </Grid>

        <Grid cols={2} gap="lg" responsive={{ sm: 1, lg: 2 }} className="mb-8">
          {/* Market Share Chart */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Market Share by Brand</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketShare}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {marketShare.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Movers */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Fastest Movers</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-success-800 uppercase tracking-wider mb-2">
                  Top Gainers
                </h3>
                {movers.gainers.map((brand, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <span className="font-medium">{brand.brand}</span>
                      <span className="text-sm text-gray-500 ml-2">({brand.category})</span>
                    </div>
                    <span className="text-success font-semibold">+{brand.change}%</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-danger-800 uppercase tracking-wider mb-2">
                  Top Losers
                </h3>
                {movers.losers.map((brand, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <span className="font-medium">{brand.brand}</span>
                      <span className="text-sm text-gray-500 ml-2">({brand.category})</span>
                    </div>
                    <span className="text-danger font-semibold">{brand.change}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Grid>

        {/* Brand Leaderboard */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Brand Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Brand</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Change</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((brand: any) => (
                  <tr key={brand.brand} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold">
                        {brand.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{brand.brand}</td>
                    <td className="py-3 px-4 text-gray-600">{brand.category}</td>
                    <td className="py-3 px-4 text-right font-medium">₱{brand.value.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        brand.avgChange > 0 ? 'text-success' : brand.avgChange < 0 ? 'text-danger' : 'text-gray-500'
                      }`}>
                        {brand.avgChange > 0 ? '+' : ''}{brand.avgChange}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Insights */}
        <Card accent="primary">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Market Insights</h2>
          <div className="space-y-4">
            {insights.map((insight: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  insight.priority === 'high' 
                    ? 'bg-warning-50 border-warning-200' 
                    : insight.priority === 'medium'
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                <p className="text-gray-700">{insight.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}

export default BrandsDashboard;