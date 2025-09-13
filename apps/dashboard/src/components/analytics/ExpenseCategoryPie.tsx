'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/formatters'

const COLORS = [
  '#FFD700', // TBWA Yellow
  '#FFC700', // Darker Yellow
  '#FFED4E', // Lighter Yellow
  '#FF9500', // Orange
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
]

interface CategoryData {
  name: string
  value: number
  percentage: number
}

export function ExpenseCategoryPie() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['expense-categories', user?.id],
    queryFn: async () => {
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('expense_category, amount')
        .eq('status', 'Approved')
        .gte('expense_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      if (error) throw error

      // Group by category
      const categoryTotals = expenses?.reduce((acc, expense) => {
        const category = expense.expense_category || 'Other'
        acc[category] = (acc[category] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      // Calculate total
      const total = Object.values(categoryTotals || {}).reduce((sum, val) => sum + val, 0)

      // Transform to chart data
      return Object.entries(categoryTotals || {})
        .map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white dark:bg-tbwa-gray-800 p-3 rounded-lg shadow-lg border border-tbwa-gray-200 dark:border-tbwa-gray-700">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-tbwa-gray-600 dark:text-tbwa-gray-400">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-tbwa-gray-600 dark:text-tbwa-gray-400">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="black"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data || []}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm">
                {value} ({entry.payload.percentage.toFixed(1)}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}