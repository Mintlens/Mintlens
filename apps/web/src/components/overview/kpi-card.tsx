import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MiniSparkline } from './mini-sparkline'
import { cn } from '@/lib/cn'

interface KpiCardProps {
  title: string
  value: string
  change?: number          // percent change, e.g. +12.3 or -5.1
  subtitle?: string
  accent?: boolean         // mint accent indicator
  sparkData?: number[]     // 7-day trend values for inline sparkline
  sparkColor?: string      // override sparkline color
}

export function KpiCard({
  title,
  value,
  change,
  subtitle,
  accent,
  sparkData,
  sparkColor,
}: KpiCardProps) {
  const positive = change !== undefined && change > 0
  const negative = change !== undefined && change < 0
  const neutral  = change === undefined || change === 0

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        accent && 'border-l-2 border-l-mint-400',
      )}
    >
      <div className="p-5">
        {/* Header row: title + sparkline */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          {sparkData && sparkData.length >= 2 && (
            <MiniSparkline data={sparkData} color={sparkColor} />
          )}
        </div>

        {/* Value + delta */}
        <div className="mt-3 flex items-end gap-3">
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </span>

          {change !== undefined && (
            <span
              className={cn(
                'mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium',
                positive && 'bg-emerald-50/80 text-emerald-600',
                negative && 'bg-red-50/80 text-red-500',
                neutral  && 'bg-slate-50/80 text-slate-400',
              )}
            >
              {positive && <ArrowUpRight className="h-3 w-3" />}
              {negative && <ArrowDownRight className="h-3 w-3" />}
              {neutral  && <Minus className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
    </Card>
  )
}
