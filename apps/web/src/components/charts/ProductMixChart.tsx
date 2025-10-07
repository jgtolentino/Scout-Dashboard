import React, { useId, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useFilters } from '../../context/FilterContext'
import { Skeleton } from '../ui/Skeleton'

interface CategoryData {
  name: string
  value: number
  percentage: number
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444']

export const ProductMixChart: React.FC = () => {
  const { filters, getFilterQuery } = useFilters()
  const chartId = useId()

  const { data, isLoading } = useQuery({
    queryKey: ['product-mix', filters],
    queryFn: async () => {
      let query = supabase
        .from('gold_category_performance')
        .select('category_name, total_revenue')
        .order('total_revenue', { ascending: false })
        .limit(7)

      // Apply filters
      const filterQuery = getFilterQuery()
      if (filterQuery.region) query = query.eq('region', filterQuery.region)
      if (filterQuery.province) query = query.eq('province', filterQuery.province)
      if (filterQuery.city) query = query.eq('city', filterQuery.city)

      const { data: dbData } = await query

      // Calculate percentages
      const total = (dbData || []).reduce((sum, item) => sum + item.total_revenue, 0)
      return (dbData || []).map(item => ({
        name: item.category_name,
        value: item.total_revenue,
        percentage: (item.total_revenue / total) * 100,
      }))
    },
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
    { name: 'Beverages', value: 450000, percentage: 28 },
    { name: 'Snacks', value: 380000, percentage: 23 },
    { name: 'Personal Care', value: 320000, percentage: 20 },
    { name: 'Tobacco', value: 250000, percentage: 15 },
    { name: 'Household', value: 140000, percentage: 9 },
    { name: 'Others', value: 80000, percentage: 5 },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            ₱{payload[0].value.toLocaleString()} ({payload[0].payload.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`
  }

  // Generate accessibility summary
  const chartSummary = useMemo(() => {
    if (!chartData?.length) return 'No product mix data available.'
    const totalRevenue = chartData.reduce((sum, d) => sum + d.value, 0)
    const topCategory = chartData[0]
    const categoriesAbove10Percent = chartData.filter(d => d.percentage >= 10).length
    return `Product mix pie chart showing ${chartData.length} categories. Total revenue: ₱${totalRevenue.toLocaleString()}. Top category: ${topCategory?.name} at ${topCategory?.percentage.toFixed(1)}% (₱${topCategory?.value.toLocaleString()}). ${categoriesAbove10Percent} categories represent 10% or more of total revenue.`
  }, [chartData])

  return (
    <figure className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl" aria-labelledby={`${chartId}-title`} aria-describedby={`${chartId}-desc`}>
      <div className="flex justify-between items-center mb-6">
        <h3 id={`${chartId}-title`} className="text-xl font-semibold">Product Mix</h3>
        <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white">
          <option>By Revenue</option>
          <option>By Volume</option>
          <option>By Transactions</option>
        </select>
      </div>

      <div 
        className="focus:outline-none focus:ring-4 focus:ring-blue-500/35 focus:rounded-lg" 
        tabIndex={0}
        role="img"
        aria-label="Product mix pie chart showing revenue distribution by category"
      >
        <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      </div>
      
      <p id={`${chartId}-desc`} className="sr-only">{chartSummary}</p>

      <div className="mt-6 space-y-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-medium">₱{(item.value / 1000).toFixed(0)}k</span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Revenue</span>
          <span className="font-semibold">₱{chartData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</span>
        </div>
      </div>
    </figure>
  )
}