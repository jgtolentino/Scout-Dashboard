'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: ReactNode
  subtitle?: string
  loading?: boolean
  onClick?: () => void
  className?: string
  format?: 'number' | 'currency' | 'percentage'
  prefix?: string
  suffix?: string
}

export function KPICard({
  title,
  value,
  trend,
  icon,
  subtitle,
  loading = false,
  onClick,
  className,
  format = 'number',
  prefix = '',
  suffix = ''
}: KPICardProps) {
  const formatValue = () => {
    if (loading) return ''
    
    if (format === 'currency') {
      return `$${Number(value).toLocaleString()}`
    } else if (format === 'percentage') {
      return `${value}%`
    }
    
    return `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}${suffix}`
  }
  
  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.value === 0) {
      return <Minus className="w-4 h-4" />
    }
    
    return trend.isPositive ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    )
  }
  
  const getTrendColor = () => {
    if (!trend) return ''
    
    if (trend.value === 0) return 'text-tbwa-gray-500'
    return trend.isPositive ? 'text-success' : 'text-error'
  }

  if (loading) {
    return (
      <div className={cn('kpi-card', className)}>
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
    >
      <div
        className={cn(
          'kpi-card',
          onClick && 'cursor-pointer hover:border-tbwa-yellow',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onClick()
          }
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-tbwa-gray-600 dark:text-tbwa-gray-400">
            {title}
          </h3>
          {icon && (
            <div className="p-2 bg-tbwa-yellow/10 rounded-lg">
              <div className="text-tbwa-yellow">{icon}</div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="kpi-value" aria-label={`${title}: ${formatValue()}`}>
            {formatValue()}
          </p>
          
          {trend && (
            <div className={cn('kpi-trend', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-tbwa-gray-500 dark:text-tbwa-gray-400 ml-1">
                vs last period
              </span>
            </div>
          )}
          
          {subtitle && (
            <p className="text-xs text-tbwa-gray-500 dark:text-tbwa-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// KPI Card Grid Container
export function KPICardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  )
}

// Preset KPI Cards for common metrics
export function ExpenseKPICard({ 
  loading, 
  data,
  onClick 
}: { 
  loading?: boolean
  data?: {
    total: number
    trend: number
    pending: number
  }
  onClick?: () => void
}) {
  return (
    <KPICard
      title="Total Expenses"
      value={data?.total || 0}
      format="currency"
      trend={{
        value: data?.trend || 0,
        isPositive: (data?.trend || 0) < 0 // Less spending is positive
      }}
      subtitle={`${data?.pending || 0} pending approval`}
      loading={loading}
      onClick={onClick}
      icon={<DollarSign className="w-5 h-5" />}
    />
  )
}

export function TicketsKPICard({ 
  loading, 
  data,
  onClick 
}: { 
  loading?: boolean
  data?: {
    open: number
    trend: number
    critical: number
  }
  onClick?: () => void
}) {
  return (
    <KPICard
      title="Open Tickets"
      value={data?.open || 0}
      trend={{
        value: data?.trend || 0,
        isPositive: (data?.trend || 0) < 0 // Fewer tickets is positive
      }}
      subtitle={`${data?.critical || 0} critical`}
      loading={loading}
      onClick={onClick}
      icon={<FileText className="w-5 h-5" />}
    />
  )
}

export function RTOLKPICard({ 
  loading, 
  data,
  onClick 
}: { 
  loading?: boolean
  data?: {
    percentage: number
    trend: number
    inOffice: number
  }
  onClick?: () => void
}) {
  return (
    <KPICard
      title="Office Attendance"
      value={data?.percentage || 0}
      format="percentage"
      trend={{
        value: data?.trend || 0,
        isPositive: (data?.trend || 0) > 0 // More attendance is positive
      }}
      subtitle={`${data?.inOffice || 0} in office today`}
      loading={loading}
      onClick={onClick}
      icon={<Building className="w-5 h-5" />}
    />
  )
}

export function ViolationsKPICard({ 
  loading, 
  data,
  onClick 
}: { 
  loading?: boolean
  data?: {
    count: number
    trend: number
    resolved: number
  }
  onClick?: () => void
}) {
  return (
    <KPICard
      title="Policy Violations"
      value={data?.count || 0}
      trend={{
        value: data?.trend || 0,
        isPositive: (data?.trend || 0) < 0 // Fewer violations is positive
      }}
      subtitle={`${data?.resolved || 0} resolved this week`}
      loading={loading}
      onClick={onClick}
      icon={<AlertCircle className="w-5 h-5" />}
      className={data?.count ? 'border-warning' : ''}
    />
  )
}

// Imports needed for icons
import { DollarSign, FileText, Building, AlertCircle } from 'lucide-react'