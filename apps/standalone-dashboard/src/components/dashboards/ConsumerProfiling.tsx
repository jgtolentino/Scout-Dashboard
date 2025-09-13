import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Users, MapPin, Calendar, TrendingUp, User, Home } from 'lucide-react';
import useDataStore from '@/store/dataStore';

interface ConsumerProfilingProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
}

export default function ConsumerProfiling({ filters }: ConsumerProfilingProps) {
  const { datasets } = useDataStore();

  // Gender distribution
  const genderDistribution = useMemo(() => {
    return [
      { gender: 'Female', count: 5890, percentage: 57.5 },
      { gender: 'Male', count: 4357, percentage: 42.5 },
    ];
  }, [filters]);

  // Age bracket distribution
  const ageDistribution = useMemo(() => {
    return [
      { age: '18-24', count: 1850, percentage: 18.0, avgSpend: 180 },
      { age: '25-34', count: 3200, percentage: 31.2, avgSpend: 280 },
      { age: '35-44', count: 2580, percentage: 25.2, avgSpend: 320 },
      { age: '45-54', count: 1680, percentage: 16.4, avgSpend: 350 },
      { age: '55+', count: 937, percentage: 9.2, avgSpend: 290 },
    ];
  }, [filters]);

  // Location distribution (Philippine regions)
  const locationDistribution = useMemo(() => {
    return [
      { region: 'NCR', customers: 3850, percentage: 37.6, avgTransaction: 320 },
      { region: 'Region III', customers: 1890, percentage: 18.4, avgTransaction: 280 },
      { region: 'Region IV-A', customers: 2100, percentage: 20.5, avgTransaction: 290 },
      { region: 'Region VII', customers: 1420, percentage: 13.9, avgTransaction: 260 },
      { region: 'Others', customers: 987, percentage: 9.6, avgTransaction: 240 },
    ];
  }, [filters]);

  // Customer lifetime value segments
  const lifetimeValueSegments = useMemo(() => {
    return [
      { segment: 'High Value', customers: 1250, ltv: 45000, frequency: 5.2 },
      { segment: 'Medium Value', customers: 4300, ltv: 18000, frequency: 3.1 },
      { segment: 'Low Value', customers: 3200, ltv: 5500, frequency: 1.8 },
      { segment: 'New Customers', customers: 1497, ltv: 1200, frequency: 0.8 },
    ];
  }, [filters]);

  // Purchase behavior by demographics
  const demographicBehavior = useMemo(() => {
    return [
      { group: 'Young Urban Female', size: 2100, avgBasket: 280, topCategory: 'Personal Care' },
      { group: 'Middle-aged Male', size: 1800, avgBasket: 350, topCategory: 'Tobacco' },
      { group: 'Senior Female', size: 950, avgBasket: 320, topCategory: 'Household' },
      { group: 'Young Professional', size: 2400, avgBasket: 380, topCategory: 'Beverages' },
      { group: 'Family Shoppers', size: 2997, avgBasket: 450, topCategory: 'Snacks' },
    ];
  }, [filters]);

  // Household composition
  const householdComposition = useMemo(() => {
    return [
      { type: 'Single', count: 1850, percentage: 18 },
      { type: 'Couple', count: 2200, percentage: 21.5 },
      { type: 'Small Family (3-4)', count: 3600, percentage: 35.1 },
      { type: 'Large Family (5+)', count: 2597, percentage: 25.4 },
    ];
  }, [filters]);

  // Scatter plot data for age vs spend
  const ageSpendScatter = useMemo(() => {
    // Generate 100 sample points
    return Array.from({ length: 100 }, () => ({
      age: 18 + Math.random() * 50,
      spend: 100 + Math.random() * 500 + (Math.random() > 0.5 ? Math.random() * 200 : 0),
      transactions: Math.floor(Math.random() * 10) + 1,
    }));
  }, [filters]);

  // Location heatmap data
  const locationHeatmap = useMemo(() => {
    const barangays = [
      'Poblacion', 'San Isidro', 'San Rafael', 'Santo Niño', 'San Antonio',
      'Bagong Silang', 'Maligaya', 'Bagong Pag-asa', 'Malaya', 'Masagana'
    ];
    
    return barangays.map(brgy => ({
      name: brgy,
      value: Math.floor(Math.random() * 500) + 200,
      density: Math.random() * 100,
    }));
  }, [filters]);

  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const genderColors = ['#ec4899', '#3b82f6'];

  // Custom treemap content
  const CustomTreemapContent = ({ x, y, width, height, name, value }: any) => {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: colors[Math.floor(Math.random() * colors.length)],
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
          }}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={14}
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={12}
            >
              {value}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Consumer Profiling</h2>
        <p className="text-gray-600 mt-1">
          Demographics, location analysis, and customer segmentation
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">10,247</p>
              <p className="text-xs text-green-600 mt-1">+892 new this month</p>
            </div>
            <Users className="text-dashboard-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Customer Age</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">34.2</p>
              <p className="text-xs text-gray-500 mt-1">Years old</p>
            </div>
            <Calendar className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage Areas</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">47</p>
              <p className="text-xs text-amber-600 mt-1">Barangays served</p>
            </div>
            <MapPin className="text-amber-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Household Size</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">4.3</p>
              <p className="text-xs text-gray-500 mt-1">Members per household</p>
            </div>
            <Home className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="count"
              >
                {genderDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={genderColors[index]} />
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
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                formatter={(value: any, entry: any) => 
                  `${entry.payload.gender}: ${entry.payload.percentage}%`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="age" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'avgSpend') return `₱${value}`;
                  return value.toLocaleString();
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              <Bar dataKey="avgSpend" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
          <div className="space-y-3">
            {locationDistribution.map((region, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colors[idx % colors.length] }}
                  />
                  <div>
                    <p className="font-medium">{region.region}</p>
                    <p className="text-sm text-gray-600">
                      {region.customers.toLocaleString()} customers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{region.percentage}%</p>
                  <p className="text-sm text-gray-600">₱{region.avgTransaction} avg</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Household Composition */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Home size={20} />
            Household Composition
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={householdComposition}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {householdComposition.map((entry, index) => (
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
                formatter={(value: any, entry: any) => entry.payload.type}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age vs Spending Scatter */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Age vs Average Spending Pattern</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              dataKey="age" 
              name="Age" 
              unit=" years"
              stroke="#6b7280" 
              fontSize={12}
              domain={[18, 70]}
            />
            <YAxis 
              type="number" 
              dataKey="spend" 
              name="Spend" 
              unit="₱"
              stroke="#6b7280" 
              fontSize={12}
            />
            <ZAxis type="number" dataKey="transactions" range={[20, 200]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'Spend') return `₱${value.toFixed(0)}`;
                if (name === 'Age') return `${value.toFixed(0)} years`;
                return value;
              }}
            />
            <Scatter 
              name="Customers" 
              data={ageSpendScatter} 
              fill="#0ea5e9"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Customer Lifetime Value Segments</h3>
          <div className="space-y-3">
            {lifetimeValueSegments.map((segment, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold" style={{ color: colors[idx] }}>
                      {segment.segment}
                    </p>
                    <p className="text-sm text-gray-600">
                      {segment.customers.toLocaleString()} customers
                    </p>
                  </div>
                  <p className="text-lg font-bold">₱{(segment.ltv / 1000).toFixed(0)}K</p>
                </div>
                <div className="text-xs text-gray-500">
                  Avg frequency: {segment.frequency}x per week
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographic Behavior Groups */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Demographic Behavior Groups</h3>
          <div className="space-y-3">
            {demographicBehavior.map((group, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{group.group}</p>
                  <p className="text-sm text-gray-600">
                    {group.size.toLocaleString()} customers | ₱{group.avgBasket} avg
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-medium"
                    style={{ color: colors[idx % colors.length] }}>
                    {group.topCategory}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Heatmap */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Barangay Customer Density</h3>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={locationHeatmap}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomTreemapContent />}
          />
        </ResponsiveContainer>
      </div>
    </div>
  );
}