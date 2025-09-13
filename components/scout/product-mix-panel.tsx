"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ComposedChart,
  Line,
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  PieChart,
  Pie,
  Cell 
} from "recharts"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { ProductMixData } from "@/lib/types/transactions"

const fetcher = (url: string) => fetch(url).then(r => r.json())

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1']

export function ProductMixPanel() {
  const { data: categoryData, error: categoryError, isLoading: categoryLoading } = useSWR<{rows: ProductMixData[]}>("/api/scout/product-mix?group=category", fetcher)
  const { data: brandData, error: brandError, isLoading: brandLoading } = useSWR<{rows: ProductMixData[]}>("/api/scout/product-mix?group=brand", fetcher)
  
  const categories = categoryData?.rows || []
  const brands = brandData?.rows || []
  
  // Calculate cumulative percentages for Pareto analysis
  const totalBrand = brands.reduce((sum, b) => sum + b.n, 0)
  const brandsWithCumulative = brands.map((b, i) => {
    const cumSum = brands.slice(0, i + 1).reduce((sum, item) => sum + item.n, 0)
    return {
      ...b,
      cumulative: (cumSum / totalBrand) * 100
    }
  })

  // Top categories for pie chart
  const topCategories = categories.slice(0, 8).map((cat, index) => ({
    ...cat,
    fill: COLORS[index % COLORS.length]
  }))

  if (categoryLoading || brandLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Loading category data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Brand Analysis</CardTitle>
            <CardDescription>Loading brand data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (categoryError || brandError) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Error loading data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Failed to load category data</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Brand Analysis</CardTitle>
            <CardDescription>Error loading data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Failed to load brand data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Category Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Transaction distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ product_category, percent }: any) => 
                    percent > 5 ? `${product_category}: ${(percent || 0).toFixed(0)}%` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="n"
                >
                  {topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={[(value: number, name: string) => [formatNumber(value), 'Transactions']]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories by Volume</CardTitle>
            <CardDescription>Transaction count by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categories.slice(0, 10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis dataKey="product_category" type="category" width={100} />
                <Tooltip formatter={[(value: number) => [formatNumber(value), 'Transactions']]} />
                <Bar dataKey="n" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Brand Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand Performance</CardTitle>
            <CardDescription>Top brands by sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brands.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brand_name" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={[(value: number) => [formatCurrency(value), 'Sales']]} />
                <Bar dataKey="total_sales" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Pareto Analysis</CardTitle>
            <CardDescription>80/20 analysis of brand performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={brandsWithCumulative.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brand_name" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" tickFormatter={formatNumber} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip 
                  formatter={[
                    (value: number, name: string) => name === 'cumulative' 
                      ? [`${value.toFixed(1)}%`, 'Cumulative %'] 
                      : [formatNumber(value), 'Transactions']
                  ]} 
                />
                <Bar yAxisId="left" dataKey="n" fill="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ff7300" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{categories[0]?.product_category || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(categories[0]?.n || 0)} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{brands[0]?.brand_name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(brands[0]?.total_sales || 0)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}