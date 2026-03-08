import type { CostByDimension } from '@mintlens/shared'
import { formatUsd, formatNumber } from '@/lib/format'

interface BreakdownTableProps {
  title: string
  rows: CostByDimension[]
}

export function BreakdownTable({ title, rows }: BreakdownTableProps) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      <div className="space-y-2">
        {rows.slice(0, 8).map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <div className="w-28 shrink-0 truncate text-xs text-slate-700" title={r.label || r.key}>
              {r.label || r.key}
            </div>
            <div className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-mint-400 transition-all duration-500"
                  style={{ width: `${Math.min(r.percentage, 100)}%` }}
                />
              </div>
            </div>
            <div className="w-14 shrink-0 text-right text-xs text-slate-500">{formatUsd(r.costMicro)}</div>
            <div className="w-9 shrink-0 text-right text-xs text-slate-400">{r.percentage.toFixed(0)}%</div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-slate-400">No data for this period</p>
        )}
      </div>
    </div>
  )
}
