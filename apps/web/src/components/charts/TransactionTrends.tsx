import React, { useId, useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useFilters } from '../../context/FilterContext'
import { Skeleton } from '../ui/Skeleton'

interface TrendData {
  date: string
  revenue: number
  transactions: number
  avg_basket: number
}

export const TransactionTrends: React.FC = () => {
  const { filters, getFilterQuery } = useFilters()
  const chartId = useId()

  const { data, isLoading } = useQuery({
    queryKey: ['transaction-trends', filters],
    queryFn: async () => {
      let query = supabase
        .from('gold_daily_transaction_summary')
        .select('business_date, total_revenue, transaction_count, avg_basket_size')
        .order('business_date', { ascending: true })
        .limit(30)

      // Apply filters
      const filterQuery = getFilterQuery()
      if (filterQuery.region) query = query.eq('region', filterQuery.region)
      if (filterQuery.province) query = query.eq('province', filterQuery.province)
      if (filterQuery.city) query = query.eq('city', filterQuery.city)

      const { data: dbData } = await query

      // Transform data for recharts
      return (dbData || []).map(item => ({
        date: new Date(item.business_date).toLocaleDateString('en-PH', { 
          month: 'short', 
          day: 'numeric' 
        }),
        revenue: item.total_revenue,
        transactions: item.transaction_count,
        avg_basket: item.avg_basket_size,
      }))
    },
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  // Fallback data for demo
  const chartData = data?.length ? data : [
    { date: 'Jan 1', revenue: 125000, transactions: 342, avg_basket: 365 },
    { date: 'Jan 2', revenue: 132000, transactions: 358, avg_basket: 368 },
    { date: 'Jan 3', revenue: 128000, transactions: 349, avg_basket: 367 },
    { date: 'Jan 4', revenue: 142000, transactions: 389, avg_basket: 365 },
    { date: 'Jan 5', revenue: 155000, transactions: 412, avg_basket: 376 },
    { date: 'Jan 6', revenue: 148000, transactions: 398, avg_basket: 372 },
    { date: 'Jan 7', revenue: 162000, transactions: 425, avg_basket: 381 },
  ]

  // Generate accessibility summary
  const chartSummary = useMemo(() => {
    if (!chartData?.length) return 'No transaction data available.'
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
    const totalTransactions = chartData.reduce((sum, d) => sum + d.transactions, 0)
    const avgBasket = totalRevenue / totalTransactions
    const firstDate = chartData[0]?.date
    const lastDate = chartData[chartData.length - 1]?.date
    return `Transaction trends from ${firstDate} to ${lastDate}. Total revenue: ₱${totalRevenue.toLocaleString()}. Total transactions: ${totalTransactions.toLocaleString()}. Average basket size: ₱${Math.round(avgBasket)}.`
  }, [chartData])

  return (
    <figure className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl" aria-labelledby={`${chartId}-title`} aria-describedby={`${chartId}-desc`}>
      <div className="flex justify-between items-center mb-6">
        <h3 id={`${chartId}-title`} className="text-xl font-semibold">Transaction Trends</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg">
            7D
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            30D
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            90D
          </button>
        </div>
      </div>

      <div 
        className="focus:outline-none focus:ring-4 focus:ring-blue-500/35 focus:rounded-lg" 
        tabIndex={0}
        role="img"
        aria-label="Transaction trends area chart showing revenue and transaction count over time"
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any, name: string) => {
              if (name === 'revenue') return [`₱${value.toLocaleString()}`, 'Revenue']
              if (name === 'transactions') return [value, 'Transactions']
              return [value, name]
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#6366F1"
            fillOpacity={1}
            fill="url(#colorRevenue)"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="transactions"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', r: 3 }}
          />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <p id={`${chartId}-desc`} className="sr-only">{chartSummary}</p>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg font-semibold">₱{chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-lg font-semibold">{chartData.reduce((sum, d) => sum + d.transactions, 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Basket Size</p>
          <p className="text-lg font-semibold">₱{Math.round(chartData.reduce((sum, d) => sum + d.avg_basket, 0) / chartData.length)}</p>
        </div>
      </div>
    </figure>
  )
}