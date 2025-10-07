"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  Line,
  LineChart
} from "recharts"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { TrendData } from "@/lib/types/transactions"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function TrendsPanel() {
  const { data, error, isLoading } = useSWR<{rows: TrendData[]}>("/api/scout/trends", fetcher)
  const rows = data?.rows || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Trends</CardTitle>
          <CardDescription>Loading trend data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Trends</CardTitle>
          <CardDescription>Error loading trend data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Failed to load data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalTransactions = rows.reduce((sum, row) => sum + row.tx_count, 0)
  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0)
  const avgTransaction = totalSales / totalTransactions

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Summary Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalTransactions)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(avgTransaction)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rows.length}</div>
        </CardContent>
      </Card>

      {/* Transaction Volume Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
          <CardDescription>Daily transaction count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={[(value: number) => [formatNumber(value), 'Transactions']]}
              />
              <Area 
                type="monotone" 
                dataKey="tx_count" 
                stroke="#8884d8" 
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales Value Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales Value</CardTitle>
          <CardDescription>Daily sales amount over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={[(value: number) => [formatCurrency(value), 'Sales']]}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}