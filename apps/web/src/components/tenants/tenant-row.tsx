import type { TenantOverview } from '@mintlens/shared'
import { formatUsd, formatNumber, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

interface TenantRowProps {
  tenant: TenantOverview
  totalCost: number
}

export function TenantRow({ tenant: t, totalCost }: TenantRowProps) {
  const costShare = totalCost > 0 ? (t.costMicro / totalCost) * 100 : 0
  const hasMargin = t.grossMargin != null
  const marginPct = (t.grossMargin ?? 0) * 100 // decimal → percentage for display

  return (
    <tr className="group transition-colors hover:bg-slate-50/60">
      {/* Tenant identity */}
      <td className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 uppercase">
            {(t.name ?? t.externalRef).slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {t.name ?? t.externalRef}
            </p>
            {t.name && (
              <p className="truncate text-xs text-slate-400">{t.externalRef}</p>
            )}
          </div>
        </div>
      </td>

      {/* Spend + micro bar */}
      <td className="px-3 py-3 text-right">
        <p className="text-sm font-medium text-slate-900">{formatUsd(t.costMicro)}</p>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-mint-400 transition-all duration-500"
            style={{ width: `${Math.min(costShare, 100)}%` }}
          />
        </div>
      </td>

      {/* Requests */}
      <td className="px-3 py-3 text-right text-sm text-slate-600">
        {formatNumber(t.requests)}
      </td>

      {/* Tokens */}
      <td className="px-3 py-3 text-right text-sm text-slate-600">
        {formatNumber(t.tokens)}
      </td>

      {/* Margin */}
      <td className="px-3 py-3 text-right">
        {hasMargin ? (
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
              marginPct >= 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600',
            )}
          >
            {marginPct >= 0 ? '+' : ''}
            {marginPct.toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Last seen */}
      <td className="px-3 py-3 pl-3 pr-5 text-right text-xs text-slate-400">
        {t.lastSeenAt ? formatDate(t.lastSeenAt) : '—'}
      </td>
    </tr>
  )
}
