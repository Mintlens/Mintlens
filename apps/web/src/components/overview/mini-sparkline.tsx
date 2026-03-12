'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface MiniSparklineProps {
  /** Array of numeric values — will be rendered as-is (no formatting). */
  data: number[]
  /** Stroke / fill color. Defaults to mint-400. */
  color?: string
  /** Height in px. Defaults to 24. */
  height?: number
}

/**
 * Tiny sparkline without axes, labels, or tooltips.
 * Designed to sit inside a KPI card for a 7-day trend glance.
 */
export function MiniSparkline({
  data,
  color = '#4ecba6',
  height = 24,
}: MiniSparklineProps) {
  if (data.length < 2) return null

  const chartData = data.map((v, i) => ({ v, i }))
  const gradientId = `spark-${color.replace('#', '')}`

  return (
    <div style={{ width: 56, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
