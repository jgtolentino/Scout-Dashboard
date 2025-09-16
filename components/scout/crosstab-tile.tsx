"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface CrosstabData {
  row: string
  col: string 
  value: string
}

interface CrosstabResponse {
  rows: string
  cols: string
  metric: string
  data: CrosstabData[]
  total_records: number
}

interface CrosstabTileProps {
  title?: string
  description?: string
  rows: string
  cols: string
  metric: string
  dateRange?: { from: string; to: string }
}

export function CrosstabTile({ 
  title = "Cross-Tab Analysis",
  description = "Dynamic cross-tabulation of transaction data",
  rows, 
  cols, 
  metric,
  dateRange = { from: "2025-04-01", to: "2025-08-31" }
}: CrosstabTileProps) {
  const url = `/api/scout/crosstab?rows=${rows}&cols=${cols}&metric=${metric}&from=${dateRange.from}&to=${dateRange.to}`
  const { data, error, isLoading } = useSWR<CrosstabResponse>(url, fetcher)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading {rows} vs {cols} analysis...</CardDescription>
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>Error loading {rows} vs {cols} data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Failed to load cross-tab data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const crosstabData = data?.data || []
  
  // Create pivot table structure
  const rowKeys = [...new Set(crosstabData.map(d => d.row))].sort()
  const colKeys = [...new Set(crosstabData.map(d => d.col))].sort()
  
  const pivotTable: Record<string, Record<string, number>> = {}
  crosstabData.forEach(item => {
    if (!pivotTable[item.row]) pivotTable[item.row] = {}
    pivotTable[item.row][item.col] = parseFloat(item.value) || 0
  })

  // Calculate totals
  const rowTotals = rowKeys.map(row => ({
    row,
    total: colKeys.reduce((sum, col) => sum + (pivotTable[row]?.[col] || 0), 0)
  }))

  const colTotals = colKeys.map(col => ({
    col,
    total: rowKeys.reduce((sum, row) => sum + (pivotTable[row]?.[col] || 0), 0)
  }))

  const grandTotal = rowTotals.reduce((sum, rt) => sum + rt.total, 0)

  const formatMetric = (value: number) => {
    switch(metric) {
      case 'sales': return `₱${formatNumber(value)}`
      case 'baskets': return formatNumber(value)
      case 'lines': return formatNumber(value)
      case 'avg_basket_value': return `₱${formatNumber(value)}`
      default: return formatNumber(value)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} - {data?.total_records || 0} data points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-gray-200 p-2 text-left font-medium">
                      {rows.charAt(0).toUpperCase() + rows.slice(1)} / {cols.charAt(0).toUpperCase() + cols.slice(1)}
                    </th>
                    {colKeys.map(col => (
                      <th key={col} className="border border-gray-200 p-2 text-right font-medium">
                        {col}
                      </th>
                    ))}
                    <th className="border border-gray-200 p-2 text-right font-medium bg-blue-50">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowKeys.map((row, i) => (
                    <tr key={row} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 p-2 font-medium">
                        {row}
                      </td>
                      {colKeys.map(col => (
                        <td key={col} className="border border-gray-200 p-2 text-right">
                          {pivotTable[row]?.[col] ? formatMetric(pivotTable[row][col]) : '-'}
                        </td>
                      ))}
                      <td className="border border-gray-200 p-2 text-right font-medium bg-blue-50">
                        {formatMetric(rowTotals.find(rt => rt.row === row)?.total || 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 font-medium">
                    <td className="border border-gray-200 p-2">Total</td>
                    {colKeys.map(col => (
                      <td key={col} className="border border-gray-200 p-2 text-right">
                        {formatMetric(colTotals.find(ct => ct.col === col)?.total || 0)}
                      </td>
                    ))}
                    <td className="border border-gray-200 p-2 text-right font-bold">
                      {formatMetric(grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Top {rows.charAt(0).toUpperCase() + rows.slice(1)}</h4>
                <div className="space-y-2">
                  {rowTotals
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map(item => (
                    <div key={item.row} className="flex justify-between text-sm">
                      <span>{item.row}</span>
                      <span className="font-medium">{formatMetric(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Top {cols.charAt(0).toUpperCase() + cols.slice(1)}</h4>
                <div className="space-y-2">
                  {colTotals
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map(item => (
                    <div key={item.col} className="flex justify-between text-sm">
                      <span>{item.col}</span>
                      <span className="font-medium">{formatMetric(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded">
              <h4 className="font-medium mb-2">Analysis Summary</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Total {metric}:</span>
                  <span className="font-medium">{formatMetric(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data points:</span>
                  <span className="font-medium">{data?.total_records || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date range:</span>
                  <span className="font-medium">{dateRange.from} to {dateRange.to}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}