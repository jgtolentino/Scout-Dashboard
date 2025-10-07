'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export interface ScoreCardProps {
  /** Short KPI label - e.g. "Brand Performance" */
  title: string
  /** Big number or % string to display */
  value?: string | number
  /** Optional change vs prev period */
  delta?: number                //  4.2  → +4.2 %
  /** When loading, pass `isLoading` instead of value */
  isLoading?: boolean
  /** Info bubble text */
  hint?: string
  className?: string
}

export const ScoreCard = ({
  title,
  value,
  delta,
  isLoading,
  hint,
  className,
}: ScoreCardProps) => {
  const up   = delta !== undefined && delta >= 0
  const down = delta !== undefined && delta < 0
  return (
    <div
      className={cn(
        'glass-panel relative flex flex-col justify-between rounded-lg p-5 shadow-elevation-1',
        className,
      )}
      title={hint ?? undefined}
    >
      <h4 className="text-sm font-medium text-foreground/80">{title}</h4>

      {isLoading ? (
        <Skeleton className="mt-4 h-8 w-24" />
      ) : (
        <span className="mt-2 text-3xl font-semibold tabular-nums">
          {value ?? '—'}
        </span>
      )}

      {delta !== undefined && !isLoading && (
        <span
          className={cn(
            'mt-1 inline-flex items-center gap-1 text-xs font-medium',
            up   && 'text-azure-green',
            down && 'text-azure-red',
          )}
        >
          {up   && <TrendingUp   size={12} />}
          {down && <TrendingDown size={12} />}
          {up || down ? `${Math.abs(delta).toFixed(1)} %` : ''}
        </span>
      )}
    </div>
  )
}