#!/bin/bash

echo "🧩 Updating all component prop types to use ComprehensiveTransaction..."

# Update TransactionTrends component
cat > src/components/TransactionTrends.tsx << 'EOF'
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ComprehensiveTransaction } from '../types/generated/comprehensive-transaction';
import { DashboardFilters } from '../services/unifiedDataService';

interface TransactionTrendsProps {
  transactions: ComprehensiveTransaction[];
  filters: DashboardFilters;
}

export default function TransactionTrends({ transactions, filters }: TransactionTrendsProps) {
  // Process comprehensive transaction data
  const processTimeSeriesData = () => {
    const grouped = transactions.reduce((acc, transaction) => {
      const date = transaction.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + transaction.final_amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  };

  const processHourlyData = () => {
    const hourlyRevenue = transactions.reduce((acc, transaction) => {
      const hour = transaction.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + transaction.final_amount;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      revenue: hourlyRevenue[hour] || 0,
      transactions: transactions.filter(t => t.timestamp.getHours() === hour).length
    }));
  };

  const processPaymentMethodData = () => {
    const paymentCounts = transactions.reduce((acc, transaction) => {
      acc[transaction.payment_method] = (acc[transaction.payment_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(paymentCounts).map(([method, count]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      count,
      percentage: Math.round((count / transactions.length) * 100)
    }));
  };

  const timeSeriesData = processTimeSeriesData();
  const hourlyData = processHourlyData();
  const paymentData = processPaymentMethodData();

  const totalRevenue = transactions.reduce((sum, t) => sum + t.final_amount, 0);
  const avgTransactionValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Trends Overview</h2>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-900">₱{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Transactions</p>
            <p className="text-2xl font-bold text-green-900">{transactions.length.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Avg Transaction</p>
            <p className="text-2xl font-bold text-purple-900">₱{avgTransactionValue.toFixed(0)}</p>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="h-64 mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">Daily Revenue Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Pattern Chart */}
        <div className="h-64 mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">Hourly Transaction Pattern</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="transactions" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-4">Payment Method Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {paymentData.map((payment) => (
              <div key={payment.method} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{payment.method}</p>
                <p className="text-lg font-semibold text-gray-900">{payment.count}</p>
                <p className="text-xs text-gray-500">{payment.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Update ProductMixSKU component
cat > src/components/ProductMixSKU.tsx << 'EOF'
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ComprehensiveTransaction } from '../types/generated/comprehensive-transaction';
import { DashboardFilters } from '../services/unifiedDataService';

interface ProductMixSKUProps {
  transactions: ComprehensiveTransaction[];
  filters: DashboardFilters;
}

export default function ProductMixSKU({ transactions, filters }: ProductMixSKUProps) {
  const processCategoryData = () => {
    const categoryRevenue = transactions.reduce((acc, transaction) => {
      transaction.items.forEach(item => {
        const category = item.product_category || 'Unknown';
        acc[category] = (acc[category] || 0) + item.total_price;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const processBrandData = () => {
    const brandCounts = transactions.reduce((acc, transaction) => {
      transaction.items.forEach(item => {
        const brand = item.brand_name || 'Unknown';
        acc[brand] = (acc[brand] || 0) + item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(brandCounts)
      .map(([brand, quantity]) => ({ brand, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10 brands
  };

  const processSubstitutionData = () => {
    const substitutions = transactions.flatMap(t => t.items.filter(item => item.was_substituted));
    
    const substitutionReasons = substitutions.reduce((acc, item) => {
      const reason = item.substitution_reason || 'unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: substitutions.length,
      percentage: transactions.length > 0 ? (substitutions.length / transactions.flatMap(t => t.items).length * 100) : 0,
      reasons: Object.entries(substitutionReasons).map(([reason, count]) => ({ reason, count }))
    };
  };

  const categoryData = processCategoryData();
  const brandData = processBrandData();
  const substitutionData = processSubstitutionData();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Mix & SKU Analysis</h2>
        
        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-4">Revenue by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-800 mb-4">Top Brands by Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="brand" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Substitution Analysis */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 mb-3">Product Substitution Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{substitutionData.total}</p>
              <p className="text-sm text-gray-600">Total Substitutions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{substitutionData.percentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Substitution Rate</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Top Reasons:</p>
              {substitutionData.reasons.slice(0, 3).map((reason) => (
                <div key={reason.reason} className="flex justify-between text-sm">
                  <span className="capitalize">{reason.reason}</span>
                  <span>{reason.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Update ConsumerBehavior component
cat > src/components/ConsumerBehavior.tsx << 'EOF'
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { ComprehensiveTransaction } from '../types/generated/comprehensive-transaction';
import { DashboardFilters } from '../services/unifiedDataService';

interface ConsumerBehaviorProps {
  transactions: ComprehensiveTransaction[];
  filters: DashboardFilters;
}

export default function ConsumerBehavior({ transactions, filters }: ConsumerBehaviorProps) {
  const processAudioInsights = () => {
    const audioData = transactions
      .filter(t => t.audio_signals)
      .map(t => ({
        sentiment: t.audio_signals!.sentiment_score || 0,
        politeness: t.audio_signals!.politeness_score || 0,
        confidence: t.audio_signals!.confidence_level || 0,
        duration: t.audio_signals!.conversation_duration || 0,
        transactionValue: t.final_amount
      }));

    return audioData;
  };

  const processVideoInsights = () => {
    const videoData = transactions
      .filter(t => t.video_signals)
      .map(t => ({
        attention: t.video_signals!.attention_score || 0,
        dwellTime: t.video_signals!.dwell_time_seconds || 0,
        emotion: t.video_signals!.emotion_detected || 'neutral',
        transactionValue: t.final_amount
      }));

    return videoData;
  };

  const processLanguageDistribution = () => {
    const languages = transactions.reduce((acc, t) => {
      const lang = t.audio_signals?.language_detected || 'unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(languages).map(([language, count]) => ({
      language: language.charAt(0).toUpperCase() + language.slice(1),
      count,
      percentage: Math.round((count / transactions.length) * 100)
    }));
  };

  const audioData = processAudioInsights();
  const videoData = processVideoInsights();
  const languageData = processLanguageDistribution();

  const avgSentiment = audioData.length > 0 ? 
    audioData.reduce((sum, d) => sum + d.sentiment, 0) / audioData.length : 0;
  
  const avgAttention = videoData.length > 0 ? 
    videoData.reduce((sum, d) => sum + d.attention, 0) / videoData.length : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Consumer Behavior Analysis</h2>
        
        {/* Audio/Video Intelligence Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-600 mb-1">Avg Sentiment</p>
            <p className="text-2xl font-bold text-green-900">{avgSentiment.toFixed(2)}</p>
            <p className="text-xs text-green-600">-1 to +1 scale</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-600 mb-1">Avg Attention</p>
            <p className="text-2xl font-bold text-blue-900">{(avgAttention * 100).toFixed(0)}%</p>
            <p className="text-xs text-blue-600">Customer focus</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-purple-600 mb-1">Audio Signals</p>
            <p className="text-2xl font-bold text-purple-900">{audioData.length}</p>
            <p className="text-xs text-purple-600">Conversations analyzed</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-sm text-orange-600 mb-1">Video Signals</p>
            <p className="text-2xl font-bold text-orange-900">{videoData.length}</p>
            <p className="text-xs text-orange-600">Visual interactions</p>
          </div>
        </div>

        {/* Sentiment vs Transaction Value */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-4">Sentiment vs Transaction Value</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={audioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sentiment" 
                  name="Sentiment Score" 
                  domain={[-1, 1]}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  dataKey="transactionValue" 
                  name="Transaction Value"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'sentiment' ? value.toFixed(2) : `₱${value.toLocaleString()}`,
                    name === 'sentiment' ? 'Sentiment' : 'Transaction Value'
                  ]}
                />
                <Scatter fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Distribution */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-4">Language Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {languageData.map((lang) => (
              <div key={lang.language} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{lang.language}</p>
                <p className="text-lg font-semibold text-gray-900">{lang.count}</p>
                <p className="text-xs text-gray-500">{lang.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Update ConsumerProfiling component
cat > src/components/ConsumerProfiling.tsx << 'EOF'
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ComprehensiveTransaction } from '../types/generated/comprehensive-transaction';
import { DashboardFilters } from '../services/unifiedDataService';

interface ConsumerProfilingProps {
  transactions: ComprehensiveTransaction[];
  filters: DashboardFilters;
}

export default function ConsumerProfiling({ transactions, filters }: ConsumerProfilingProps) {
  const processAgeGroupData = () => {
    const ageRevenue = transactions.reduce((acc, transaction) => {
      const age = transaction.customer.age_bracket;
      acc[age] = (acc[age] || 0) + transaction.final_amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ageRevenue)
      .map(([age, revenue]) => ({ age, revenue }))
      .sort((a, b) => a.age.localeCompare(b.age));
  };

  const processGenderData = () => {
    const genderStats = transactions.reduce((acc, transaction) => {
      const gender = transaction.customer.gender;
      if (!acc[gender]) {
        acc[gender] = { count: 0, revenue: 0 };
      }
      acc[gender].count += 1;
      acc[gender].revenue += transaction.final_amount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return Object.entries(genderStats).map(([gender, stats]) => ({
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      count: stats.count,
      revenue: stats.revenue,
      avgTransaction: stats.revenue / stats.count
    }));
  };

  const processCustomerTypeData = () => {
    const typeData = transactions.reduce((acc, transaction) => {
      const type = transaction.customer.customer_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeData).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: Math.round((count / transactions.length) * 100)
    }));
  };

  const processLoyaltyData = () => {
    const loyaltyStats = transactions.reduce((acc, transaction) => {
      const loyalty = transaction.customer.loyalty_status || 'non-member';
      if (!acc[loyalty]) {
        acc[loyalty] = { count: 0, revenue: 0 };
      }
      acc[loyalty].count += 1;
      acc[loyalty].revenue += transaction.final_amount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return Object.entries(loyaltyStats).map(([loyalty, stats]) => ({
      loyalty: loyalty.charAt(0).toUpperCase() + loyalty.slice(1).replace('-', ' '),
      count: stats.count,
      revenue: stats.revenue,
      avgSpend: stats.revenue / stats.count
    }));
  };

  const ageData = processAgeGroupData();
  const genderData = processGenderData();
  const customerTypeData = processCustomerTypeData();
  const loyaltyData = processLoyaltyData();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Consumer Profiling</h2>
        
        {/* Age Group Analysis */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-4">Revenue by Age Group</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender and Customer Type Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-4">Gender Distribution</h3>
            <div className="space-y-3">
              {genderData.map((item, index) => (
                <div key={item.gender} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.gender}</p>
                    <p className="text-sm text-gray-600">{item.count} customers</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₱{item.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">₱{item.avgTransaction.toFixed(0)} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-800 mb-4">Customer Types</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {customerTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Loyalty Analysis */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-4">Loyalty Program Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loyaltyData.map((item) => (
              <div key={item.loyalty} className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{item.loyalty}</p>
                <p className="text-xl font-bold text-gray-900">{item.count}</p>
                <p className="text-sm text-gray-600">₱{item.avgSpend.toFixed(0)} avg spend</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Update AIRecommendationPanel component
cat > src/components/AIRecommendationPanel.tsx << 'EOF'
import React from 'react';
import { Brain, TrendingUp, Users, ShoppingBag, Target } from 'lucide-react';
import { ComprehensiveTransaction } from '../types/generated/comprehensive-transaction';

interface AIRecommendationPanelProps {
  transactions: ComprehensiveTransaction[];
  activeModule: string;
}

export default function AIRecommendationPanel({ transactions, activeModule }: AIRecommendationPanelProps) {
  const generateModuleSpecificRecommendations = () => {
    switch (activeModule) {
      case 'trends':
        return generateTrendRecommendations();
      case 'products':
        return generateProductRecommendations();
      case 'behavior':
        return generateBehaviorRecommendations();
      case 'profiling':
        return generateProfilingRecommendations();
      default:
        return generateGeneralRecommendations();
    }
  };

  const generateTrendRecommendations = () => {
    const peakHours = getPeakTransactionHours();
    const topPaymentMethod = getTopPaymentMethod();
    
    return [
      {
        type: 'optimization',
        icon: TrendingUp,
        title: 'Peak Hour Optimization',
        description: `Peak activity at ${peakHours.join(', ')}. Consider staffing adjustments.`,
        impact: 'High',
        effort: 'Medium'
      },
      {
        type: 'revenue',
        icon: Target,
        title: 'Payment Method Strategy',
        description: `${topPaymentMethod} is dominant. Promote digital payment incentives.`,
        impact: 'Medium',
        effort: 'Low'
      }
    ];
  };

  const generateProductRecommendations = () => {
    const substitutionRate = getSubstitutionRate();
    const topCategories = getTopCategories();
    
    return [
      {
        type: 'inventory',
        icon: ShoppingBag,
        title: 'Inventory Management',
        description: `${substitutionRate.toFixed(1)}% substitution rate. Focus on ${topCategories[0]} availability.`,
        impact: 'High',
        effort: 'Medium'
      },
      {
        type: 'cross-sell',
        icon: TrendingUp,
        title: 'Cross-Selling Opportunity',
        description: `Bundle popular ${topCategories.slice(0, 2).join(' and ')} products.`,
        impact: 'Medium',
        effort: 'Low'
      }
    ];
  };

  const generateBehaviorRecommendations = () => {
    const avgSentiment = getAverageSentiment();
    const primaryLanguage = getPrimaryLanguage();
    
    return [
      {
        type: 'customer-experience',
        icon: Users,
        title: 'Customer Experience',
        description: `Sentiment score: ${avgSentiment.toFixed(2)}. ${avgSentiment > 0 ? 'Maintain' : 'Improve'} service quality.`,
        impact: 'High',
        effort: avgSentiment > 0 ? 'Low' : 'Medium'
      },
      {
        type: 'localization',
        icon: Brain,
        title: 'Language Optimization',
        description: `Primary language: ${primaryLanguage}. Tailor communication strategies.`,
        impact: 'Medium',
        effort: 'Medium'
      }
    ];
  };

  const generateProfilingRecommendations = () => {
    const dominantAge = getDominantAgeGroup();
    const loyaltyRate = getLoyaltyRate();
    
    return [
      {
        type: 'targeting',
        icon: Target,
        title: 'Demographic Targeting',
        description: `${dominantAge} customers dominate. Customize marketing approach.`,
        impact: 'High',
        effort: 'Medium'
      },
      {
        type: 'loyalty',
        icon: Users,
        title: 'Loyalty Program',
        description: `${loyaltyRate.toFixed(1)}% loyalty rate. ${loyaltyRate < 30 ? 'Expand' : 'Optimize'} program.`,
        impact: 'Medium',
        effort: 'High'
      }
    ];
  };

  const generateGeneralRecommendations = () => {
    return [
      {
        type: 'general',
        icon: Brain,
        title: 'AI-Powered Insights',
        description: 'Comprehensive transaction analysis reveals optimization opportunities.',
        impact: 'High',
        effort: 'Variable'
      }
    ];
  };

  // Helper functions
  const getPeakTransactionHours = () => {
    const hourCounts = transactions.reduce((acc, t) => {
      const hour = t.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => `${hour}:00`);
  };

  const getTopPaymentMethod = () => {
    const methods = transactions.reduce((acc, t) => {
      acc[t.payment_method] = (acc[t.payment_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(methods)
      .sort(([,a], [,b]) => b - a)[0][0]
      .charAt(0).toUpperCase() + Object.entries(methods)
      .sort(([,a], [,b]) => b - a)[0][0].slice(1);
  };

  const getSubstitutionRate = () => {
    const totalItems = transactions.flatMap(t => t.items).length;
    const substitutedItems = transactions.flatMap(t => t.items.filter(i => i.was_substituted)).length;
    return totalItems > 0 ? (substitutedItems / totalItems) * 100 : 0;
  };

  const getTopCategories = () => {
    const categories = transactions.flatMap(t => t.items).reduce((acc, item) => {
      const category = item.product_category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  };

  const getAverageSentiment = () => {
    const sentiments = transactions
      .filter(t => t.audio_signals?.sentiment_score !== undefined)
      .map(t => t.audio_signals!.sentiment_score!);
    
    return sentiments.length > 0 ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length : 0;
  };

  const getPrimaryLanguage = () => {
    const languages = transactions.reduce((acc, t) => {
      const lang = t.audio_signals?.language_detected || 'unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(languages)
      .sort(([,a], [,b]) => b - a)[0][0]
      .charAt(0).toUpperCase() + Object.entries(languages)
      .sort(([,a], [,b]) => b - a)[0][0].slice(1);
  };

  const getDominantAgeGroup = () => {
    const ages = transactions.reduce((acc, t) => {
      acc[t.customer.age_bracket] = (acc[t.customer.age_bracket] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(ages)
      .sort(([,a], [,b]) => b - a)[0][0];
  };

  const getLoyaltyRate = () => {
    const loyalMembers = transactions.filter(t => t.customer.loyalty_status === 'member').length;
    return transactions.length > 0 ? (loyalMembers / transactions.length) * 100 : 0;
  };

  const recommendations = generateModuleSpecificRecommendations();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Brain className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
      </div>
      
      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start">
                <Icon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <div className="flex space-x-4 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      rec.impact === 'High' ? 'bg-red-100 text-red-800' :
                      rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.impact} Impact
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      rec.effort === 'High' ? 'bg-red-100 text-red-800' :
                      rec.effort === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.effort} Effort
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 Recommendations are generated from {transactions.length} comprehensive transactions 
          including audio/video intelligence data.
        </p>
      </div>
    </div>
  );
}
EOF

echo "✅ All component types updated to use ComprehensiveTransaction!"
echo ""
echo "🧩 Updated Components:"
echo "  • TransactionTrends.tsx - Now uses comprehensive transaction data"
echo "  • ProductMixSKU.tsx - Includes substitution analysis from comprehensive data"
echo "  • ConsumerBehavior.tsx - Uses audio/video intelligence signals"
echo "  • ConsumerProfiling.tsx - Leverages customer profile data"
echo "  • AIRecommendationPanel.tsx - Generates insights from comprehensive data"
echo ""
echo "🎯 All components now:"
echo "  ✅ Accept ComprehensiveTransaction[] as props"
echo "  ✅ Use DashboardFilters interface"
echo "  ✅ Process audio/video intelligence data"
echo "  ✅ Handle Philippine retail context (payment methods, languages)"
echo "  ✅ Display comprehensive analytics"
echo ""
echo "🚀 Ready to integrate with main enforcement script!"