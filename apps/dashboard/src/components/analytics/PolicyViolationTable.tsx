'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface ViolationData {
  type: string
  count: number
  totalAmount: number
  trend: number
  severity: 'high' | 'medium' | 'low'
}

const VIOLATION_TYPES = {
  'Missing Receipt': { severity: 'medium', icon: '📄' },
  'Over Budget': { severity: 'high', icon: '💰' },
  'Late Submission': { severity: 'low', icon: '⏰' },
  'Invalid Category': { severity: 'medium', icon: '📁' },
  'Duplicate Expense': { severity: 'high', icon: '🔁' },
  'Policy Exception': { severity: 'high', icon: '⚠️' }
}

export function PolicyViolationTable() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['policy-violations', user?.id],
    queryFn: async () => {
      // Get violations from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('policy_violations, amount')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('policy_violations', 'is', null)
      
      // Get violations from previous 30 days for trend
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      
      const { data: previousExpenses } = await supabase
        .from('expenses')
        .select('policy_violations')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())
        .not('policy_violations', 'is', null)
      
      // Process current violations
      const violationCounts = new Map<string, { count: number, amount: number }>()
      expenses?.forEach(expense => {
        const violations = expense.policy_violations as string[]
        violations?.forEach(violation => {
          const current = violationCounts.get(violation) || { count: 0, amount: 0 }
          violationCounts.set(violation, {
            count: current.count + 1,
            amount: current.amount + expense.amount
          })
        })
      })
      
      // Process previous violations for trend
      const previousCounts = new Map<string, number>()
      previousExpenses?.forEach(expense => {
        const violations = expense.policy_violations as string[]
        violations?.forEach(violation => {
          previousCounts.set(violation, (previousCounts.get(violation) || 0) + 1)
        })
      })
      
      // Build violation data
      const violationData: ViolationData[] = []
      Object.keys(VIOLATION_TYPES).forEach(type => {
        const current = violationCounts.get(type) || { count: 0, amount: 0 }
        const previous = previousCounts.get(type) || 0
        
        if (current.count > 0) {
          const trend = previous > 0 ? ((current.count - previous) / previous) * 100 : 0
          
          violationData.push({
            type,
            count: current.count,
            totalAmount: current.amount,
            trend,
            severity: VIOLATION_TYPES[type as keyof typeof VIOLATION_TYPES].severity
          })
        }
      })
      
      // Sort by count descending
      return violationData.sort((a, b) => b.count - a.count)
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      case 'low': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      default: return ''
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              Violation Type
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              Count
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              Impact
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              Trend
            </th>
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((violation) => (
              <tr 
                key={violation.type}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {VIOLATION_TYPES[violation.type as keyof typeof VIOLATION_TYPES]?.icon}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{violation.type}</p>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                        getSeverityColor(violation.severity)
                      )}>
                        {violation.severity} severity
                      </span>
                    </div>
                  </div>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-2xl font-semibold">{violation.count}</span>
                </td>
                <td className="text-right py-3 px-4">
                  <p className="font-medium">{formatCurrency(violation.totalAmount)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    total affected
                  </p>
                </td>
                <td className="text-center py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    {violation.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : violation.trend < 0 ? (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className="w-4 h-4 text-gray-400">—</span>
                    )}
                    <span className={cn(
                      'text-sm font-medium',
                      violation.trend > 0 ? 'text-red-600 dark:text-red-400' : 
                      violation.trend < 0 ? 'text-green-600 dark:text-green-400' : 
                      'text-gray-500'
                    )}>
                      {Math.abs(violation.trend).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No policy violations found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Great compliance!</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}