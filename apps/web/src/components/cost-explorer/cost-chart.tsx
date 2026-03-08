'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { CostDataPoint } from '@mintlens/shared'
import { formatDate, formatUsd, formatNumber } from '@/lib/format'

interface CostChartProps {
  data: CostDataPoint[]
}

export function CostChart({ data }: CostChartProps) {
  const chartData = data.map((d) => ({ ...d, dateLabel: formatDate(d.date) }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4ecba6" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#4ecba6" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(2)}`}
        />
        <Tooltip
          content={(props) => {
            const p = props.payload?.[0]?.payload as (CostDataPoint & { dateLabel: string }) | undefined
            if (!p) return null
            return (
              <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-card-hover text-xs space-y-1">
                <p className="font-semibold text-slate-900">{p.dateLabel}</p>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-slate-500">Cost</span>
                  <span className="font-medium text-slate-800">{formatUsd(p.costMicro)}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-slate-500">Requests</span>
                  <span className="font-medium text-slate-800">{formatNumber(p.requestCount)}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-slate-500">Tokens</span>
                  <span className="font-medium text-slate-800">{formatNumber(p.tokensInput + p.tokensOutput)}</span>
                </div>
              </div>
            )
          }}
          cursor={{ stroke: '#4ecba6', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="costMicro"
          stroke="#4ecba6"
          strokeWidth={2}
          fill="url(#costGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#4ecba6', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
