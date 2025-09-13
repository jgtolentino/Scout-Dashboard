import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useFilters } from '../../context/FilterContext'
import { Skeleton } from '../ui/Skeleton'

interface TimeData {
  hour: number
  day: string
  value: number
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = Array.from({ length: 24 }, (_, i) => i)

const getHeatColor = (value: number, max: number) => {
  const intensity = value / max
  if (intensity === 0) return '#F3F4F6'
  if (intensity < 0.2) return '#DBEAFE'
  if (intensity < 0.4) return '#93C5FD'
  if (intensity < 0.6) return '#60A5FA'
  if (intensity < 0.8) return '#3B82F6'
  return '#1E40AF'
}

export const TimeHeatMap: React.FC = () => {
  const { filters } = useFilters()

  const { data, isLoading } = useQuery({
    queryKey: ['time-heat-map', filters],
    queryFn: async () => {
      // Generate demo data - in production this would query the database
      const heatData: TimeData[] = []
      
      days.forEach((day, dayIndex) => {
        hours.forEach(hour => {
          // Simulate realistic store traffic patterns
          let value = 0
          
          // Weekday patterns
          if (dayIndex < 5) {
            if (hour >= 7 && hour <= 9) value = 60 + Math.random() * 20 // Morning rush
            else if (hour >= 12 && hour <= 13) value = 70 + Math.random() * 20 // Lunch
            else if (hour >= 17 && hour <= 19) value = 80 + Math.random() * 20 // Evening rush
            else if (hour >= 10 && hour <= 16) value = 40 + Math.random() * 20 // Daytime
            else if (hour >= 20 && hour <= 22) value = 30 + Math.random() * 20 // Night
            else value = Math.random() * 10 // Early morning/late night
          } 
          // Weekend patterns
          else {
            if (hour >= 10 && hour <= 12) value = 70 + Math.random() * 20 // Late morning
            else if (hour >= 14 && hour <= 18) value = 60 + Math.random() * 30 // Afternoon
            else if (hour >= 19 && hour <= 21) value = 50 + Math.random() * 20 // Evening
            else if (hour >= 8 && hour <= 9) value = 30 + Math.random() * 20 // Early morning
            else value = Math.random() * 15 // Other times
          }
          
          heatData.push({ hour, day, value: Math.round(value) })
        })
      })
      
      return heatData
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

  const heatData = data || []
  const maxValue = Math.max(...heatData.map(d => d.value))

  return (
    <div className="backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Peak Hours Analysis</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Transactions per hour</span>
          <div className="flex gap-1 items-center">
            <span className="text-xs text-gray-500">Low</span>
            {['#F3F4F6', '#DBEAFE', '#93C5FD', '#60A5FA', '#3B82F6', '#1E40AF'].map(color => (
              <div
                key={color}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour labels */}
          <div className="flex gap-1 mb-2 ml-12">
            {hours.map(hour => (
              <div key={hour} className="w-7 text-center text-xs text-gray-600">
                {hour === 0 ? '12a' : hour === 12 ? '12p' : hour < 12 ? `${hour}` : `${hour-12}`}
              </div>
            ))}
          </div>

          {/* Days and heat cells */}
          {days.map(day => (
            <div key={day} className="flex gap-1 items-center mb-1">
              <div className="w-12 text-sm text-gray-700 font-medium">{day}</div>
              {hours.map(hour => {
                const cellData = heatData.find(d => d.day === day && d.hour === hour)
                const value = cellData?.value || 0
                const color = getHeatColor(value, maxValue)
                
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="w-7 h-7 rounded cursor-pointer transition-all hover:scale-110 relative group"
                    style={{ backgroundColor: color }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                      {day} {hour}:00 - {value} transactions
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">Peak Hours</p>
          <p className="text-xs text-blue-700 mt-1">
            Weekdays: 5-7 PM • Weekends: 10 AM-12 PM
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-900">Opportunity Window</p>
          <p className="text-xs text-green-700 mt-1">
            Low traffic 2-4 PM weekdays - ideal for restocking
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-900">Staff Optimization</p>
          <p className="text-xs text-purple-700 mt-1">
            Consider dual shifts during 12-1 PM lunch rush
          </p>
        </div>
      </div>
    </div>
  )
}