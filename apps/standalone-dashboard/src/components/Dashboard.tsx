import React, { useState } from 'react';
import { Plus, Settings2, Grid3x3 } from 'lucide-react';
import useDataStore from '@/store/dataStore';
import ChartRenderer from '@/components/ChartRenderer';
import MetricCard from '@/components/ui/MetricCard';
import { ChartConfig } from '@/types';

export default function Dashboard() {
  const { datasets, dashboards } = useDataStore();
  const [isEditMode, setIsEditMode] = useState(false);

  // Sample dashboard configuration
  const sampleCharts: ChartConfig[] = [
    {
      id: 'revenue-trend',
      type: 'line',
      title: 'Revenue Trend Over Time',
      datasetId: 'sales-data',
      xAxis: 'date',
      yAxis: 'revenue',
      aggregation: 'sum',
      groupBy: 'date',
    },
    {
      id: 'sales-by-region',
      type: 'bar',
      title: 'Sales by Region',
      datasetId: 'sales-data',
      xAxis: 'region',
      yAxis: 'revenue',
      aggregation: 'sum',
    },
    {
      id: 'product-mix',
      type: 'pie',
      title: 'Product Mix',
      datasetId: 'sales-data',
      groupBy: 'product',
      yAxis: 'quantity',
      aggregation: 'sum',
      options: { donut: true },
    },
    {
      id: 'customer-segments',
      type: 'pie',
      title: 'Customer Segments',
      datasetId: 'customer-analytics',
      groupBy: 'segment',
      yAxis: 'customer_id',
      aggregation: 'count',
    },
  ];

  // Calculate metrics
  const calculateMetrics = () => {
    const salesData = datasets.find(d => d.id === 'sales-data')?.data || [];
    const customerData = datasets.find(d => d.id === 'customer-analytics')?.data || [];
    
    const totalRevenue = salesData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const avgOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;
    const totalCustomers = customerData.length;
    const avgSatisfaction = salesData.reduce((sum, d) => sum + parseFloat(d.customer_satisfaction || 0), 0) / salesData.length;

    return [
      {
        title: 'Total Revenue',
        value: `$${(totalRevenue / 1000000).toFixed(2)}M`,
        change: '+12.5%',
        trend: 'up' as const,
      },
      {
        title: 'Avg Order Value',
        value: `$${avgOrderValue.toFixed(0)}`,
        change: '+5.2%',
        trend: 'up' as const,
      },
      {
        title: 'Total Customers',
        value: totalCustomers.toLocaleString(),
        change: '+8.1%',
        trend: 'up' as const,
      },
      {
        title: 'Satisfaction Score',
        value: avgSatisfaction.toFixed(1),
        change: '-0.3',
        trend: 'down' as const,
      },
    ];
  };

  const metrics = calculateMetrics();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights and analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${isEditMode 
                ? 'bg-dashboard-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <Grid3x3 size={18} />
            {isEditMode ? 'Save Layout' : 'Edit Layout'}
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-dashboard-500 text-white rounded-lg hover:bg-dashboard-600 transition-colors">
            <Plus size={18} />
            Add Chart
          </button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings2 size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sampleCharts.map((chart) => (
          <div key={chart.id} className="dashboard-card">
            <ChartRenderer config={chart} />
          </div>
        ))}
      </div>

      {/* Additional Insights Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
          <div className="space-y-3">
            {['North America', 'Europe', 'Asia'].map((region) => (
              <div key={region} className="flex items-center justify-between">
                <span className="text-gray-600">{region}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-dashboard-500 h-2 rounded-full"
                      style={{ width: `${Math.random() * 40 + 60}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {Math.floor(Math.random() * 40 + 60)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium">Export Report</p>
              <p className="text-sm text-gray-600">Download as PDF or Excel</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium">Schedule Updates</p>
              <p className="text-sm text-gray-600">Get daily/weekly reports</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium">Share Dashboard</p>
              <p className="text-sm text-gray-600">Invite team members</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}