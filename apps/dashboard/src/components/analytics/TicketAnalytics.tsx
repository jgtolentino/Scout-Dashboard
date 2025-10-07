'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format, subDays, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface TicketTrend {
  date: string
  created: number
  resolved: number
  pending: number
}

interface CategoryData {
  category: string
  count: number
  avgResolutionHours: number
}

export function TicketTrendChart() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['ticket-trends', user?.id],
    queryFn: async () => {
      const trends: TicketTrend[] = []
      
      // Get data for last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStart = startOfDay(date)
        const dateEnd = new Date(dateStart)
        dateEnd.setDate(dateEnd.getDate() + 1)
        
        // Get tickets created on this day
        const { data: created } = await supabase
          .from('tickets')
          .select('id')
          .gte('created_at', dateStart.toISOString())
          .lt('created_at', dateEnd.toISOString())
        
        // Get tickets resolved on this day
        const { data: resolved } = await supabase
          .from('tickets')
          .select('id')
          .gte('resolved_at', dateStart.toISOString())
          .lt('resolved_at', dateEnd.toISOString())
          .eq('status', 'Resolved')
        
        // Get pending tickets as of this day
        const { data: pending } = await supabase
          .from('tickets')
          .select('id')
          .lt('created_at', dateEnd.toISOString())
          .or('resolved_at.is.null,resolved_at.gte.' + dateEnd.toISOString())
          .neq('status', 'Resolved')
        
        trends.push({
          date: format(date, 'MMM d'),
          created: created?.length || 0,
          resolved: resolved?.length || 0,
          pending: pending?.length || 0
        })
      }
      
      return trends
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
              {entry.name}: {entry.value}
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
        <AreaChart data={data || []} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="date" 
            className="text-sm"
            tick={{ fill: 'currentColor' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            className="text-sm"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="created" 
            stackId="1"
            stroke="#FFD700" 
            fill="#FFD700"
            fillOpacity={0.6}
            name="Created"
          />
          <Area 
            type="monotone" 
            dataKey="resolved" 
            stackId="2"
            stroke="#4ECDC4" 
            fill="#4ECDC4"
            fillOpacity={0.6}
            name="Resolved"
          />
          <Area 
            type="monotone" 
            dataKey="pending" 
            stackId="3"
            stroke="#FF6B6B" 
            fill="#FF6B6B"
            fillOpacity={0.6}
            name="Pending"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TicketCategoryBreakdown() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['ticket-categories', user?.id],
    queryFn: async () => {
      // Get tickets by category with resolution times
      const { data: tickets } = await supabase
        .from('tickets')
        .select('category, created_at, resolved_at, status')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      
      // Process data by category
      const categoryMap = new Map<string, { count: number, totalHours: number, resolvedCount: number }>()
      
      tickets?.forEach(ticket => {
        const category = ticket.category || 'Other'
        const current = categoryMap.get(category) || { count: 0, totalHours: 0, resolvedCount: 0 }
        
        current.count++
        
        if (ticket.status === 'Resolved' && ticket.resolved_at) {
          const created = new Date(ticket.created_at)
          const resolved = new Date(ticket.resolved_at)
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          current.totalHours += hours
          current.resolvedCount++
        }
        
        categoryMap.set(category, current)
      })
      
      // Convert to array and calculate averages
      const categoryData: CategoryData[] = []
      categoryMap.forEach((value, key) => {
        categoryData.push({
          category: key,
          count: value.count,
          avgResolutionHours: value.resolvedCount > 0 ? value.totalHours / value.resolvedCount : 0
        })
      })
      
      return categoryData.sort((a, b) => b.count - a.count).slice(0, 8)
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-tbwa-gray-800 p-3 rounded-lg shadow-lg border border-tbwa-gray-200 dark:border-tbwa-gray-700">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm">Count: {data.count}</p>
          <p className="text-sm">Avg Resolution: {data.avgResolutionHours.toFixed(1)}h</p>
        </div>
      )
    }
    return null
  }

  const getBarColor = (hours: number) => {
    if (hours < 4) return '#4ECDC4' // Fast resolution
    if (hours < 24) return '#FFD700' // Medium resolution
    return '#FF6B6B' // Slow resolution
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data || []} 
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            type="number"
            className="text-sm"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            type="category"
            dataKey="category" 
            className="text-sm"
            tick={{ fill: 'currentColor' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            fill="#FFD700"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}