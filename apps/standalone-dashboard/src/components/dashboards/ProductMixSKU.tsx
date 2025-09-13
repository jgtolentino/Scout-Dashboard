import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Treemap,
  ComposedChart,
  Line,
} from 'recharts';
import { Package, TrendingUp, Award, GitBranch } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import { DataVisualizationKit } from '../widgets/DataVisualizationKit';
import { ResponsiveChart } from '../widgets/ResponsiveChart';

interface ProductMixSKUProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
}

export default function ProductMixSKU({ filters }: ProductMixSKUProps) {
  const { datasets } = useDataStore();

  // Generate category breakdown data
  const categoryBreakdown = useMemo(() => {
    const categories = ['Beverages', 'Snacks', 'Personal Care', 'Household', 'Tobacco'];
    return categories.map(cat => ({
      category: cat,
      transactions: Math.floor(Math.random() * 5000) + 2000,
      revenue: Math.floor(Math.random() * 500000) + 200000,
      percentage: Math.floor(Math.random() * 30) + 10,
    }));
  }, [filters]);

  // Generate brand performance data
  const brandPerformance = useMemo(() => {
    const brands = [
      'Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'P&G', 
      'Oishi', 'Jack n Jill', 'Lucky Me', 'San Miguel', 'Rebisco'
    ];
    return brands.map((brand, idx) => ({
      brand,
      revenue: Math.floor(Math.random() * 300000) + 100000 - idx * 10000,
      units: Math.floor(Math.random() * 50000) + 20000 - idx * 2000,
      growth: Math.random() * 40 - 10, // -10% to 30% growth
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filters]);

  // Generate top SKUs data
  const topSKUs = useMemo(() => {
    const skus = [
      { name: 'Coke Mismo', category: 'Beverages', units: 45320, revenue: 361000 },
      { name: 'Lucky Me Pancit Canton', category: 'Snacks', units: 38900, revenue: 389000 },
      { name: 'Marlboro Red', category: 'Tobacco', units: 32100, revenue: 642000 },
      { name: 'Safeguard Soap', category: 'Personal Care', units: 28700, revenue: 230000 },
      { name: 'Oishi Prawn Crackers', category: 'Snacks', units: 26500, revenue: 159000 },
      { name: 'C2 Green Tea', category: 'Beverages', units: 24300, revenue: 170100 },
      { name: 'Tide Powder', category: 'Household', units: 22100, revenue: 221000 },
      { name: 'Kopiko Black', category: 'Beverages', units: 21800, revenue: 87200 },
    ];
    return skus;
  }, [filters]);

  // Generate substitution patterns
  const substitutionPatterns = useMemo(() => {
    return [
      { from: 'Coca-Cola', to: 'Pepsi', frequency: 320, percentage: 15 },
      { from: 'Coca-Cola', to: 'RC Cola', frequency: 280, percentage: 13 },
      { from: 'Marlboro', to: 'Philip Morris', frequency: 240, percentage: 11 },
      { from: 'Safeguard', to: 'Palmolive', frequency: 210, percentage: 10 },
      { from: 'Lucky Me', to: 'Payless Pancit', frequency: 180, percentage: 8 },
    ];
  }, [filters]);

  // Treemap data for brand relationships
  const treemapData = useMemo(() => {
    const categories = ['Beverages', 'Snacks', 'Personal Care', 'Household', 'Tobacco'];
    return categories.map(cat => ({
      name: cat,
      children: brandPerformance.slice(0, 5).map(brand => ({
        name: brand.brand,
        size: brand.revenue,
        growth: brand.growth,
      }))
    }));
  }, [brandPerformance]);

  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Custom tooltip for treemap
  const CustomTreemapContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Revenue: ₱{(data.size / 1000).toFixed(0)}K</p>
          {data.growth !== undefined && (
            <p className={`text-sm ${data.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Growth: {data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Product Mix & SKU Analysis</h2>
        <p className="text-gray-600 mt-1">
          Category performance, brand relationships, and substitution patterns
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total SKUs</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">1,247</p>
              <p className="text-xs text-green-600 mt-1">+89 new this month</p>
            </div>
            <Package className="text-dashboard-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Brands</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">186</p>
              <p className="text-xs text-gray-500 mt-1">Across 5 categories</p>
            </div>
            <Award className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Items/Transaction</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">3.4</p>
              <p className="text-xs text-green-600 mt-1">↑ 5.2% vs last month</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Substitution Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">12.3%</p>
              <p className="text-xs text-amber-600 mt-1">When preferred unavailable</p>
            </div>
            <GitBranch className="text-amber-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={categoryBreakdown || []} 
              layout="horizontal"
              margin={{ top: 20, right: 60, bottom: 20, left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                stroke="#6b7280" 
                fontSize={11}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="transparent"
                fontSize={0}
                width={0}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'revenue') return `₱${(value / 1000).toFixed(0)}K`;
                  return value.toLocaleString();
                }}
              />
              <Bar 
                dataKey="transactions" 
                fill="#0ea5e9" 
                radius={[0, 4, 4, 0]}
                label={{
                  position: 'insideLeft',
                  fill: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (value: any, entry: any) => entry?.payload?.category || entry?.category || ''
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Brands Horizontal */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Top Brands Performance</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={(brandPerformance || []).slice(0, 8)} 
              layout="horizontal"
              margin={{ top: 20, right: 60, bottom: 20, left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                stroke="#6b7280" 
                fontSize={11}
                tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
              />
              <YAxis 
                type="category" 
                dataKey="brand" 
                stroke="transparent"
                fontSize={0}
                width={0}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'revenue') return `₱${(value / 1000).toFixed(0)}K`;
                  return value.toLocaleString();
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill="#f59e0b" 
                radius={[0, 4, 4, 0]}
                label={{
                  position: 'insideLeft',
                  fill: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (value: any, entry: any) => entry?.payload?.brand || entry?.brand || ''
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top SKUs Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Top SKUs by Revenue</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">SKU</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Category</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Units</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topSKUs.map((sku, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm">{sku.name}</td>
                    <td className="py-2 px-3 text-sm text-gray-600">{sku.category}</td>
                    <td className="py-2 px-3 text-sm text-right">{sku.units.toLocaleString()}</td>
                    <td className="py-2 px-3 text-sm text-right font-medium">
                      ₱{(sku.revenue / 1000).toFixed(0)}K
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Substitution Patterns */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch size={20} />
            Brand Substitution Patterns
          </h3>
          <div className="space-y-3">
            {substitutionPatterns.map((pattern, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{pattern.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">{pattern.to}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{pattern.frequency} times</span>
                  <span className="text-sm font-medium text-amber-600">{pattern.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Relationships Treemap */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Brand Category Relationships</h3>
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treemapData || []}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomTreemapContent />}
          >
            {treemapData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Advanced Visualizations Section */}
      <div className="col-span-full mt-8 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-purple-600" />
          Advanced Product Visualizations
          <span className="text-sm font-normal text-gray-500 ml-2">(Figma r19 Kit)</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Visualization Kit */}
          <div className="lg:col-span-2">
            <DataVisualizationKit 
              props={{ 
                title: "Product Mix Analytics Suite", 
                chartTypes: ["treemap", "sankey", "radar"],
                interactiveMode: true,
                dataSource: "product-analytics"
              }} 
              data={null} 
            />
          </div>
          
          {/* Responsive Chart */}
          <ResponsiveChart 
            props={{ 
              title: "Category Performance Matrix", 
              chartType: "bubble",
              responsive: true,
              showLegend: true
            }} 
            data={null} 
          />
          
          {/* Interactive Chart */}
          <InteractiveChart 
            props={{ 
              title: "SKU Performance Analysis", 
              chartType: "waterfall",
              showControls: true,
              dataFilters: ["category", "brand", "revenue"]
            }} 
            data={null} 
          />
        </div>
      </div>
    </div>
  );
}