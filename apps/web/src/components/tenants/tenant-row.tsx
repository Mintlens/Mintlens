import type { TenantOverview } from '@mintlens/shared'
import { formatUsd, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'

interface TenantRowProps {
  tenant: TenantOverview
  totalCost: number
}

export function TenantRow({ tenant: t, totalCost }: TenantRowProps) {
  const costShare = totalCost > 0 ? (t.costMicro / totalCost) * 100 : 0
  const hasMargin = t.marginPercent != null

  return (
    <tr className="group transition-colors hover:bg-slate-50/60">
      {/* Tenant identity */}
      <td className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 uppercase">
            {(t.tenantName ?? t.externalRef).slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {t.tenantName ?? t.externalRef}
            </p>
            {t.tenantName && (
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
        {formatNumber(t.requestCount)}
      </td>

      {/* Tokens */}
      <td className="px-3 py-3 text-right text-sm text-slate-600">
        {formatNumber(t.tokensTotal)}
      </td>

      {/* Margin */}
      <td className="px-3 py-3 text-right">
        {hasMargin ? (
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
              (t.marginPercent ?? 0) >= 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600',
            )}
          >
            {(t.marginPercent ?? 0) >= 0 ? '+' : ''}
            {(t.marginPercent ?? 0).toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Top features */}
      <td className="px-3 py-3 pl-3 pr-5 text-right">
        <div className="flex flex-wrap justify-end gap-1">
          {(t.topFeatures ?? []).slice(0, 3).map((f) => (
            <span
              key={f.key}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500"
            >
              {f.label || f.key}
            </span>
          ))}
          {!t.topFeatures?.length && (
            <span className="text-xs text-slate-300">—</span>
          )}
        </div>
      </td>
    </tr>
  )
}
