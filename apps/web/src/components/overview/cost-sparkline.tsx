'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { CostDataPoint } from '@mintlens/shared'
import { formatDate, formatUsd } from '@/lib/format'

interface CostSparklineProps {
  data: CostDataPoint[]
}

interface TooltipPayload {
  payload?: { costMicro: number; date: string }
}

function CustomTooltip({ payload }: TooltipPayload) {
  if (!payload) return null
  const d = payload
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-card-hover text-xs">
      <p className="font-medium text-slate-900">{formatUsd(d.costMicro)}</p>
      <p className="text-slate-400">{formatDate(d.date)}</p>
    </div>
  )
}

export function CostSparkline({ data }: CostSparklineProps) {
  const chartData = data.map((d) => ({ ...d, dateLabel: formatDate(d.date) }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4ecba6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4ecba6" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(2)}`}
        />
        <Tooltip
          content={(props) => {
            const p = props.payload?.[0]?.payload as (CostDataPoint & { dateLabel: string }) | undefined
            if (!p) return null
            return (
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-card-hover text-xs">
                <p className="font-medium text-slate-900">{formatUsd(p.costMicro)}</p>
                <p className="text-slate-400">{p.dateLabel}</p>
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
          fill="url(#mintGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#4ecba6', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
