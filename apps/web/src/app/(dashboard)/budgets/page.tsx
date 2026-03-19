'use client'

import { Suspense } from 'react'
import { useReadyProject } from '@/hooks/use-ready-project'
import { useBudgets, useDeleteBudget } from '@/hooks/use-budgets'
import { BudgetCard } from '@/components/budgets/budget-card'
import { BudgetsSkeleton } from '@/components/budgets/budgets-skeleton'
import { CreateBudgetDialog } from '@/components/budgets/create-budget-dialog'
import { Wallet } from 'lucide-react'
import { toast } from 'sonner'

function BudgetsContent() {
  const { projectId, waiting } = useReadyProject()
  const { data: budgets, isLoading } = useBudgets(projectId)
  const { mutate: deleteBudget, isPending: deleting } = useDeleteBudget()

  if (waiting) return <BudgetsSkeleton />

  if (!projectId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No projects found
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-end">
        <CreateBudgetDialog projectId={projectId} />
      </div>

      {/* List */}
      {isLoading && !budgets ? (
        <BudgetsSkeleton />
      ) : !budgets || budgets.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white">
          <Wallet className="h-8 w-8 text-slate-200" />
          <p className="text-sm text-slate-400">No active budgets</p>
          <p className="text-xs text-slate-300">Create one to start tracking spend limits</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <BudgetCard
              key={b.budgetId}
              budget={b}
              onDelete={(id) => deleteBudget(id, {
                onSuccess: () => toast.success('Budget deleted'),
                onError: () => toast.error('Failed to delete budget'),
              })}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BudgetsPage() {
  return (
    <Suspense>
      <BudgetsContent />
    </Suspense>
  )
}
