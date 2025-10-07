import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from './components/Card';
import FilterBar from './components/FilterBar';

interface TransactionData {
  date: string;
  amount: number;
  count: number;
}

function TransactionDashboard() {
  const [data, setData] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactionData();
  }, []);

  const fetchTransactionData = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);
  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
  const avgTransaction = totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0;

  // Format data for chart
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: d.amount,
    count: d.count,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card accent="danger" className="max-w-md">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-danger mb-2">Error Loading Data</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchTransactionData}
              className="mt-4 px-4 py-2 bg-danger text-white rounded-md hover:bg-danger-700 transition"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Transaction Trends Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Real-time analytics and insights</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <FilterBar onFilterChange={(filters) => console.log('Filters changed:', filters)} />
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            accent="success"
            title="Total Transactions"
            value={totalTransactions.toLocaleString()}
            subtitle="Last 30 days"
          />
          
          <Card
            accent="primary"
            title="Total Revenue"
            value={`₱${totalAmount.toLocaleString()}`}
            subtitle="Last 30 days"
          />
          
          <Card
            accent="warning"
            title="Average Transaction"
            value={`₱${avgTransaction}`}
            subtitle="Per transaction"
          />
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Transaction Trends - Last 30 Days
          </h2>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{ value: 'Date', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  yAxisId="amount"
                  orientation="left"
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{ value: 'Revenue (₱)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `₱${value.toLocaleString()}`}
                />
                <YAxis 
                  yAxisId="count"
                  orientation="right"
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{ value: 'Number of Transactions', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Revenue') {
                      return [`₱${value.toLocaleString()}`, name];
                    }
                    return [value.toLocaleString(), name];
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                />
                <Line
                  yAxisId="amount"
                  type="monotone"
                  dataKey="amount"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="count"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Transactions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Raw Data Preview */}
        <Card accent="primary">
          <details className="cursor-pointer">
            <summary className="font-semibold text-gray-900 mb-4">
              API Response Preview (First 5 records)
            </summary>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(data.slice(0, 5), null, 2)}
            </pre>
          </details>
        </Card>
      </main>
    </div>
  );
}

export default TransactionDashboard;