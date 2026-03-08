'use client'

import { useState } from 'react'
import { Trash2, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatUsd } from '@/lib/format'
import type { BudgetStatus } from '@mintlens/shared'

interface BudgetCardProps {
  budget: BudgetStatus
  onDelete: (id: string) => void
  deleting: boolean
}

const SCOPE_LABELS: Record<string, string> = {
  project: 'Project',
  tenant:  'Tenant',
  feature: 'Feature',
}

const PERIOD_LABELS: Record<string, string> = {
  daily:        'Daily',
  monthly:      'Monthly',
  rolling_30d:  '30-day rolling',
}

export function BudgetCard({ budget, onDelete, deleting }: BudgetCardProps) {
  const [confirming, setConfirming] = useState(false)
  const pct = Math.min(budget.usagePercent, 100)
  const isWarning = pct >= 75 && pct < 90
  const isDanger  = pct >= 90

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    onDelete(budget.budgetId)
    setConfirming(false)
  }

  return (
    <div className={cn(
      'rounded-lg border bg-white p-5 transition-shadow duration-150 hover:shadow-card-hover',
      isDanger ? 'border-red-100' : 'border-slate-100',
    )}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{budget.name}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge variant="default">{SCOPE_LABELS[budget.scope] ?? budget.scope}</Badge>
            <Badge variant="outline">{PERIOD_LABELS[budget.period] ?? budget.period}</Badge>
            {budget.isBlocked && (
              <Badge variant="danger">
                <Zap className="h-2.5 w-2.5" />
                Blocked
              </Badge>
            )}
          </div>
        </div>

        <Button
          size="icon"
          variant={confirming ? 'danger' : 'ghost'}
          onClick={handleDelete}
          disabled={deleting}
          title={confirming ? 'Confirm delete' : 'Delete budget'}
          onBlur={() => setConfirming(false)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Spend bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{formatUsd(budget.currentMicro)}</span>
          <span className={cn(isDanger && 'font-medium text-red-500', isWarning && 'text-amber-500')}>
            {pct.toFixed(0)}% of {formatUsd(budget.limitMicro)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isDanger  ? 'bg-red-400'   :
              isWarning ? 'bg-amber-400'  :
              'bg-mint-400',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {budget.alertsTriggered.length > 0 && (
          <p className="text-xs text-slate-400">
            Alerts triggered at: {budget.alertsTriggered.map((t) => `${t}%`).join(', ')}
          </p>
        )}
      </div>

      {confirming && (
        <p className="mt-3 text-xs text-red-500">Click again to confirm deletion</p>
      )}
    </div>
  )
}
