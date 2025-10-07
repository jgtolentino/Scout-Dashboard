import React, { useId, useMemo } from 'react'
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
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useFilters } from '../../context/FilterContext'
import { Skeleton } from '../ui/Skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface BrandData {
  brand: string
  revenue: number
  growth: number
  marketShare: number
}

export const BrandPerformance: React.FC = () => {
  const { filters, getFilterQuery } = useFilters()
  const chartId = useId()

  const { data, isLoading } = useQuery({
    queryKey: ['brand-performance', filters],
    queryFn: async () => {
      let query = supabase
        .from('gold_brand_performance_summary')
        .select('brand_name, total_revenue, growth_rate, market_share')
        .order('total_revenue', { ascending: false })
        .limit(10)

      // Apply filters
      const filterQuery = getFilterQuery()
      if (filterQuery.region) query = query.eq('region', filterQuery.region)
      if (filterQuery.province) query = query.eq('province', filterQuery.province)
      if (filterQuery.city) query = query.eq('city', filterQuery.city)

      const { data: dbData } = await query

      return (dbData || []).map(item => ({
        brand: item.brand_name,
        revenue: item.total_revenue,
        growth: item.growth_rate || 0,
        marketShare: item.market_share || 0,
      }))
    },
  })

  if (isLoading) {
    return (
      <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Fallback data for demo
  const chartData = data?.length ? data : [
    { brand: 'Coca-Cola', revenue: 380000, growth: 12.5, marketShare: 18.5 },
    { brand: 'San Miguel', revenue: 320000, growth: 8.3, marketShare: 15.6 },
    { brand: 'Lucky Me', revenue: 280000, growth: -2.1, marketShare: 13.7 },
    { brand: 'Marlboro', revenue: 250000, growth: 5.7, marketShare: 12.2 },
    { brand: 'C2', revenue: 220000, growth: 15.3, marketShare: 10.7 },
    { brand: 'Kopiko', revenue: 180000, growth: 3.2, marketShare: 8.8 },
    { brand: 'Jack n Jill', revenue: 150000, growth: -1.5, marketShare: 7.3 },
    { brand: 'Nescafe', revenue: 140000, growth: 6.8, marketShare: 6.8 },
    { brand: 'Chippy', revenue: 120000, growth: 9.2, marketShare: 5.9 },
    { brand: 'Palmolive', revenue: 85000, growth: -3.4, marketShare: 4.1 },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/95 p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium mb-2">{data.brand}</p>
          <div className="space-y-1 text-sm">
            <p>Revenue: ₱{data.revenue.toLocaleString()}</p>
            <p className="flex items-center gap-1">
              Growth: 
              {data.growth > 0 ? (
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3" /> +{data.growth}%
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="w-3 h-3" /> {data.growth}%
                </span>
              )}
            </p>
            <p>Market Share: {data.marketShare}%</p>
          </div>
        </div>
      )
    }
    return null
  }

  // Generate accessibility summary
  const chartSummary = useMemo(() => {
    if (!chartData?.length) return 'No brand performance data available.'
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
    const avgGrowth = chartData.reduce((sum, d) => sum + d.growth, 0) / chartData.length
    const topBrand = chartData[0]
    const positiveGrowthBrands = chartData.filter(d => d.growth > 0).length
    return `Brand performance chart showing ${chartData.length} brands. Total revenue: ₱${totalRevenue.toLocaleString()}. Average growth: ${avgGrowth.toFixed(1)}%. Top performer: ${topBrand?.brand} with ₱${topBrand?.revenue.toLocaleString()} revenue and ${topBrand?.growth}% growth. ${positiveGrowthBrands} of ${chartData.length} brands showing positive growth.`
  }, [chartData])

  return (
    <figure className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl" aria-labelledby={`${chartId}-title`} aria-describedby={`${chartId}-desc`}>
      <div className="flex justify-between items-center mb-6">
        <h3 id={`${chartId}-title`} className="text-xl font-semibold">Brand Performance</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg">
            Revenue
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Growth
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Market Share
          </button>
        </div>
      </div>

      <div 
        className="focus:outline-none focus:ring-4 focus:ring-blue-500/35 focus:rounded-lg" 
        tabIndex={0}
        role="img"
        aria-label="Brand performance bar chart showing revenue, growth, and market share data"
      >
        <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="brand" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.growth > 0 ? '#10B981' : '#EF4444'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      
      <p id={`${chartId}-desc`} className="sr-only">{chartSummary}</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Top Performer</p>
          <p className="font-semibold">{chartData[0]?.brand}</p>
          <p className="text-xs text-green-600">+{chartData[0]?.growth}%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Brands</p>
          <p className="font-semibold">{chartData.length}</p>
          <p className="text-xs text-gray-500">In Analysis</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg Growth</p>
          <p className="font-semibold">
            {(chartData.reduce((sum, d) => sum + d.growth, 0) / chartData.length).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">YoY</p>
        </div>
      </div>
    </figure>
  )
}