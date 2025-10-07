import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Sankey,
  Treemap,
} from 'recharts';
import { Users, ShoppingCart, ThumbsUp, TrendingUp, Clock, Smartphone } from 'lucide-react';
import useDataStore from '@/store/dataStore';
import { DataVisualizationKit } from '../widgets/DataVisualizationKit';
import { ResponsiveChart } from '../widgets/ResponsiveChart';
import { FinancialMetrics } from '../widgets/FinancialMetrics';
import { InteractiveChart } from '../widgets/InteractiveChart';

interface ConsumerBehaviorProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
}

export default function ConsumerBehavior({ filters }: ConsumerBehaviorProps) {
  const { datasets } = useDataStore();

  // Request methods data
  const requestMethods = useMemo(() => {
    return [
      { method: 'Voice', count: 12500, percentage: 45.2 },
      { method: 'Text/SMS', count: 8900, percentage: 32.2 },
      { method: 'In-Person', count: 4200, percentage: 15.2 },
      { method: 'Phone Call', count: 2050, percentage: 7.4 },
    ];
  }, [filters]);

  // Purchase decision factors
  const decisionFactors = useMemo(() => {
    return [
      { factor: 'Price', score: 92 },
      { factor: 'Brand Trust', score: 88 },
      { factor: 'Availability', score: 85 },
      { factor: 'Promotion', score: 72 },
      { factor: 'Recommendation', score: 68 },
      { factor: 'Convenience', score: 75 },
    ];
  }, [filters]);

  // Acceptance of suggestions
  const suggestionAcceptance = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        suggested: Math.floor(Math.random() * 200) + 300,
        accepted: Math.floor(Math.random() * 150) + 180,
        acceptanceRate: 60 + Math.random() * 20,
      };
    });
    return days;
  }, [filters]);

  // Shopping patterns by day
  const shoppingPatterns = useMemo(() => {
    return [
      { day: 'Monday', morning: 320, afternoon: 450, evening: 680 },
      { day: 'Tuesday', morning: 280, afternoon: 420, evening: 640 },
      { day: 'Wednesday', morning: 300, afternoon: 480, evening: 720 },
      { day: 'Thursday', morning: 340, afternoon: 460, evening: 700 },
      { day: 'Friday', morning: 380, afternoon: 520, evening: 820 },
      { day: 'Saturday', morning: 450, afternoon: 680, evening: 920 },
      { day: 'Sunday', morning: 420, afternoon: 640, evening: 880 },
    ];
  }, [filters]);

  // Purchase frequency distribution
  const purchaseFrequency = useMemo(() => {
    return [
      { frequency: 'Daily', customers: 2800, percentage: 28 },
      { frequency: '2-3x/week', customers: 3500, percentage: 35 },
      { frequency: 'Weekly', customers: 2200, percentage: 22 },
      { frequency: 'Bi-weekly', customers: 1000, percentage: 10 },
      { frequency: 'Monthly', customers: 500, percentage: 5 },
    ];
  }, [filters]);

  // Basket composition patterns
  const basketComposition = useMemo(() => {
    return [
      { type: 'Single Category', count: 3200, percentage: 32 },
      { type: 'Cross-Category', count: 4800, percentage: 48 },
      { type: 'Impulse Items', count: 2000, percentage: 20 },
    ];
  }, [filters]);

  // Consumer segments
  const consumerSegments = useMemo(() => {
    return [
      { segment: 'Price Conscious', size: 35, avgBasket: 180, frequency: 3.2 },
      { segment: 'Brand Loyal', size: 28, avgBasket: 320, frequency: 2.8 },
      { segment: 'Convenience Seekers', size: 22, avgBasket: 250, frequency: 4.1 },
      { segment: 'Premium Buyers', size: 15, avgBasket: 450, frequency: 2.2 },
    ];
  }, [filters]);

  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
  const RADIAN = Math.PI / 180;

  // Custom label for pie charts
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Consumer Behavior Analytics</h2>
        <p className="text-gray-600 mt-1">
          Purchase patterns, preferences, and decision-making insights
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">10,247</p>
              <p className="text-xs text-green-600 mt-1">+12.3% vs last month</p>
            </div>
            <Users className="text-dashboard-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Repeat Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">78.4%</p>
              <p className="text-xs text-gray-500 mt-1">Within 7 days</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suggestion Accept</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">68.2%</p>
              <p className="text-xs text-amber-600 mt-1">When offered alternatives</p>
            </div>
            <ThumbsUp className="text-amber-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Digital Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">77.4%</p>
              <p className="text-xs text-purple-600 mt-1">Voice + Text combined</p>
            </div>
            <Smartphone className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Methods */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Purchase Request Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={requestMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {requestMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => value.toLocaleString()}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: any, entry: any) => 
                  `${entry.payload.method}: ${entry.payload.percentage}%`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Decision Factors Radar */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Purchase Decision Factors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={decisionFactors}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="factor" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
              <Radar
                name="Importance Score"
                dataKey="score"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Suggestion Acceptance Trend */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Alternative Product Acceptance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={suggestionAcceptance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="suggested" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 3 }}
                name="Suggestions Made"
              />
              <Line 
                type="monotone" 
                dataKey="accepted" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                name="Suggestions Accepted"
              />
              <Line 
                type="monotone" 
                dataKey="acceptanceRate" 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#f59e0b', r: 3 }}
                name="Acceptance Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Shopping Patterns by Day */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Weekly Shopping Patterns</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shoppingPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey="morning" stackId="a" fill="#fbbf24" />
              <Bar dataKey="afternoon" stackId="a" fill="#f59e0b" />
              <Bar dataKey="evening" stackId="a" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase Frequency */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} />
            Purchase Frequency
          </h3>
          <div className="space-y-3">
            {purchaseFrequency.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.frequency}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: colors[idx % colors.length],
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Basket Composition */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart size={20} />
            Basket Composition
          </h3>
          <div className="space-y-3">
            {basketComposition.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">{item.type}</span>
                  <span className="text-sm font-bold" style={{ color: colors[idx] }}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {item.count.toLocaleString()} transactions
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consumer Segments */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Consumer Segments</h3>
          <div className="space-y-3">
            {consumerSegments.map((segment, idx) => (
              <div key={idx} className="border-l-4 pl-3 py-2" 
                style={{ borderColor: colors[idx % colors.length] }}>
                <div className="font-medium text-sm">{segment.segment}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Size: {segment.size}% | Avg: ₱{segment.avgBasket} | {segment.frequency}x/week
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Behavioral Analytics Section */}
      <div className="col-span-full mt-8 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Advanced Behavioral Analytics
          <span className="text-sm font-normal text-gray-500 ml-2">(Figma r19 Kit + Financial Insights)</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Behavioral Data Visualization Kit */}
          <div className="lg:col-span-2">
            <DataVisualizationKit 
              props={{ 
                title: "Consumer Journey Analytics Suite", 
                chartTypes: ["sankey", "radar", "network"],
                interactiveMode: true,
                dataSource: "behavioral-analytics"
              }} 
              data={null} 
            />
          </div>
          
          {/* Purchase Pattern Analysis */}
          <ResponsiveChart 
            props={{ 
              title: "Purchase Pattern Matrix", 
              chartType: "heatmap",
              responsive: true,
              showLegend: true,
              dimensions: ["frequency", "timing", "category"]
            }} 
            data={null} 
          />
          
          {/* Consumer Lifetime Value */}
          <FinancialMetrics 
            props={{ 
              title: "Consumer Lifetime Value Metrics", 
              showTrends: true,
              layout: "behavioral",
              metrics: ["CLV", "CAC", "retention"]
            }} 
            data={null} 
          />
          
          {/* Interactive Decision Tree */}
          <InteractiveChart 
            props={{ 
              title: "Purchase Decision Flow Analysis", 
              chartType: "tree",
              showControls: true,
              dataFilters: ["decision_factor", "outcome", "segment"]
            }} 
            data={null} 
          />
          
          {/* Behavioral Insights Dashboard */}
          <InteractiveChart 
            props={{ 
              title: "Real-time Behavior Insights", 
              chartType: "gauge",
              showControls: true,
              metrics: ["engagement", "conversion", "satisfaction"]
            }} 
            data={null} 
          />
        </div>
      </div>
    </div>
  );
}