'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { List, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { useRequests } from '@/hooks/use-requests'
import { RequestRow } from '@/components/requests/request-row'
import { RequestsSkeleton } from '@/components/requests/requests-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
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

const PAGE_SIZE = 50

/* ------------------------------------------------------------------ */
/*  Filters                                                            */
/* ------------------------------------------------------------------ */

interface FilterSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none',
        'transition-colors hover:border-slate-300 focus:border-mint-300',
      )}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

function RequestsContent() {
  const sp        = useSearchParams()
  const from      = sp.get('from') ?? defaultFrom()
  const to        = sp.get('to')   ?? defaultTo()
  const [offset, setOffset]       = useState(0)
  const [provider, setProvider]   = useState('')
  const [model, setModel]         = useState('')
  const [env, setEnv]             = useState('')

  const { data, isLoading } = useRequests({
    from,
    to,
    limit: PAGE_SIZE,
    offset,
    ...(provider ? { provider }    : {}),
    ...(model    ? { model }       : {}),
    ...(env      ? { environment: env } : {}),
  })

  if (isLoading && !data) {
    return <RequestsSkeleton />
  }

  const rows  = data?.rows ?? []
  const total = data?.total ?? 0
  const page  = Math.floor(offset / PAGE_SIZE) + 1
  const pages = Math.ceil(total / PAGE_SIZE) || 1

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {total.toLocaleString()} request{total !== 1 ? 's' : ''} · {formatDate(from)} — {formatDate(to)}
        </p>

        {/* Filters */}
        <div className="flex gap-2">
          <FilterSelect
            label="All providers"
            value={provider}
            onChange={(v) => { setProvider(v); setOffset(0) }}
            options={['openai', 'anthropic', 'google', 'mistral', 'cohere']}
          />
          <FilterSelect
            label="All environments"
            value={env}
            onChange={(v) => { setEnv(v); setOffset(0) }}
            options={['production', 'staging', 'development']}
          />
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState icon={List} title="No requests found" description="Requests appear once your app sends LLM calls through the SDK" />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50 text-left">
                    <th className="py-2.5 pl-5 pr-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Time
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Provider
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Model
                    </th>
                    <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Feature
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Tokens <span className="text-slate-300">in/out</span>
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Cost
                    </th>
                    <th className="px-3 py-2.5 pr-5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((r) => (
                    <RequestRow key={r.id} row={r} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-50 px-5 py-3">
              <p className="text-xs text-slate-400">
                Page {page} of {pages} · {total.toLocaleString()} total
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                    offset === 0
                      ? 'text-slate-300'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  disabled={offset + PAGE_SIZE >= total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                    offset + PAGE_SIZE >= total
                      ? 'text-slate-300'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty state — uses shared component                                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestsContent />
    </Suspense>
  )
}
