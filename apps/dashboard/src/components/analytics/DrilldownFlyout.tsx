'use client'

import { useState, useEffect } from 'react'
import { X, Download, Filter, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DrilldownFlyoutProps {
  open: boolean
  onClose: () => void
  metric: string | null
}

export function DrilldownFlyout({ open, onClose, metric }: DrilldownFlyoutProps) {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [activeTab, setActiveTab] = useState('details')

  const { data, isLoading } = useQuery({
    queryKey: ['drilldown', metric, user?.id],
    queryFn: async () => {
      if (!metric) return null

      switch (metric) {
        case 'expenses':
          const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
          
          const { data: expenseStats } = await supabase
            .rpc('get_expense_stats', { user_id: user?.id })
          
          return {
            type: 'expenses',
            items: expenses,
            stats: expenseStats?.[0],
            columns: ['Date', 'Merchant', 'Category', 'Amount', 'Status']
          }

        case 'tickets':
          const { data: tickets } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
          
          const { data: ticketStats } = await supabase
            .rpc('get_ticket_stats', { user_id: user?.id })
          
          return {
            type: 'tickets',
            items: tickets,
            stats: ticketStats?.[0],
            columns: ['Date', 'Title', 'Category', 'Priority', 'Status']
          }

        case 'rtol':
          const { data: attendance } = await supabase
            .from('attendance')
            .select('*, employees(name, office)')
            .order('date', { ascending: false })
            .limit(50)
          
          return {
            type: 'rtol',
            items: attendance,
            columns: ['Date', 'Employee', 'Office', 'Status', 'Check In']
          }

        case 'violations':
          const { data: violations } = await supabase
            .from('expenses')
            .select('*')
            .not('policy_violations', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50)
          
          return {
            type: 'violations',
            items: violations,
            columns: ['Date', 'Expense', 'Violations', 'Amount', 'Status']
          }

        default:
          return null
      }
    },
    enabled: !!metric && !!user && open,
  })

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const handleExport = () => {
    if (!data?.items) return
    
    // Convert to CSV
    const headers = data.columns.join(',')
    const rows = data.items.map((item: any) => {
      switch (data.type) {
        case 'expenses':
          return [
            formatDate(item.expense_date),
            item.merchant_name,
            item.expense_category,
            formatCurrency(item.amount),
            item.status
          ].join(',')
        case 'tickets':
          return [
            formatDate(item.created_at),
            item.title,
            item.category,
            item.priority,
            item.status
          ].join(',')
        case 'rtol':
          return [
            formatDate(item.date),
            item.employees?.name || 'Unknown',
            item.employees?.office || 'Unknown',
            item.status,
            item.check_in_time || '-'
          ].join(',')
        case 'violations':
          return [
            formatDate(item.created_at),
            item.merchant_name,
            (item.policy_violations as string[]).join('; '),
            formatCurrency(item.amount),
            item.status
          ].join(',')
        default:
          return ''
      }
    })
    
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.type}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Flyout */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-tbwa-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold capitalize">{metric} Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Detailed breakdown and analysis
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  'px-6 py-3 text-sm font-medium transition-colors',
                  activeTab === 'details' 
                    ? 'border-b-2 border-tbwa-yellow text-tbwa-yellow' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={cn(
                  'px-6 py-3 text-sm font-medium transition-colors',
                  activeTab === 'trends' 
                    ? 'border-b-2 border-tbwa-yellow text-tbwa-yellow' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                Trends
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={cn(
                  'px-6 py-3 text-sm font-medium transition-colors',
                  activeTab === 'insights' 
                    ? 'border-b-2 border-tbwa-yellow text-tbwa-yellow' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                AI Insights
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tbwa-yellow"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'details' && (
                    <div className="p-6">
                      {/* Action bar */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <button className="btn btn-secondary">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                          </button>
                          <button className="btn btn-secondary">
                            <Calendar className="w-4 h-4 mr-2" />
                            Date Range
                          </button>
                        </div>
                        <button onClick={handleExport} className="btn btn-primary">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </button>
                      </div>

                      {/* Stats summary */}
                      {data?.stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                            <p className="text-2xl font-bold mt-1">
                              {data.type === 'expenses' || data.type === 'violations' 
                                ? formatCurrency(data.stats.total_amount)
                                : data.stats.total_count}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                            <p className="text-2xl font-bold mt-1">
                              {data.type === 'expenses' 
                                ? formatCurrency(data.stats.avg_amount)
                                : `${data.stats.avg_resolution_time}h`}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                            <p className="text-2xl font-bold mt-1">{data.stats.month_count}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
                            <div className="flex items-center gap-2 mt-1">
                              {data.stats.trend > 0 ? (
                                <TrendingUp className="w-5 h-5 text-green-500" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-500" />
                              )}
                              <span className="text-2xl font-bold">
                                {formatPercentage(Math.abs(data.stats.trend))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Data table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              {data?.columns.map((col: string) => (
                                <th key={col} className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data?.items?.map((item: any, index: number) => (
                              <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                {data.type === 'expenses' && (
                                  <>
                                    <td className="py-3 px-4 text-sm">{formatDate(item.expense_date)}</td>
                                    <td className="py-3 px-4 text-sm">{item.merchant_name}</td>
                                    <td className="py-3 px-4 text-sm">{item.expense_category}</td>
                                    <td className="py-3 px-4 text-sm font-medium">{formatCurrency(item.amount)}</td>
                                    <td className="py-3 px-4">
                                      <span className={cn(
                                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                                        item.status === 'Approved' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                                        item.status === 'Pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                                        item.status === 'Rejected' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                      )}>
                                        {item.status}
                                      </span>
                                    </td>
                                  </>
                                )}
                                {data.type === 'tickets' && (
                                  <>
                                    <td className="py-3 px-4 text-sm">{formatDate(item.created_at)}</td>
                                    <td className="py-3 px-4 text-sm">{item.title}</td>
                                    <td className="py-3 px-4 text-sm">{item.category}</td>
                                    <td className="py-3 px-4 text-sm">{item.priority}</td>
                                    <td className="py-3 px-4">
                                      <span className={cn(
                                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                                        item.status === 'Resolved' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                                        item.status === 'Open' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                                        item.status === 'In Progress' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                      )}>
                                        {item.status}
                                      </span>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'trends' && (
                    <div className="p-6">
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        Trend analysis coming soon...
                      </div>
                    </div>
                  )}

                  {activeTab === 'insights' && (
                    <div className="p-6">
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        AI insights powered by Maya, LearnBot, and YaYo coming soon...
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}