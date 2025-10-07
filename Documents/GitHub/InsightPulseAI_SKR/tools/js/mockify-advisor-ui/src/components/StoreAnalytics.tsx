
import React from "react";
import { TypographyH3, TypographyP } from "./Typography";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Building2, TrendingUp, ShoppingCart, Package } from "lucide-react";
import StatusBadge from "./StatusBadge";

const salesData = [
  { date: 'Jan', revenue: 42500, transactions: 1250, growth: 5 },
  { date: 'Feb', revenue: 45000, transactions: 1300, growth: 6 },
  { date: 'Mar', revenue: 47500, transactions: 1350, growth: 5.5 },
  { date: 'Apr', revenue: 51000, transactions: 1450, growth: 7.4 },
  { date: 'May', revenue: 53500, transactions: 1550, growth: 4.9 },
  { date: 'Jun', revenue: 56000, transactions: 1650, growth: 4.7 },
];

const topProducts = [
  { name: 'Product A', sales: 4200, growth: 12 },
  { name: 'Product B', sales: 3800, growth: 8 },
  { name: 'Product C', sales: 3200, growth: -2 },
  { name: 'Product D', sales: 2900, growth: 5 },
  { name: 'Product E', sales: 2700, growth: 10 },
];

interface StoreAnalyticsProps {
  className?: string;
}

const StoreAnalytics: React.FC<StoreAnalyticsProps> = ({ className }) => {
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="text-azure-blue" size={20} />
        <TypographyH3>Sari-Sari Store Analytics</TypographyH3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trends */}
        <div className="glass-panel p-5 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-azure-blue" />
              <h4 className="font-medium">Revenue Trends</h4>
            </div>
            <StatusBadge label="Growing" status="success" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-100 shadow-sm rounded-md">
                          <p className="text-sm font-medium">{`${label}`}</p>
                          <p className="text-sm">{`Revenue: ₱${payload[0].value.toLocaleString()}`}</p>
                          <p className="text-sm">{`Growth: ${payload[0].payload.growth}%`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#0078D4" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-3">
            <TypographyP className="text-sm text-gray-600">6-month trend</TypographyP>
            <TypographyP className="text-sm font-medium">+5.6% average growth</TypographyP>
          </div>
        </div>
        
        {/* Top Products */}
        <div className="glass-panel p-5 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-azure-blue" />
              <h4 className="font-medium">Top Products</h4>
            </div>
            <button className="text-sm text-azure-blue hover:underline">View all</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-100 shadow-sm rounded-md">
                          <p className="text-sm font-medium">{`${label}`}</p>
                          <p className="text-sm">{`Sales: ₱${payload[0].value.toLocaleString()}`}</p>
                          <p className="text-sm">{`Growth: ${payload[0].payload.growth}%`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="sales" fill="#50E6FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-3">
            <TypographyP className="text-sm text-gray-600">Based on last 30 days</TypographyP>
            <TypographyP className="text-sm font-medium">AI recommended restocking</TypographyP>
          </div>
        </div>
      </div>
      
      <div className="glass-panel p-5 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-azure-blue" />
            <h4 className="font-medium">Transaction Analytics</h4>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-sm bg-white/50 border border-gray-200 rounded px-2 py-1">
              <option>Last 6 months</option>
              <option>Last 3 months</option>
              <option>Last month</option>
            </select>
            <button className="text-sm text-azure-blue hover:underline">Export</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Month</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Avg. Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Growth</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((month, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{month.date}</td>
                  <td className="py-3 px-4 text-sm text-right">{month.transactions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right">₱{(month.revenue / month.transactions).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-right font-medium">₱{month.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${month.growth >= 5 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      +{month.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-center">
          <TypographyP className="text-sm text-gray-600">
            AI Analysis: Store traffic increasing by 4.2% month-over-month with average transaction value growing steadily.
          </TypographyP>
        </div>
      </div>
    </div>
  );
};

export default StoreAnalytics;
