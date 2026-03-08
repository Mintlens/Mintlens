'use client'

import { cn } from '@/lib/cn'

type Granularity = 'day' | 'week' | 'month'

interface FiltersBarProps {
  granularity: Granularity
  onGranularity: (g: Granularity) => void
  provider: string
  onProvider: (p: string) => void
  model: string
  onModel: (m: string) => void
}

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'day',   label: 'Day' },
  { value: 'week',  label: 'Week' },
  { value: 'month', label: 'Month' },
]

const PROVIDERS = ['', 'openai', 'anthropic', 'google', 'mistral', 'cohere', 'xai', 'groq', 'other']

export function FiltersBar({ granularity, onGranularity, provider, onProvider, model, onModel }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Granularity toggle */}
      <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
        {GRANULARITIES.map((g) => (
          <button
            key={g.value}
            onClick={() => onGranularity(g.value)}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium transition-colors duration-100',
              granularity === g.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Provider filter */}
      <select
        value={provider}
        onChange={(e) => onProvider(e.target.value)}
        className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-mint-400 transition-colors"
      >
        <option value="">All providers</option>
        {PROVIDERS.filter(Boolean).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Model filter */}
      <input
        type="text"
        value={model}
        onChange={(e) => onModel(e.target.value)}
        placeholder="Filter by model…"
        className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint-400 transition-colors w-40"
      />
    </div>
  )
}
