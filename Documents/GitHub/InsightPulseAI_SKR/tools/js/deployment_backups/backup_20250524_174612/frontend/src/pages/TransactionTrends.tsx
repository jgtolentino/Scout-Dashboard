/**
 * Transaction Trends POC Page
 * Route: /transactions
 * Components: Time-series chart, Box-plot for duration
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BoxPlot, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Types
interface HourlyVolumeData {
  hour: number;
  transactionCount: number;
  avgAmount: number;
  avgDuration: number;
  label: string;
  tooltip: string;
}

interface DurationDistribution {
  category: string;
  count: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  q1: number;
  median: number;
  q3: number;
  lowerFence: number;
  upperFence: number;
}

interface SummaryStats {
  totalTransactions: number;
  transactionsWithDuration: number;
  transactionsWithAmount: number;
  avgTransactionAmount: number;
  avgDurationSeconds: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  durationCompleteness: string;
  amountCompleteness: string;
}

interface TransactionTrendsData {
  hourlyVolume: HourlyVolumeData[];
  durationDistribution: DurationDistribution[];
  summaryStats: SummaryStats;
  metadata: {
    generatedAt: string;
    dataSource: string;
    request: {
      startDate: string;
      endDate: string;
      storeId: number | null;
      requestTime: string;
    };
  };
}

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading transaction trends...</span>
  </div>
);

// Error component
const ErrorMessage: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
        <button
          onClick={onRetry}
          className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    </div>
  </div>
);

// Summary stats component
const SummaryStatsCard: React.FC<{ stats: SummaryStats }> = ({ stats }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions.toLocaleString()}</div>
        <div className="text-sm text-gray-500">Total Transactions</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">₱{stats.avgTransactionAmount.toFixed(2)}</div>
        <div className="text-sm text-gray-500">Avg Amount</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{(stats.avgDurationSeconds / 60).toFixed(1)}m</div>
        <div className="text-sm text-gray-500">Avg Duration</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.durationCompleteness}%</div>
        <div className="text-sm text-gray-500">Data Completeness</div>
      </div>
    </div>
  </div>
);

// Main component
const TransactionTrends: React.FC = () => {
  const [data, setData] = useState<TransactionTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await fetch(`/api/transactions/trends?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Failed to fetch transaction trends:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data on component mount and date change
  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{`Hour: ${label}:00`}</p>
          <p className="text-blue-600">{`Transactions: ${payload[0].value}`}</p>
          <p className="text-green-600">{`Avg Amount: ₱${payload[1]?.value?.toFixed(2) || 0}`}</p>
          <p className="text-purple-600">{`Avg Duration: ${(payload[2]?.value / 60)?.toFixed(1) || 0}min`}</p>
        </div>
      );
    }
    return null;
  };

  // Box plot component (simplified version)
  const DurationBoxPlot: React.FC<{ data: DurationDistribution[] }> = ({ data }) => (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className="w-24 text-sm font-medium text-gray-700">
            {item.category}
          </div>
          <div className="flex-1 relative h-8 bg-gray-100 rounded">
            {/* Box plot visualization */}
            <div 
              className="absolute h-full bg-blue-200 border border-blue-400"
              style={{
                left: `${(item.q1 / item.maxDuration) * 100}%`,
                width: `${((item.q3 - item.q1) / item.maxDuration) * 100}%`
              }}
            />
            <div 
              className="absolute h-full w-0.5 bg-blue-600"
              style={{
                left: `${(item.median / item.maxDuration) * 100}%`
              }}
            />
            <div className="absolute -top-6 text-xs text-gray-500">
              {item.count} transactions
            </div>
          </div>
          <div className="w-16 text-sm text-gray-600">
            {(item.avgDuration / 60).toFixed(1)}m
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Trends</h1>
          <p className="text-gray-600">Analyze transaction patterns and duration metrics</p>
        </div>

        {/* Date Range Picker */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="start-date-picker"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="end-date-picker"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                data-testid="refresh-button"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && <LoadingSpinner />}
        
        {error && (
          <ErrorMessage error={error} onRetry={fetchData} />
        )}

        {data && !loading && !error && (
          <>
            {/* Summary Stats */}
            <SummaryStatsCard stats={data.summaryStats} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Volume Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hourly Transaction Volume
                </h3>
                <ResponsiveContainer width="100%" height={300} data-testid="hourly-volume-chart">
                  <LineChart data={data.hourlyVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="transactionCount" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      name="Transaction Count"
                      data-testid="transaction-count-line"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Duration Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Duration Distribution
                </h3>
                <div data-testid="duration-box-plot">
                  <DurationBoxPlot data={data.durationDistribution} />
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 text-xs text-gray-500 text-center">
              Data generated at {new Date(data.metadata.generatedAt).toLocaleString()} | 
              Source: {data.metadata.dataSource} | 
              Range: {data.metadata.request.startDate} to {data.metadata.request.endDate}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionTrends;