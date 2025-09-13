import { MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductMix() {
  const { categoryData, brandData, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ["hsl(var(--primary))", "hsl(42 100% 50%)", "hsl(142 76% 36%)", "hsl(0 84% 60%)"];

  return (
    <div className="space-y-6">
      {/* Category Mix Chart */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Category Mix</CardTitle>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData?.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.category}</span>
                </div>
                <span className="font-medium">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top SKUs */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Top Brands</CardTitle>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={brandData} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                  tickFormatter={(value) => `₱${(value/1000).toFixed(0)}K`}
                />
                <YAxis 
                  type="category"
                  dataKey="brand"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#666' }}
                  width={120}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <Bar 
                  dataKey="sales" 
                  radius={[0, 4, 4, 0]}
                >
                  {brandData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
