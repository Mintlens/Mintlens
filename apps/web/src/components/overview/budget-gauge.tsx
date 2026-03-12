'use client'

import { cn } from '@/lib/cn'

interface BudgetGaugeProps {
  /** 0-100 percentage consumed */
  percent: number
  /** Size in px (width & height). Defaults to 48. */
  size?: number
  /** Stroke width in px. Defaults to 5. */
  strokeWidth?: number
}

/**
 * Circular gauge for budget consumption.
 * Green < 60%, Amber 60-85%, Red > 85%.
 */
export function BudgetGauge({
  percent,
  size = 48,
  strokeWidth = 5,
}: BudgetGaugeProps) {
  const clamped = Math.min(Math.max(percent, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  const color =
    clamped > 85 ? '#ef4444'   // red-500
    : clamped > 60 ? '#f59e0b' // amber-500
    : '#10b981'                // emerald-500

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[10px] font-semibold',
          clamped > 85 ? 'text-red-600' : clamped > 60 ? 'text-amber-600' : 'text-emerald-600',
        )}
      >
        {Math.round(clamped)}%
      </span>
    </div>
  )
}
