'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface HeatmapData {
  date: string
  office: string
  count: number
  percentage: number
}

const OFFICES = ['Manila', 'Cebu', 'Davao', 'Clark', 'Iloilo']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function RTOLHeatmap() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const currentMonth = new Date()

  const { data, isLoading } = useQuery({
    queryKey: ['rtol-heatmap', user?.id, currentMonth.getMonth()],
    queryFn: async () => {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('date, office, employee_id')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .eq('status', 'Present')

      if (error) throw error

      // Get employee counts per office
      const { data: officeCounts } = await supabase
        .from('employees')
        .select('office')
        .in('office', OFFICES)

      const employeesByOffice = officeCounts?.reduce((acc, emp) => {
        acc[emp.office] = (acc[emp.office] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Process attendance data
      const heatmapData: HeatmapData[] = []
      const attendanceMap = new Map<string, Set<string>>()

      attendance?.forEach(record => {
        const key = `${record.date}_${record.office}`
        if (!attendanceMap.has(key)) {
          attendanceMap.set(key, new Set())
        }
        attendanceMap.get(key)?.add(record.employee_id)
      })

      // Generate heatmap data for each day and office
      const days = eachDayOfInterval({ start, end })
      days.forEach(date => {
        OFFICES.forEach(office => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const key = `${dateStr}_${office}`
          const presentCount = attendanceMap.get(key)?.size || 0
          const totalEmployees = employeesByOffice[office] || 0
          
          heatmapData.push({
            date: dateStr,
            office,
            count: presentCount,
            percentage: totalEmployees > 0 ? (presentCount / totalEmployees) * 100 : 0
          })
        })
      })

      return heatmapData
    },
    enabled: !!user,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })

  const getColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (percentage < 25) return 'bg-red-200 dark:bg-red-900'
    if (percentage < 50) return 'bg-orange-200 dark:bg-orange-900'
    if (percentage < 75) return 'bg-yellow-200 dark:bg-yellow-900'
    return 'bg-green-200 dark:bg-green-900'
  }

  const weeks = useMemo(() => {
    if (!data) return []
    
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    
    const weeks: Date[][] = []
    let currentWeek: Date[] = []
    
    // Fill in empty days at start of month
    const firstDayOfWeek = getDay(start)
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null as any)
    }
    
    days.forEach(day => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })
    
    // Fill in remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as any)
      }
      weeks.push(currentWeek)
    }
    
    return weeks
  }, [data, currentMonth])

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  return (
    <div className="space-y-4">
      {/* Month header */}
      <h3 className="text-lg font-semibold">
        {format(currentMonth, 'MMMM yyyy')}
      </h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Heatmap grid for each office */}
      {OFFICES.map(office => (
        <div key={office} className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{office}</h4>
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="aspect-square" />
                  }
                  
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayData = data?.find(d => d.date === dateStr && d.office === office)
                  const isWeekend = getDay(day) === 0 || getDay(day) === 6
                  
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        'aspect-square rounded-sm transition-all hover:scale-110 cursor-pointer relative group',
                        isWeekend ? 'opacity-50' : '',
                        getColor(dayData?.percentage || 0)
                      )}
                      title={`${office} - ${format(day, 'MMM d')}: ${dayData?.count || 0} present (${(dayData?.percentage || 0).toFixed(0)}%)`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium opacity-0 group-hover:opacity-100">
                        {dayData?.count || 0}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-sm">
        <span className="text-gray-600 dark:text-gray-400">Attendance Rate:</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-red-200 dark:bg-red-900"></div>
            <span>&lt;25%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-orange-200 dark:bg-orange-900"></div>
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-yellow-200 dark:bg-yellow-900"></div>
            <span>&lt;75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-green-200 dark:bg-green-900"></div>
            <span>75%+</span>
          </div>
        </div>
      </div>
    </div>
  )
}