'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useSummary, useCostExplorer } from '@/hooks/use-analytics'
import { KpiCard } from '@/components/overview/kpi-card'
import { CostSparkline } from '@/components/overview/cost-sparkline'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatUsd, formatNumber, formatLatency } from '@/lib/format'

function defaultFrom() {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10)
}
function defaultTo() { return new Date().toISOString().slice(0, 10) }

function OverviewContent() {
  const sp           = useSearchParams()
  const from         = sp.get('from') ?? defaultFrom()
  const to           = sp.get('to')   ?? defaultTo()
  const projectId    = useAuthStore((s) => s.selectedProjectId)

  const { data: summary, isLoading: loadingSummary } = useSummary(projectId, from, to)
  const { data: explorer } = useCostExplorer({
    projectId: projectId ?? '',
    from,
    to,
    granularity: 'day',
  })

  if (!projectId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Select a project to see your analytics
      </div>
    )
  }

  const cur = summary?.currentMonth
  const prev = summary?.previousMonth
  const costChange = prev && cur && prev.costMicro > 0
    ? ((cur.costMicro - prev.costMicro) / prev.costMicro) * 100
    : undefined

  const reqChange = prev && cur && prev.requestCount > 0
    ? ((cur.requestCount - prev.requestCount) / prev.requestCount) * 100
    : undefined

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-400">{from} → {to}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Total cost"
          value={loadingSummary ? '—' : formatUsd(cur?.costMicro ?? 0)}
          change={costChange}
          subtitle="vs previous period"
          accent
        />
        <KpiCard
          title="Requests"
          value={loadingSummary ? '—' : formatNumber(cur?.requestCount ?? 0)}
          change={reqChange}
          subtitle="API calls processed"
        />
        <KpiCard
          title="Tokens"
          value={loadingSummary ? '—' : formatNumber(cur?.tokensTotal ?? 0)}
          subtitle="Input + output"
        />
        <KpiCard
          title="Avg cost / req"
          value={loadingSummary ? '—' : formatUsd(cur?.avgCostPerRequestMicro ?? 0)}
          subtitle="Across all models"
        />
      </div>

      {/* Sparkline */}
      {explorer && explorer.timeSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily cost</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <CostSparkline data={explorer.timeSeries} />
          </CardContent>
        </Card>
      )}

      {/* Top models + features */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopTable title="Top models" rows={summary.topModels} />
          <TopTable title="Top features" rows={summary.topFeatures} />
        </div>
      )}
    </div>
  )
}

function TopTable({ title, rows }: { title: string; rows: Array<{ key: string; label: string; costMicro: number; percentage: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <tbody>
            {rows.slice(0, 5).map((r) => (
              <tr key={r.key} className="border-t border-slate-50 px-5 first:border-0">
                <td className="px-5 py-2.5 text-slate-700">{r.label || r.key}</td>
                <td className="px-5 py-2.5 text-right text-slate-400">{formatUsd(r.costMicro)}</td>
                <td className="w-28 px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-mint-400 transition-all duration-300"
                        style={{ width: `${Math.min(r.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs text-slate-400">{r.percentage.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-4 text-xs text-slate-400">No data</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export default function OverviewPage() {
  return (
    <Suspense>
      <OverviewContent />
    </Suspense>
  )
}
