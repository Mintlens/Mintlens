import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

interface KpiCardProps {
  title: string
  value: string
  change?: number      // percent change, e.g. +12.3 or -5.1
  subtitle?: string
  accent?: boolean     // mint left border accent
}

export function KpiCard({ title, value, change, subtitle, accent }: KpiCardProps) {
  const positive = change !== undefined && change > 0
  const negative = change !== undefined && change < 0
  const neutral  = change === undefined || change === 0

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01]', accent && 'border-l-2 border-l-mint-400')}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">{value}</span>

          {change !== undefined && (
            <span
              className={cn(
                'mb-0.5 flex items-center gap-0.5 text-xs font-medium',
                positive && 'text-emerald-600',
                negative && 'text-red-500',
                neutral  && 'text-slate-400',
              )}
            >
              {positive && <ArrowUpRight className="h-3.5 w-3.5" />}
              {negative && <ArrowDownRight className="h-3.5 w-3.5" />}
              {neutral  && <Minus className="h-3.5 w-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
