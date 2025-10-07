"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { ProfilingData } from "@/lib/types/transactions"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function ProfilingPanel() {
  const { data, error, isLoading } = useSWR<{rows: ProfilingData[]}>("/api/scout/profiling", fetcher)
  const rows = data?.rows || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consumer Profiling</CardTitle>
          <CardDescription>Loading profiling data...</CardDescription>
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
          <CardTitle>Consumer Profiling</CardTitle>
          <CardDescription>Error loading profiling data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Failed to load data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group data by gender and age bracket for better visualization
  const genderData = rows.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.gender === curr.gender)
    if (existing) {
      existing.n += curr.n
      existing.avg_spend = (existing.avg_spend * existing.count + curr.avg_spend * curr.n) / (existing.count + curr.n)
      existing.count += curr.n
    } else {
      acc.push({ ...curr, count: curr.n })
    }
    return acc
  }, [])

  const ageData = rows.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.age_bracket === curr.age_bracket)
    if (existing) {
      existing.n += curr.n
      existing.avg_spend = (existing.avg_spend * existing.count + curr.avg_spend * curr.n) / (existing.count + curr.n)
      existing.count += curr.n
    } else {
      acc.push({ ...curr, count: curr.n })
    }
    return acc
  }, [])

  // Calculate totals
  const totalCustomers = rows.reduce((sum, row) => sum + row.n, 0)
  const overallAvgSpend = rows.reduce((sum, row) => sum + (row.avg_spend * row.n), 0) / totalCustomers

  // Find highest spending segments
  const highestSpendingGender = genderData.sort((a, b) => b.avg_spend - a.avg_spend)[0]
  const highestSpendingAge = ageData.sort((a, b) => b.avg_spend - a.avg_spend)[0]

  return (
    <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalCustomers)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallAvgSpend)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Gender Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">
              {highestSpendingGender?.gender || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(highestSpendingGender?.avg_spend || 0)} avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Age Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {highestSpendingAge?.age_bracket || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(highestSpendingAge?.avg_spend || 0)} avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Distribution by Gender</CardTitle>
            <CardDescription>Number of customers and average spending by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={genderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gender" />
                <YAxis yAxisId="left" tickFormatter={formatNumber} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip 
                  formatter={[
                    (value: number, name: string) => name === 'avg_spend' 
                      ? [formatCurrency(value), 'Avg Spend'] 
                      : [formatNumber(value), 'Count']
                  ]} 
                />
                <Bar yAxisId="left" dataKey="n" fill="#8884d8" name="count" />
                <Bar yAxisId="right" dataKey="avg_spend" fill="#82ca9d" name="avg_spend" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Distribution by Age</CardTitle>
            <CardDescription>Number of customers and average spending by age bracket</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData.sort((a, b) => a.age_bracket.localeCompare(b.age_bracket))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age_bracket" />
                <YAxis yAxisId="left" tickFormatter={formatNumber} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip 
                  formatter={[
                    (value: number, name: string) => name === 'avg_spend' 
                      ? [formatCurrency(value), 'Avg Spend'] 
                      : [formatNumber(value), 'Count']
                  ]} 
                />
                <Bar yAxisId="left" dataKey="n" fill="#8884d8" name="count" />
                <Bar yAxisId="right" dataKey="avg_spend" fill="#ff7300" name="avg_spend" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scatter Plot - Customer Volume vs Average Spend */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments Analysis</CardTitle>
          <CardDescription>Customer volume vs average spending by demographic segment</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="n" tickFormatter={formatNumber} name="Customer Count" />
              <YAxis dataKey="avg_spend" tickFormatter={(v) => formatCurrency(v)} name="Avg Spend" />
              <ZAxis range={[64, 144]} />
              <Tooltip 
                formatter={[
                  (value: number, name: string) => name === 'avg_spend' 
                    ? [formatCurrency(value), 'Avg Spend'] 
                    : [formatNumber(value), 'Customer Count']
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload
                    return `${data.gender} - ${data.age_bracket}`
                  }
                  return label
                }}
              />
              <Scatter fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Profiling Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Customer Profile</CardTitle>
          <CardDescription>Complete breakdown by gender and age bracket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Gender</th>
                  <th className="p-3 text-left font-medium">Age Bracket</th>
                  <th className="p-3 text-right font-medium">Customers</th>
                  <th className="p-3 text-right font-medium">Percentage</th>
                  <th className="p-3 text-right font-medium">Avg Spend</th>
                  <th className="p-3 text-right font-medium">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .sort((a, b) => b.n - a.n)
                  .map((row, index) => (
                  <tr key={`${row.gender}-${row.age_bracket}`} className={index % 2 === 0 ? 'bg-muted/25' : ''}>
                    <td className="p-3 font-medium capitalize">{row.gender}</td>
                    <td className="p-3">{row.age_bracket}</td>
                    <td className="p-3 text-right">{formatNumber(row.n)}</td>
                    <td className="p-3 text-right">{((row.n / totalCustomers) * 100).toFixed(1)}%</td>
                    <td className="p-3 text-right">{formatCurrency(row.avg_spend)}</td>
                    <td className="p-3 text-right">{formatCurrency(row.avg_spend * row.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}