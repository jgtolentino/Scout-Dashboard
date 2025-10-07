'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface KPIMetrics {
  expenses: {
    total: number
    trend: number
    pending: number
  }
  tickets: {
    open: number
    trend: number
    critical: number
  }
  rtol: {
    percentage: number
    trend: number
    inOffice: number
  }
  violations: {
    count: number
    trend: number
    resolved: number
  }
}

export function useKpiMetrics() {
  const supabase = useSupabaseClient()
  const user = useUser()

  return useQuery<KPIMetrics>({
    queryKey: ['kpi-metrics', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')

      // Get current and previous month dates
      const now = new Date()
      const currentMonthStart = startOfMonth(now)
      const currentMonthEnd = endOfMonth(now)
      const previousMonthStart = startOfMonth(subMonths(now, 1))
      const previousMonthEnd = endOfMonth(subMonths(now, 1))

      // Fetch expense metrics
      const { data: currentExpenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, status')
        .gte('created_at', currentMonthStart.toISOString())
        .lte('created_at', currentMonthEnd.toISOString())

      if (expenseError) throw expenseError

      const { data: previousExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', previousMonthStart.toISOString())
        .lte('created_at', previousMonthEnd.toISOString())

      const currentTotal = currentExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const previousTotal = previousExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const pendingExpenses = currentExpenses?.filter(exp => exp.status === 'Pending Approval').length || 0
      
      const expenseTrend = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal) * 100 
        : 0

      // Fetch ticket metrics
      const { data: openTickets, error: ticketError } = await supabase
        .from('requests')
        .select('id, priority, status')
        .in('status', ['Submitted', 'In Review'])

      if (ticketError) throw ticketError

      const { data: previousTickets } = await supabase
        .from('requests')
        .select('id')
        .in('status', ['Submitted', 'In Review'])
        .gte('created_at', previousMonthStart.toISOString())
        .lte('created_at', previousMonthEnd.toISOString())

      const criticalTickets = openTickets?.filter(t => t.priority === 'Urgent').length || 0
      const ticketTrend = previousTickets?.length 
        ? ((openTickets?.length || 0) - previousTickets.length) / previousTickets.length * 100
        : 0

      // Fetch RTOL metrics (Return to Office)
      const { data: todayAttendance } = await supabase
        .from('time_entries')
        .select('id, user_id')
        .gte('clock_in', new Date().toISOString().split('T')[0])
        .not('clock_out', 'is', null)

      const { data: totalEmployees } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)

      const inOfficeCount = todayAttendance?.length || 0
      const totalCount = totalEmployees?.length || 1
      const rtolPercentage = Math.round((inOfficeCount / totalCount) * 100)

      // Fetch policy violations
      const { data: violations } = await supabase
        .from('expenses')
        .select('policy_violations')
        .not('policy_violations', 'is', null)
        .gte('created_at', currentMonthStart.toISOString())

      const violationCount = violations?.filter(v => 
        v.policy_violations && v.policy_violations.length > 0
      ).length || 0

      const { data: resolvedViolations } = await supabase
        .from('expense_audit_log')
        .select('id')
        .eq('action', 'VIOLATION_RESOLVED')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      return {
        expenses: {
          total: currentTotal,
          trend: expenseTrend,
          pending: pendingExpenses
        },
        tickets: {
          open: openTickets?.length || 0,
          trend: ticketTrend,
          critical: criticalTickets
        },
        rtol: {
          percentage: rtolPercentage,
          trend: 5, // Mock trend for now
          inOffice: inOfficeCount
        },
        violations: {
          count: violationCount,
          trend: -10, // Mock trend showing improvement
          resolved: resolvedViolations?.length || 0
        }
      }
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}