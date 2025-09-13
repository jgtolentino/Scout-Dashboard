'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/formatters'
import { format, subMonths, startOfMonth } from 'date-fns'

interface MonthData {
  month: string
  advanced: number
  liquidated: number
  pending: number
}

export function CashAdvanceBar() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['cash-advances', user?.id],
    queryFn: async () => {
      const months: MonthData[] = []
      
      // Get data for last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        
        // Get cash advances for this month
        const { data: advances } = await supabase
          .from('cash_advances')
          .select('amount, status, liquidation_amount')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
        
        const monthData: MonthData = {
          month: format(monthDate, 'MMM'),
          advanced: 0,
          liquidated: 0,
          pending: 0
        }
        
        advances?.forEach(advance => {
          monthData.advanced += advance.amount
          if (advance.status === 'Liquidated') {
            monthData.liquidated += advance.liquidation_amount || 0
          } else if (advance.status === 'Pending') {
            monthData.pending += advance.amount
          }
        })
        
        months.push(monthData)
      }
      
      return months
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-tbwa-gray-800 p-3 rounded-lg shadow-lg border border-tbwa-gray-200 dark:border-tbwa-gray-700">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="month" 
            className="text-sm"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-sm"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value) => formatCurrency(value, 'USD', 'en-US').replace(/\.\d+/, '')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="advanced" 
            name="Advanced" 
            fill="#FFD700" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="liquidated" 
            name="Liquidated" 
            fill="#4ECDC4" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="pending" 
            name="Pending" 
            fill="#FF6B6B" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}