import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { BudgetStatus } from '@mintlens/shared'

export function useBudgets(projectId: string | null) {
  return useQuery({
    queryKey: ['budgets', projectId],
    queryFn: () => apiFetch<BudgetStatus[]>(`/v1/budgets?projectId=${projectId}`),
    enabled: !!projectId,
  })
}

export interface CreateBudgetPayload {
  projectId:         string
  name:              string
  scope:             'project' | 'tenant' | 'feature'
  limitMicro:        number
  period:            'daily' | 'monthly' | 'rolling_30d'
  killSwitchEnabled?: boolean
  alertThresholds?:  number[]
  tenantId?:         string
  featureId?:        string
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateBudgetPayload) =>
      apiFetch('/v1/budgets', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (budgetId: string) =>
      apiFetch(`/v1/budgets/${budgetId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
