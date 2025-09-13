import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Clock, TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react';
import useDataStore from '@/store/dataStore';
import { aggregateData } from '@/utils/dataProcessing';
import { StockChart } from '../widgets/StockChart';
import { FinancialMetrics } from '../widgets/FinancialMetrics';
import { InteractiveChart } from '../widgets/InteractiveChart';
import { format } from 'date-fns';

interface TransactionTrendsProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
}

export default function TransactionTrends({ filters }: TransactionTrendsProps) {
  const { datasets } = useDataStore();
  
  // Process data based on filters
  const processedData = useMemo(() => {
    const salesData = datasets.find(d => d.id === 'sales-data')?.data || [];
    
    // Apply filters
    let filtered = [...salesData];
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(d => d.category?.toLowerCase() === filters.category);
    }
    
    if (filters.timeOfDay !== 'all') {
      // Simulate time of day filtering
      const hourRanges = {
        morning: [6, 12],
        afternoon: [12, 18],
        evening: [18, 22]
      };
      if (hourRanges[filters.timeOfDay as keyof typeof hourRanges]) {
        // Filter based on simulated hour
        filtered = filtered.filter((d, idx) => {
          const hour = (idx % 24);
          const [start, end] = hourRanges[filters.timeOfDay as keyof typeof hourRanges];
          return hour >= start && hour < end;
        });
      }
    }
    
    return filtered;
  }, [datasets, filters]);

  // Transaction volume by time
  const volumeByTime = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      transactions: 0,
      revenue: 0
    }));
    
    processedData.forEach((item, idx) => {
      const hour = idx % 24;
      hourlyData[hour].transactions += 1;
      hourlyData[hour].revenue += item.revenue || 0;
    });
    
    return hourlyData;
  }, [processedData]);

  // Daily trends
  const dailyTrends = useMemo(() => {
    const grouped = processedData.reduce((acc: any, item) => {
      const date = item.date || format(new Date(), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date, transactions: 0, revenue: 0, units: 0 };
      }
      acc[date].transactions += 1;
      acc[date].revenue += item.revenue || 0;
      acc[date].units += item.quantity || 0;
      return acc;
    }, {});
    
    return Object.values(grouped).slice(-30); // Last 30 days
  }, [processedData]);

  // Transaction duration distribution
  const durationDistribution = useMemo(() => {
    return [
      { duration: '< 1 min', count: Math.floor(Math.random() * 200) + 100 },
      { duration: '1-2 min', count: Math.floor(Math.random() * 300) + 200 },
      { duration: '2-5 min', count: Math.floor(Math.random() * 400) + 300 },
      { duration: '5-10 min', count: Math.floor(Math.random() * 200) + 100 },
      { duration: '> 10 min', count: Math.floor(Math.random() * 100) + 50 },
    ];
  }, []);

  // Items per basket distribution
  const basketSizeDistribution = useMemo(() => {
    return [
      { items: '1 item', count: Math.floor(Math.random() * 300) + 200, percentage: 25 },
      { items: '2 items', count: Math.floor(Math.random() * 400) + 300, percentage: 35 },
      { items: '3+ items', count: Math.floor(Math.random() * 500) + 400, percentage: 40 },
    ];
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalTransactions = processedData.length;
    const totalRevenue = processedData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const avgUnits = processedData.reduce((sum, d) => sum + (d.quantity || 0), 0) / totalTransactions || 0;
    
    return {
      totalTransactions,
      totalRevenue,
      avgTransaction,
      avgUnits,
    };
  }, [processedData]);

  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Transaction Trends</h2>
        <p className="text-gray-600 mt-1">
          Understand transaction dynamics and patterns by dimension
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {metrics.totalTransactions.toLocaleString()}
              </p>
            </div>
            <ShoppingCart className="text-dashboard-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{(metrics.totalRevenue / 1000).toFixed(1)}K
              </p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{metrics.avgTransaction.toFixed(0)}
              </p>
            </div>
            <TrendingUp className="text-dashboard-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Units/Transaction</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {metrics.avgUnits.toFixed(1)}
              </p>
            </div>
            <Package className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume by Time of Day */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Transaction Volume by Time of Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={volumeByTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="hour" 
                stroke="#6b7280" 
                fontSize={12}
                interval={2}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="transactions" 
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Daily Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrends.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={12}
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Duration */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} />
            Transaction Duration Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={durationDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="duration" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {durationDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Items per Basket */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Items per Basket</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={basketSizeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {basketSizeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: any, entry: any) => `${entry.payload.items}: ${entry.payload.count}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Heatmap Placeholder */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Transaction Heatmap by Location & Time</h3>
        <div className="h-64 bg-gradient-to-br from-dashboard-50 to-dashboard-100 rounded-lg flex items-center justify-center">
          <p className="text-dashboard-600 font-medium">
            Heatmap visualization showing peak transaction times by barangay
          </p>
        </div>
      </div>

      {/* Financial Analysis Section */}
      <div className="col-span-full mt-8 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          Financial Market Analysis
          <span className="text-sm font-normal text-gray-500 ml-2">(Stockbot-style insights)</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Chart */}
          <div className="lg:col-span-2">
            <StockChart 
              props={{ 
                title: "Transaction Value Trends (Market-style)", 
                symbol: "SCOUT:TXN",
                timeframe: "1M"
              }} 
              data={null} 
            />
          </div>
          
          {/* Financial Metrics */}
          <FinancialMetrics 
            props={{ 
              title: "Transaction Metrics", 
              showTrends: true,
              layout: "compact"
            }} 
            data={null} 
          />
          
          {/* Interactive Chart */}
          <InteractiveChart 
            props={{ 
              title: "Transaction Volume Analysis", 
              chartType: "line",
              showControls: true
            }} 
            data={null} 
          />
        </div>
      </div>
    </div>
  );
}