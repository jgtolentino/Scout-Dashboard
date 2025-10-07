import { useState, useEffect } from 'react';
import { KpiCard } from './KpiCard';
import { InsightCard } from './InsightCard';
import { FilterBar } from './FilterBar';
import { AssistantPanel } from './AssistantPanel';
import { DataSourceToggle } from './DataSourceToggle';
import { DataFreshnessBadge } from './DataFreshnessBadge';
import { RoleToggle } from './RoleToggle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainIcon, DownloadIcon, RefreshCwIcon, SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDataConnector } from '@/context/DataConnectorContext';
import { useRole } from '@/context/RoleContext';
import { FilterValues, KpiData, InsightData, ChartData } from '@/types/advisor';

export const Dashboard = () => {
  const { 
    getKpiData, 
    getInsightData, 
    getChartData,
    isLoading 
  } = useDataConnector();
  
  const { isInternalView } = useRole();

  const [showAssistant, setShowAssistant] = useState(false);
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [filterValues, setFilterValues] = useState<FilterValues>({
    period: 'last30days',
    organization: 'all',
    region: 'all',
    category: 'all'
  });

  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [insightData, setInsightData] = useState<InsightData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Reload data when filters change or role changes
  useEffect(() => {
    loadDashboardData();
  }, [filterValues, isInternalView]);

  // Function to load all dashboard data
  const loadDashboardData = async () => {
    setDataLoading(true);
    
    try {
      // Fetch all data in parallel
      const [kpis, insights, charts] = await Promise.all([
        getKpiData(filterValues),
        getInsightData(filterValues),
        getChartData(activeMetric, filterValues)
      ]);
      
      setKpiData(kpis);
      setInsightData(insights);
      setChartData(charts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleFilterChange = (values: any) => {
    setFilterValues(values);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-800">Retail Advisor Dashboard</h1>
          <div className="flex items-center gap-2">
            <DataSourceToggle />
            <RoleToggle />
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={() => setShowAssistant(true)}
          >
            <BrainIcon className="h-4 w-4 mr-1" />
            Ask GPT Assistant
          </Button>
          <Button className="text-sm">
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          {isInternalView && (
            <Link to="/settings">
              <Button variant="secondary" size="sm">
                <SettingsIcon className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pt-4">
        <div className="flex justify-between items-center mb-2">
          <FilterBar onChange={handleFilterChange} />
          <div className="flex items-center gap-2">
            <DataFreshnessBadge />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleRefresh}
              disabled={dataLoading || isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 ${dataLoading || isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh data</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Show role banner for internal view */}
      {isInternalView && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mx-6 mt-2 mb-0">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Internal View Active</span> - You are seeing data that is not visible to clients
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 pt-4">
        {dataLoading || isLoading ? (
          // Loading state - show skeleton cards
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 h-[130px]">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          ))
        ) : (
          // Loaded state - show actual KPI cards
          kpiData.map(kpi => (
            <KpiCard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              trend={kpi.trend}
              trendValue={kpi.trendValue}
              target={kpi.target}
              score={kpi.score}
            />
          ))
        )}
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pt-4 pb-8">
        {/* Charts Column */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h2>
          
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger 
                value="revenue" 
                onClick={() => {
                  setActiveMetric('revenue');
                  getChartData('revenue', filterValues).then(setChartData);
                }}
              >
                Revenue
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                onClick={() => {
                  setActiveMetric('orders');
                  getChartData('orders', filterValues).then(setChartData);
                }}
              >
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                onClick={() => {
                  setActiveMetric('customers');
                  getChartData('customers', filterValues).then(setChartData);
                }}
              >
                Customers
              </TabsTrigger>
            </TabsList>
            
            {dataLoading || isLoading ? (
              // Loading state for charts
              <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-sm text-gray-500">Loading chart data...</span>
                </div>
              </div>
            ) : (
              // Loaded state for charts
              <>
                <TabsContent value="revenue" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#0078d4" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="orders" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" stroke="#107c10" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="customers" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="customers" stroke="#5c2d91" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {/* Insights Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-semibold text-gray-800">AI-Powered Insights</h2>
            <DataFreshnessBadge showRefreshTime={false} />
          </div>
          
          {dataLoading || isLoading ? (
            // Loading state for insights
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            ))
          ) : (
            // Loaded state for insights
            insightData.length > 0 ? (
              insightData.map(insight => (
                <InsightCard
                  key={insight.id}
                  id={insight.id.toString()}
                  title={insight.title}
                  summary={insight.summary}
                  details={insight.details}
                  confidence={insight.confidence}
                  category={insight.category}
                  date={insight.date || new Date().toISOString().split('T')[0]}
                  recommendations={insight.recommendations}
                />
              ))
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 text-center">
                <p className="text-muted-foreground">No insights available for the current filters</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* GPT Assistant Dialog */}
      <AssistantPanel 
        open={showAssistant} 
        onOpenChange={setShowAssistant}
        kpiData={kpiData}
        insightData={insightData}
      />
    </div>
  );
};

export default Dashboard;