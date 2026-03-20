import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

interface AlertItem {
  id: string
  budgetId: string
  budgetName: string
  projectName: string
  threshold: number
  channel: string
  period: string
  firedAt: string | null
  readAt: string | null
  createdAt: string
}

interface AlertsResponse {
  alerts: AlertItem[]
  unreadCount: number
}

export function useAlerts(limit = 10) {
  return useQuery({
    queryKey: ['alerts', limit],
    queryFn: () => apiFetch<AlertsResponse>(`/v1/budgets/alerts?limit=${limit}`),
    refetchInterval: 60_000,
  })
}

export function useMarkAlertRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch(`/v1/budgets/alerts/${alertId}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}
