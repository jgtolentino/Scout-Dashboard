'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface FileStatus {
  name: string
  value: number
  percentage: number
  color: string
  icon: React.ReactNode
}

const STATUS_CONFIG = {
  complete: { color: '#4ECDC4', icon: CheckCircle },
  partial: { color: '#FFD700', icon: AlertCircle },
  missing: { color: '#FF6B6B', icon: XCircle }
}

export function FileProgressDonut() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['file-progress', user?.id],
    queryFn: async () => {
      // Get all employees and their 201 file status
      const { data: employees } = await supabase
        .from('employees')
        .select('id, file_201_status')
        .eq('status', 'Active')
      
      if (!employees) return []
      
      // Count statuses
      const statusCounts = {
        complete: 0,
        partial: 0,
        missing: 0
      }
      
      employees.forEach(employee => {
        const status = employee.file_201_status || 'missing'
        if (status === 'Complete') {
          statusCounts.complete++
        } else if (status === 'Partial') {
          statusCounts.partial++
        } else {
          statusCounts.missing++
        }
      })
      
      const total = employees.length
      
      // Build chart data
      const fileData: FileStatus[] = [
        {
          name: 'Complete',
          value: statusCounts.complete,
          percentage: total > 0 ? (statusCounts.complete / total) * 100 : 0,
          color: STATUS_CONFIG.complete.color,
          icon: <STATUS_CONFIG.complete.icon className="w-4 h-4" />
        },
        {
          name: 'Partial',
          value: statusCounts.partial,
          percentage: total > 0 ? (statusCounts.partial / total) * 100 : 0,
          color: STATUS_CONFIG.partial.color,
          icon: <STATUS_CONFIG.partial.icon className="w-4 h-4" />
        },
        {
          name: 'Missing',
          value: statusCounts.missing,
          percentage: total > 0 ? (statusCounts.missing / total) * 100 : 0,
          color: STATUS_CONFIG.missing.color,
          icon: <STATUS_CONFIG.missing.icon className="w-4 h-4" />
        }
      ]
      
      return fileData.filter(item => item.value > 0)
    },
    enabled: !!user,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0
  const completePercentage = data?.find(item => item.name === 'Complete')?.percentage || 0

  const renderCustomLabel = ({ cx, cy }: any) => {
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} dy="-0.2em" className="text-3xl font-bold fill-current">
          {completePercentage.toFixed(0)}%
        </tspan>
        <tspan x={cx} dy="1.5em" className="text-sm fill-gray-500 dark:fill-gray-400">
          Complete
        </tspan>
      </text>
    )
  }

  const CustomLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">{entry.value}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{entry.payload.value}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({entry.payload.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data || []}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
            >
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary stats */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Employees</span>
          <span className="font-semibold">{total}</span>
        </div>
        <div className="space-y-2">
          {data?.map((status, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status.icon}
                <span className="text-sm">{status.name}</span>
              </div>
              <span className="text-sm font-medium">{status.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}