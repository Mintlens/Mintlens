'use client'

import { Suspense, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, TrendingDown, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis } from 'recharts'
import { useSummary, useCostExplorer } from '@/hooks/use-analytics'
import { KpiCard } from '@/components/overview/kpi-card'
import { CostSparkline } from '@/components/overview/cost-sparkline'
import { OverviewSkeleton } from '@/components/overview/overview-skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatUsd, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CostByDimension } from '@mintlens/shared'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10)
}
function formatDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DONUT_COLORS = ['#4ecba6', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b']
const CHART_PERIODS = [
  { key: '7d',  label: '7D',  days: 7 },
  { key: '14d', label: '14D', days: 14 },
  { key: '30d', label: '1M',  days: 30 },
  { key: 'all', label: 'All', days: 0 },
] as const

/* ------------------------------------------------------------------ */
/*  Overview page content                                              */
/* ------------------------------------------------------------------ */

function OverviewContent() {
  const sp   = useSearchParams()
  const from = sp.get('from') ?? defaultFrom()
  const to   = sp.get('to') ?? defaultTo()

  const [chartPeriod, setChartPeriod] = useState<string>('30d')

  const { data: summary, isLoading: loadingSummary } = useSummary(null, from, to)
  const { data: explorer } = useCostExplorer({ from, to, granularity: 'day' })

  /* Chart data filtered by period picker — must be before early return */
  const chartData = useMemo(() => {
    if (!explorer?.timeSeries) return []
    const selected = CHART_PERIODS.find((p) => p.key === chartPeriod)
    if (!selected || selected.days === 0) return explorer.timeSeries
    return explorer.timeSeries.slice(-selected.days)
  }, [explorer?.timeSeries, chartPeriod])

  if (loadingSummary && !summary) return <OverviewSkeleton />

  const costChange = summary?.costChangePct != null
    ? summary.costChangePct * 100
    : undefined

  const avgCostPerReq = summary && summary.totalRequests > 0
    ? summary.totalCostMicro / summary.totalRequests
    : 0

  const last7Reqs = explorer?.timeSeries.slice(-7).map((d) => d.requests) ?? []

  return (
    <div className="space-y-4 p-5 animate-fade-in">
      {/* Date badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1 text-xs font-medium text-slate-500">
          <Calendar className="h-3 w-3" />
          {formatDateShort(from)} — {formatDateShort(to)}
        </span>
        <span className="text-[11px] text-slate-400">All projects</span>
      </div>

      {/* ============================================================= */}
      {/*  ROW 1 — Hero (6 cols, 2 rows) + 4 KPI cards                 */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:grid-rows-2">
        {/* HERO — Total Spend with gradient */}
        <div className="col-span-2 lg:col-span-6 lg:row-span-2">
          <Card className="hero-gradient h-full overflow-hidden">
            <div className="flex h-full flex-col justify-between">
              <div className="px-6 pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Total Spend
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {loadingSummary ? '—' : formatUsd(summary?.totalCostMicro ?? 0)}
                  </span>
                  {costChange !== undefined && (
                    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                      {costChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      {Math.abs(costChange).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-white/50">vs previous period</p>
              </div>
              {/* Edge-to-edge sparkline with date labels */}
              <HeroSparkline data={explorer?.timeSeries.slice(-7) ?? []} />
            </div>
          </Card>
        </div>

        {/* Requests */}
        <div className="lg:col-span-3">
          <KpiCard
            title="Requests"
            value={loadingSummary ? '—' : formatNumber(summary?.totalRequests ?? 0)}
            subtitle="API calls"
            sparkData={last7Reqs}
            sparkColor="#6366f1"
          />
        </div>

        {/* Avg Cost / Req */}
        <div className="lg:col-span-3">
          <KpiCard
            title="Avg Cost / Req"
            value={loadingSummary ? '—' : formatUsd(avgCostPerReq)}
            subtitle="Across all models"
          />
        </div>

        {/* Total Tokens */}
        <div className="lg:col-span-3">
          <KpiCard
            title="Total Tokens"
            value={loadingSummary ? '—' : formatNumber(summary?.totalTokens ?? 0)}
            subtitle="Input + output"
          />
        </div>

        {/* Avg Latency */}
        <div className="lg:col-span-3">
          <KpiCard
            title="Avg Latency"
            value={loadingSummary ? '—' : summary?.avgLatencyMs ? `${summary.avgLatencyMs}ms` : '—'}
            subtitle="Response time"
          />
        </div>
      </div>

      {/* ============================================================= */}
      {/*  ROW 2 — Spend chart (8) + Donut cost by model (4)           */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Spend over time with period picker */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Spend over time</CardTitle>
              <div className="flex rounded-xl border border-slate-200 p-0.5">
                {CHART_PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setChartPeriod(p.key)}
                    className={cn(
                      'rounded-[10px] px-3 py-1 text-[11px] font-medium transition-colors duration-150',
                      chartPeriod === p.key
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {chartData.length > 0 ? (
                <CostSparkline data={chartData} />
              ) : (
                <div className="flex h-36 items-center justify-center text-xs text-slate-400">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cost by model — Donut */}
        <div className="lg:col-span-4">
          {explorer ? (
            <Card className="h-full">
              <CardHeader className="pb-0">
                <CardTitle>Cost by model</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {explorer.byModel.length > 0 ? (
                  <ModelDonut rows={explorer.byModel} totalCost={summary?.totalCostMicro ?? 0} />
                ) : (
                  <p className="py-8 text-center text-xs text-slate-400">No data</p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* ============================================================= */}
      {/*  ROW 3 — Top consumers (bars) + By provider (dots)           */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {explorer && (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>Top consumers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <HorizontalBars rows={explorer.byFeature} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-5">
          {explorer && (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>By provider</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ProviderList rows={explorer.byProvider} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Edge-to-edge sparkline for the hero card with date x-axis labels */
function HeroSparkline({ data }: { data: Array<{ date: string; costMicro: number }> }) {
  if (!data || data.length < 2) return <div className="h-20" />

  const chartData = data.map((d) => ({
    cost: d.costMicro,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
  }))

  return (
    <div className="mt-3 h-[90px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.20} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.45)' }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth={2}
            fill="url(#heroSparkFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function DeltaBadge({ value }: { value: number }) {
  const positive = value > 0
  const negative = value < 0
  return (
    <span
      className={cn(
        'mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        positive && 'bg-emerald-50/80 text-emerald-600',
        negative && 'bg-red-50/80 text-red-500',
        !positive && !negative && 'bg-slate-50/80 text-slate-400',
      )}
    >
      {positive && <TrendingUp className="h-3 w-3" />}
      {negative && <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function ModelDonut({ rows, totalCost }: { rows: CostByDimension[]; totalCost: number }) {
  const data = rows.slice(0, 5).map((r) => ({
    name: r.label || r.key,
    value: r.costMicro,
  }))

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[150px] w-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-slate-800">{formatUsd(totalCost)}</span>
          <span className="text-[10px] text-slate-400">total</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-[10px] text-slate-500">{d.name.split('-')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBars({ rows }: { rows: CostByDimension[] }) {
  if (rows.length === 0) return <p className="px-5 py-4 text-xs text-slate-400">No data</p>
  const maxCost = Math.max(...rows.slice(0, 5).map((r) => r.costMicro), 1)

  return (
    <div className="space-y-3 px-5 py-3">
      {rows.slice(0, 5).map((r, i) => {
        const pct = (r.costMicro / maxCost) * 100
        return (
          <div key={r.key} className="animate-stagger-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="mb-1 flex items-center justify-between">
              <span className="truncate text-[12px] font-medium text-slate-700">{r.label || r.key}</span>
              <span className="ml-2 shrink-0 text-[12px] tabular-nums text-slate-500">{formatUsd(r.costMicro)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-indigo-500 transition-all duration-700"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProviderList({ rows }: { rows: CostByDimension[] }) {
  if (rows.length === 0) return <p className="px-5 py-4 text-xs text-slate-400">No data</p>

  return (
    <div className="space-y-0.5">
      {rows.slice(0, 5).map((r, i) => {
        const pct = r.costPct * 100
        return (
          <div key={r.key} className="flex items-center gap-3 px-5 py-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="flex-1 text-[13px] font-medium capitalize text-slate-700">{r.label || r.key}</span>
            <span className="text-xs tabular-nums text-slate-400">{formatUsd(r.costMicro)}</span>
            <span className="w-8 text-right text-[10px] tabular-nums text-slate-400">{pct.toFixed(0)}%</span>
          </div>
        )
      })}
    </div>
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
