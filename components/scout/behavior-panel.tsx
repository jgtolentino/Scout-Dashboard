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
  PieChart,
  Pie,
  Cell
} from "recharts"
import { formatNumber } from "@/lib/utils"
import type { BehaviorData } from "@/lib/types/transactions"

const fetcher = (url: string) => fetch(url).then(r => r.json())

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function BehaviorPanel() {
  const { data, error, isLoading } = useSWR<{rows: BehaviorData[]}>("/api/scout/behavior", fetcher)
  const rows = data?.rows || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consumer Behavior</CardTitle>
          <CardDescription>Loading behavior data...</CardDescription>
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
          <CardTitle>Consumer Behavior</CardTitle>
          <CardDescription>Error loading behavior data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Failed to load data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const behaviorWithColors = rows.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }))

  const totalRequests = rows.reduce((sum, row) => sum + row.n, 0)
  const overallAcceptanceRate = rows.reduce((sum, row) => sum + (row.acceptance_rate * row.n), 0) / totalRequests

  return (
    <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalRequests)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(overallAcceptanceRate * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Request Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {rows.sort((a, b) => b.acceptance_rate - a.acceptance_rate)[0]?.request_type || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {((rows.sort((a, b) => b.acceptance_rate - a.acceptance_rate)[0]?.acceptance_rate || 0) * 100).toFixed(1)}% success
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {rows.sort((a, b) => b.n - a.n)[0]?.request_type || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(rows.sort((a, b) => b.n - a.n)[0]?.n || 0)} requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Type Distribution</CardTitle>
            <CardDescription>How consumers make product requests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={behaviorWithColors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ request_type, percent }: any) => 
                    `${request_type}: ${(percent || 0).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="n"
                >
                  {behaviorWithColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={[(value: number) => [formatNumber(value), 'Requests']]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceptance Rate by Request Type</CardTitle>
            <CardDescription>Success rate for different request styles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="request_type" />
                <YAxis 
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                />
                <Tooltip 
                  formatter={[(value: number) => [`${(value * 100).toFixed(1)}%`, 'Acceptance Rate']]}
                />
                <Bar dataKey="acceptance_rate" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Request Type Details</CardTitle>
          <CardDescription>Detailed breakdown of consumer behavior patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Request Type</th>
                  <th className="p-3 text-right font-medium">Count</th>
                  <th className="p-3 text-right font-medium">Percentage</th>
                  <th className="p-3 text-right font-medium">Acceptance Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.request_type} className={index % 2 === 0 ? 'bg-muted/25' : ''}>
                    <td className="p-3 font-medium capitalize">{row.request_type}</td>
                    <td className="p-3 text-right">{formatNumber(row.n)}</td>
                    <td className="p-3 text-right">{((row.n / totalRequests) * 100).toFixed(1)}%</td>
                    <td className="p-3 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.acceptance_rate > 0.7 
                          ? 'bg-green-100 text-green-800' 
                          : row.acceptance_rate > 0.4 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {(row.acceptance_rate * 100).toFixed(1)}%
                      </span>
                    </td>
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