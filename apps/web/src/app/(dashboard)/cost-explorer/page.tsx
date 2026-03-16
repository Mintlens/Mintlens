'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
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
  const projectId  = useAuthStore((s) => s.selectedProjectId)

  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [provider, setProvider]       = useState('')
  const [model, setModel]             = useState('')

  const { data, isLoading } = useCostExplorer({
    projectId: projectId ?? '',
    from,
    to,
    granularity,
    ...(provider ? { provider } : {}),
    ...(model    ? { model }    : {}),
  })

  if (!projectId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Select a project above
      </div>
    )
  }

  if (isLoading && !data) {
    return <CostExplorerSkeleton />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Cost Explorer</h2>
          <p className="text-sm text-slate-400">{from} → {to}</p>
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
          <Stat label="Total cost"    value={formatUsd(data.totals.costMicro)} />
          <Stat label="Requests"      value={formatNumber(data.totals.requestCount)} />
          <Stat label="Tokens in"     value={formatNumber(data.totals.tokensInput)} />
          <Stat label="Tokens out"    value={formatNumber(data.totals.tokensOutput)} />
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
