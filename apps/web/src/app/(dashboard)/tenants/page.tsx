'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Users, Search, ArrowUpDown } from 'lucide-react'
// Org-wide by default — no project selection needed
import { useTenants } from '@/hooks/use-analytics'
import { TenantRow } from '@/components/tenants/tenant-row'
import { TenantsSkeleton } from '@/components/tenants/tenants-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { formatUsd, formatNumber, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { TenantOverview } from '@mintlens/shared'

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

type SortKey = 'cost' | 'requests' | 'tokens' | 'margin'

function sortTenants(tenants: TenantOverview[], key: SortKey, asc: boolean) {
  const copy = [...tenants]
  copy.sort((a, b) => {
    let va: number, vb: number
    switch (key) {
      case 'cost':
        va = a.costMicro; vb = b.costMicro; break
      case 'requests':
        va = a.requests; vb = b.requests; break
      case 'tokens':
        va = a.tokens; vb = b.tokens; break
      case 'margin':
        va = a.grossMargin ?? 0; vb = b.grossMargin ?? 0; break
    }
    return asc ? va - vb : vb - va
  })
  return copy
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

function TenantsContent() {
  const sp        = useSearchParams()
  const from      = sp.get('from') ?? defaultFrom()
  const to        = sp.get('to')   ?? defaultTo()
  const { data: tenants, isLoading } = useTenants(null, from, to)

  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('cost')
  const [sortAsc, setSortAsc] = useState(false)

  if (isLoading && !tenants) {
    return <TenantsSkeleton />
  }

  const filtered = (tenants ?? []).filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.externalRef.toLowerCase().includes(q) ||
      (t.name ?? '').toLowerCase().includes(q)
    )
  })

  const sorted = sortTenants(filtered, sortKey, sortAsc)

  // Aggregated totals
  const totalCost     = filtered.reduce((s, t) => s + t.costMicro, 0)
  const totalRequests = filtered.reduce((s, t) => s + t.requests, 0)
  const totalTokens   = filtered.reduce((s, t) => s + t.tokens, 0)

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
          {filtered.length} tenant{filtered.length !== 1 ? 's' : ''} · {formatDate(from)} — {formatDate(to)}
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants…"
            className="h-9 w-56 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-600 placeholder:text-slate-300 outline-none transition-colors hover:border-slate-300 focus:border-mint-300"
          />
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex gap-6 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm shadow-card">
        <Stat label="Total spend" value={formatUsd(totalCost)} />
        <Stat label="Total requests" value={formatNumber(totalRequests)} />
        <Stat label="Total tokens" value={formatNumber(totalTokens)} />
        <Stat label="Active tenants" value={String(filtered.length)} />
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
                    Tenant
                  </th>
                  <SortableHeader label="Spend"    sortKey="cost"     current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHeader label="Requests" sortKey="requests" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHeader label="Tokens"   sortKey="tokens"   current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHeader label="Margin"   sortKey="margin"   current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <th className="py-2.5 pl-3 pr-5 font-medium text-slate-500 text-xs uppercase tracking-wide text-right">
                    Last seen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((t) => (
                  <TenantRow key={t.tenantId} tenant={t} totalCost={totalCost} />
                ))}
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
      <Users className="h-8 w-8 text-slate-200" />
      <p className="text-sm text-slate-400">
        {hasSearch ? 'No tenants matching your search' : 'No tenants tracked yet'}
      </p>
      {!hasSearch && (
        <p className="text-xs text-slate-300">
          Tenants appear once your app sends requests with a tenant ID
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export default function TenantsPage() {
  return (
    <Suspense>
      <TenantsContent />
    </Suspense>
  )
}
