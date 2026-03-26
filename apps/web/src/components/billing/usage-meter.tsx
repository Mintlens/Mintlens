import { cn } from '@/lib/cn'

interface UsageMeterProps {
  current: number
  limit: number
  label?: string
  size?: 'sm' | 'md'
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function UsageMeter({ current, limit, label = 'requests', size = 'md' }: UsageMeterProps) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-500' : pct >= 70 ? 'bg-amber-500' : 'bg-mint-500'

  return (
    <div className={cn(size === 'sm' ? 'space-y-1' : 'space-y-2')}>
      <div className="flex items-baseline justify-between">
        <span className={cn('font-medium text-slate-700', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {formatNumber(current)} <span className="text-slate-400">/ {limit > 0 ? formatNumber(limit) : '∞'}</span>
        </span>
        {size === 'md' && (
          <span className="text-xs text-slate-400">{label}</span>
        )}
      </div>
      <div className={cn('overflow-hidden rounded-full bg-slate-100', size === 'sm' ? 'h-1' : 'h-2')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
