'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Layers, Search, ArrowUpDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatUsd, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeatureRow {
  id: string
  key: string
  name: string
  costMicro: number
  requests: number
  tokens: number
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useFeatures(projectId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ['features', projectId, from, to],
    queryFn: () =>
      apiFetch<FeatureRow[]>(`/v1/projects/${projectId}/features?from=${from}&to=${to}`),
    enabled: !!projectId,
  })
}

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
/*  Sort                                                               */
/* ------------------------------------------------------------------ */

type SortKey = 'cost' | 'requests' | 'tokens'

function sortFeatures(features: FeatureRow[], key: SortKey, asc: boolean) {
  const copy = [...features]
  copy.sort((a, b) => {
    let va: number, vb: number
    switch (key) {
      case 'cost':
        va = a.costMicro; vb = b.costMicro; break
      case 'requests':
        va = a.requests; vb = b.requests; break
      case 'tokens':
        va = a.tokens; vb = b.tokens; break
    }
    return asc ? va - vb : vb - va
  })
  return copy
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

function FeaturesContent() {
  const sp        = useSearchParams()
  const from      = sp.get('from') ?? defaultFrom()
  const to        = sp.get('to')   ?? defaultTo()
  const projectId = useAuthStore((s) => s.selectedProjectId)
  const { data: features, isLoading } = useFeatures(projectId, from, to)

  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('cost')
  const [sortAsc, setSortAsc] = useState(false)

  if (!projectId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Select a project above
      </div>
    )
  }

  if (isLoading && !features) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const filtered = (features ?? []).filter((f) => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.key.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
  })

  const sorted = sortFeatures(filtered, sortKey, sortAsc)

  const totalCost     = filtered.reduce((s, f) => s + f.costMicro, 0)
  const totalRequests = filtered.reduce((s, f) => s + f.requests, 0)
  const totalTokens   = filtered.reduce((s, f) => s + f.tokens, 0)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {filtered.length} feature{filtered.length !== 1 ? 's' : ''} · {from} → {to}
        </p>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search features…"
            className="h-9 w-56 rounded-xl border border-slate-100 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex gap-6 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm shadow-card">
        <Stat label="Total spend" value={formatUsd(totalCost)} />
        <Stat label="Total requests" value={formatNumber(totalRequests)} />
        <Stat label="Total tokens" value={formatNumber(totalTokens)} />
        <Stat label="Active features" value={String(filtered.length)} />
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState hasSearch={!!search} />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50 text-left">
                  <th className="py-2.5 pl-5 pr-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                    Feature
                  </th>
                  <th className="py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                    Key
                  </th>
                  <SortableHeader label="Spend"    sortKey="cost"     current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHeader label="Requests" sortKey="requests" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHeader label="Tokens"   sortKey="tokens"   current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <th className="py-2.5 pl-3 pr-5 font-medium text-slate-500 text-xs uppercase tracking-wide text-right">
                    % of total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((f) => {
                  const pct = totalCost > 0 ? (f.costMicro / totalCost) * 100 : 0
                  return (
                    <tr key={f.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="py-2.5 pl-5 pr-3 font-medium text-slate-900">{f.name}</td>
                      <td className="py-2.5 px-3">
                        <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{f.key}</code>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatUsd(f.costMicro)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{formatNumber(f.requests)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{formatNumber(f.tokens)}</td>
                      <td className="py-2.5 pl-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-mint-400 transition-all duration-300"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs text-slate-400">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function SortableHeader({
  label,
  sortKey,
  current,
  asc,
  onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  asc: boolean
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th className="py-2.5 px-3 text-right">
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors',
          active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600',
        )}
      >
        {label}
        <ArrowUpDown className={cn('h-3 w-3', active && 'text-mint-500')} />
      </button>
    </th>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white">
      <Layers className="h-8 w-8 text-slate-200" />
      <p className="text-sm text-slate-400">
        {hasSearch ? 'No features matching your search' : 'No features tracked yet'}
      </p>
      {!hasSearch && (
        <p className="text-xs text-slate-300">
          Features appear once your app sends requests with a feature key
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export default function FeaturesPage() {
  return (
    <Suspense>
      <FeaturesContent />
    </Suspense>
  )
}
