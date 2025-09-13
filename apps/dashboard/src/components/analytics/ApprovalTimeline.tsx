'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration } from '@/lib/formatters'
import { format, subDays, startOfDay } from 'date-fns'

interface TimelineData {
  date: string
  avgHours: number
  minHours: number
  maxHours: number
  count: number
}

export function ApprovalTimeline() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['approval-timeline', user?.id],
    queryFn: async () => {
      const timeline: TimelineData[] = []
      
      // Get data for last 14 days
      for (let i = 13; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStart = startOfDay(date)
        const dateEnd = new Date(dateStart)
        dateEnd.setDate(dateEnd.getDate() + 1)
        
        // Get expenses approved on this day
        const { data: expenses } = await supabase
          .from('expenses')
          .select('created_at, approved_at')
          .gte('approved_at', dateStart.toISOString())
          .lt('approved_at', dateEnd.toISOString())
          .not('approved_at', 'is', null)
        
        if (expenses && expenses.length > 0) {
          const durations = expenses.map(expense => {
            const created = new Date(expense.created_at)
            const approved = new Date(expense.approved_at!)
            return (approved.getTime() - created.getTime()) / (1000 * 60 * 60) // Convert to hours
          })
          
          timeline.push({
            date: format(date, 'MMM d'),
            avgHours: durations.reduce((a, b) => a + b, 0) / durations.length,
            minHours: Math.min(...durations),
            maxHours: Math.max(...durations),
            count: expenses.length
          })
        } else {
          // No data for this day, use previous day's average or default
          const prevDay = timeline[timeline.length - 1]
          timeline.push({
            date: format(date, 'MMM d'),
            avgHours: prevDay?.avgHours || 24,
            minHours: prevDay?.minHours || 24,
            maxHours: prevDay?.maxHours || 24,
            count: 0
          })
        }
      }
      
      return timeline
    },
    enabled: !!user,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-tbwa-gray-800 p-3 rounded-lg shadow-lg border border-tbwa-gray-200 dark:border-tbwa-gray-700">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p>Average: {formatDuration(data.avgHours * 60 * 60 * 1000)}</p>
            <p>Min: {formatDuration(data.minHours * 60 * 60 * 1000)}</p>
            <p>Max: {formatDuration(data.maxHours * 60 * 60 * 1000)}</p>
            <p className="text-gray-500 dark:text-gray-400">
              {data.count} approvals
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload.count === 0) return null
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#FFD700"
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data || []} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
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
            tickFormatter={(value) => `${value}h`}
            domain={[0, 'dataMax + 4']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="avgHours" 
            stroke="#FFD700" 
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 6 }}
          />
          {/* Range area for min/max */}
          <Line 
            type="monotone" 
            dataKey="maxHours" 
            stroke="#FFD700" 
            strokeWidth={1}
            strokeOpacity={0.3}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="minHours" 
            stroke="#FFD700" 
            strokeWidth={1}
            strokeOpacity={0.3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Target line indicator */}
      <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500"></div>
          <span>Target: 24h</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span>Goal: &lt;8h</span>
        </div>
      </div>
    </div>
  )
}