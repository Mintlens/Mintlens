'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download } from 'lucide-react'
import { useCostExplorer } from '@/hooks/use-analytics'
import { CostChart } from '@/components/cost-explorer/cost-chart'
import { BreakdownTable } from '@/components/cost-explorer/breakdown-table'
import { FiltersBar } from '@/components/cost-explorer/filters-bar'
import { CostExplorerSkeleton } from '@/components/cost-explorer/cost-explorer-skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatUsd, formatNumber } from '@/lib/format'

function defaultFrom() {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10)
}
function defaultTo() { return new Date().toISOString().slice(0, 10) }

function CostExplorerContent() {
  const sp         = useSearchParams()
  const from       = sp.get('from') ?? defaultFrom()
  const to         = sp.get('to')   ?? defaultTo()
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [provider, setProvider]       = useState('')
  const [model, setModel]             = useState('')

  const { data, isLoading } = useCostExplorer({
    from,
    to,
    granularity,
    ...(provider ? { provider } : {}),
    ...(model    ? { model }    : {}),
  })

  if (isLoading && !data) {
    return <CostExplorerSkeleton />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400">{from} → {to}</p>
          {data && data.timeSeries.length > 0 && (
            <button
              onClick={async () => {
                const base = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'
                const qs = new URLSearchParams({
                  from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z`,
                  granularity, format: 'csv',
                  ...(provider ? { provider } : {}),
                  ...(model ? { model } : {}),
                })
                const res = await fetch(`${base}/v1/analytics/cost-explorer?${qs}`, { credentials: 'include' })
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `mintlens-cost-${from}-${to}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          )}
        </div>
        <FiltersBar
          granularity={granularity}
          onGranularity={setGranularity}
          provider={provider}
          onProvider={setProvider}
          model={model}
          onModel={setModel}
        />
      </div>

      {/* Totals strip */}
      {data && (
        <div className="flex gap-6 rounded-lg border border-slate-100 bg-white px-5 py-3 text-sm">
          <Stat label="Total cost"    value={formatUsd(data.totalCostMicro)} />
          <Stat label="Requests"      value={formatNumber(data.totalRequests)} />
          <Stat label="Tokens"        value={formatNumber(data.totalTokens)} />
        </div>
      )}

      {/* Main chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spend over time</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {data && data.timeSeries.length > 0 ? (
            <CostChart data={data.timeSeries} />
          ) : (
            <div className="flex h-60 items-center justify-center text-xs text-slate-400">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Breakdowns */}
      {data && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-8 pt-5 md:grid-cols-3">
            <BreakdownTable title="By model"    rows={data.byModel}    />
            <BreakdownTable title="By feature"  rows={data.byFeature}  />
            <BreakdownTable title="By provider" rows={data.byProvider} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function CostExplorerPage() {
  return (
    <Suspense>
      <CostExplorerContent />
    </Suspense>
  )
}
