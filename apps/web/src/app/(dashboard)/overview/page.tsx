'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, Plug } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useSummary, useCostExplorer } from '@/hooks/use-analytics'
import { useBudgets } from '@/hooks/use-budgets'
import { KpiCard } from '@/components/overview/kpi-card'
import { BudgetGauge } from '@/components/overview/budget-gauge'
import { CostSparkline } from '@/components/overview/cost-sparkline'
import { OverviewSkeleton } from '@/components/overview/overview-skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatUsd, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10)
}

/* ------------------------------------------------------------------ */
/*  Overview page content                                              */
/* ------------------------------------------------------------------ */

function OverviewContent() {
  const sp        = useSearchParams()
  const from      = sp.get('from') ?? defaultFrom()
  const to        = sp.get('to') ?? defaultTo()
  const projectId = useAuthStore((s) => s.selectedProjectId)

  const { data: summary, isLoading: loadingSummary } = useSummary(projectId, from, to)
  const { data: explorer } = useCostExplorer({
    projectId: projectId ?? '',
    from,
    to,
    granularity: 'day',
  })
  const { data: budgets } = useBudgets(projectId)

  /* Empty state — no project selected */
  if (!projectId) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 text-center">
        <Plug className="h-10 w-10 text-slate-200" />
        <p className="text-sm font-medium text-slate-500">Select a project to see your analytics</p>
        <p className="text-xs text-slate-400">Choose one from the top bar</p>
      </div>
    )
  }

  /* Skeleton while data is loading */
  if (loadingSummary && !summary) {
    return <OverviewSkeleton />
  }

  /* Derived metrics */
  const cur  = summary?.currentMonth
  const prev = summary?.previousMonth

  const costChange = prev && cur && prev.costMicro > 0
    ? ((cur.costMicro - prev.costMicro) / prev.costMicro) * 100
    : undefined

  const reqChange = prev && cur && prev.requestCount > 0
    ? ((cur.requestCount - prev.requestCount) / prev.requestCount) * 100
    : undefined

  /* Build 7-day sparkline data from the last 7 points of the timeseries */
  const last7 = explorer?.timeSeries.slice(-7).map((d) => d.costMicro) ?? []
  const last7Reqs = explorer?.timeSeries.slice(-7).map((d) => d.requestCount) ?? []

  /* Primary budget (first one, if any) */
  const primaryBudget = budgets?.[0]

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-400">
          {from} → {to}
        </p>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Total Spend"
          value={loadingSummary ? '—' : formatUsd(cur?.costMicro ?? 0)}
          change={costChange}
          subtitle="vs previous period"
          sparkData={last7}
          accent
        />
        <KpiCard
          title="Requests"
          value={loadingSummary ? '—' : formatNumber(cur?.requestCount ?? 0)}
          change={reqChange}
          subtitle="API calls"
          sparkData={last7Reqs}
          sparkColor="#6366f1"
        />
        <KpiCard
          title="Avg Cost / Req"
          value={loadingSummary ? '—' : formatUsd(cur?.avgCostPerRequestMicro ?? 0)}
          subtitle="Across all models"
        />

        {/* Budget gauge card */}
        <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01]">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Budget
              </p>
              {primaryBudget && (
                <BudgetGauge percent={primaryBudget.usagePercent} />
              )}
            </div>
            <div className="mt-2">
              {primaryBudget ? (
                <>
                  <span className="text-2xl font-semibold tracking-tight text-slate-900">
                    {primaryBudget.usagePercent.toFixed(0)}%
                  </span>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {formatUsd(primaryBudget.currentMicro)} of {formatUsd(primaryBudget.limitMicro)}
                  </p>
                </>
              ) : (
                <>
                  <span className="text-2xl font-semibold tracking-tight text-slate-300">—</span>
                  <p className="mt-1.5 text-xs text-slate-400">No budget set</p>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Main content: 60/40 layout ──────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left — Area chart (3/5 = 60%) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Cost over time</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {explorer && explorer.timeSeries.length > 0 ? (
                <CostSparkline data={explorer.timeSeries} />
              ) : (
                <div className="flex h-40 items-center justify-center text-xs text-slate-400">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Stacked panels (2/5 = 40%) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Cost by Model */}
          {summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Cost by model</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BreakdownList rows={summary.topModels} />
              </CardContent>
            </Card>
          )}

          {/* Top Consumers (features) */}
          {summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Top consumers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BreakdownList rows={summary.topFeatures} />
              </CardContent>
            </Card>
          )}

          {/* Active alerts */}
          <ActiveAlertsCard budgets={budgets} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

interface BreakdownRow {
  key: string
  label: string
  costMicro: number
  percentage: number
}

function BreakdownList({ rows }: { rows: BreakdownRow[] }) {
  if (rows.length === 0) {
    return <p className="px-5 py-4 text-xs text-slate-400">No data</p>
  }

  return (
    <div className="divide-y divide-slate-50">
      {rows.slice(0, 5).map((r) => (
        <div key={r.key} className="flex items-center gap-3 px-5 py-2.5">
          <span className="flex-1 truncate text-sm text-slate-700">
            {r.label || r.key}
          </span>
          <span className="text-xs tabular-nums text-slate-400">
            {formatUsd(r.costMicro)}
          </span>
          <div className="w-20">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-mint-400 transition-all duration-300"
                  style={{ width: `${Math.min(r.percentage, 100)}%` }}
                />
              </div>
              <span className="w-7 text-right text-[10px] tabular-nums text-slate-400">
                {r.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ActiveAlertsCard({
  budgets,
}: {
  budgets?: Array<{ budgetId: string; name: string; alertsTriggered: number[]; usagePercent: number }>
}) {
  const triggered = budgets?.filter((b) => b.alertsTriggered.length > 0) ?? []

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Alerts</CardTitle>
          {triggered.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-50 px-1.5 text-[10px] font-semibold text-red-600">
              {triggered.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {triggered.length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All clear — no active alerts
          </p>
        ) : (
          <div className="space-y-2">
            {triggered.slice(0, 3).map((b) => (
              <div key={b.budgetId} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="flex-1 truncate text-slate-600">{b.name}</span>
                <span className={cn(
                  'font-medium',
                  b.usagePercent > 85 ? 'text-red-500' : 'text-amber-500',
                )}>
                  {b.usagePercent.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Page export                                                        */
/* ------------------------------------------------------------------ */

export default function OverviewPage() {
  return (
    <Suspense>
      <OverviewContent />
    </Suspense>
  )
}
