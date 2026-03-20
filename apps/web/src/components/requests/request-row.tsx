import type { LlmRequestRow } from '@/hooks/use-requests'
import { formatUsd, formatNumber, formatLatency, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

const PROVIDER_COLORS: Record<string, string> = {
  openai:    'bg-emerald-50 text-emerald-600',
  anthropic: 'bg-amber-50 text-amber-600',
  google:    'bg-blue-50 text-blue-600',
  mistral:   'bg-purple-50 text-purple-600',
  cohere:    'bg-rose-50 text-rose-600',
}

function providerBadge(provider: string) {
  const color = PROVIDER_COLORS[provider.toLowerCase()] ?? 'bg-slate-50 text-slate-600'
  return (
    <span className={cn('inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize', color)}>
      {provider}
    </span>
  )
}

interface RequestRowProps {
  row: LlmRequestRow
}

export function RequestRow({ row }: RequestRowProps) {
  return (
    <tr className="group transition-colors duration-150 hover:bg-mint-50/30">
      {/* Timestamp */}
      <td className="whitespace-nowrap py-2.5 pl-5 pr-3 text-xs text-slate-400">
        {formatDate(row.createdAt)}
        <span className="ml-1.5 text-slate-300">
          {new Date(row.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}
        </span>
      </td>

      {/* Provider */}
      <td className="px-3 py-2.5">{providerBadge(row.provider)}</td>

      {/* Model */}
      <td className="px-3 py-2.5 text-xs font-medium text-slate-700">
        {row.model}
      </td>

      {/* Feature */}
      <td className="px-3 py-2.5 text-xs text-slate-500">
        {row.featureKey ?? <span className="text-slate-300">—</span>}
      </td>

      {/* Tokens */}
      <td className="px-3 py-2.5 text-right text-xs text-slate-600">
        <span className="text-slate-400">{formatNumber(row.tokensInput)}</span>
        <span className="mx-0.5 text-slate-200">/</span>
        <span>{formatNumber(row.tokensOutput)}</span>
      </td>

      {/* Cost */}
      <td className="px-3 py-2.5 text-right text-xs font-medium text-slate-900">
        {formatUsd(row.costTotalMicro)}
      </td>

      {/* Latency */}
      <td className="px-3 py-2.5 pr-5 text-right text-xs text-slate-500">
        {row.latencyMs != null ? formatLatency(row.latencyMs) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  )
}
