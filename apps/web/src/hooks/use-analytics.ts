import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { AnalyticsSummary, CostExplorerResult, TenantOverview } from '@mintlens/shared'

interface SummaryResponse extends AnalyticsSummary {
  totalCostUsd: number
}

export function useSummary(projectId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ['summary', projectId, from, to],
    queryFn: () =>
      apiFetch<SummaryResponse>(
        `/v1/analytics/summary?projectId=${projectId}&from=${from}T00:00:00Z&to=${to}T23:59:59Z`,
      ),
    enabled: !!projectId,
  })
}

export interface CostExplorerParams {
  projectId: string
  from: string
  to: string
  granularity?: 'day' | 'week' | 'month'
  featureKey?: string
  tenantId?: string
  provider?: string
  model?: string
}

export function useCostExplorer(params: CostExplorerParams) {
  const qs = new URLSearchParams({
    projectId:   params.projectId,
    from:        `${params.from}T00:00:00Z`,
    to:          `${params.to}T23:59:59Z`,
    granularity: params.granularity ?? 'day',
    ...(params.featureKey ? { featureKey: params.featureKey } : {}),
    ...(params.tenantId   ? { tenantId:   params.tenantId }   : {}),
    ...(params.provider   ? { provider:   params.provider }   : {}),
    ...(params.model      ? { model:      params.model }      : {}),
  })
  return useQuery({
    queryKey: ['cost-explorer', params],
    queryFn: () => apiFetch<CostExplorerResult>(`/v1/analytics/cost-explorer?${qs}`),
    enabled: !!params.projectId,
  })
}

export function useTenants(projectId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ['tenants', projectId, from, to],
    queryFn: () =>
      apiFetch<TenantOverview[]>(
        `/v1/analytics/tenants?projectId=${projectId}&from=${from}T00:00:00Z&to=${to}T23:59:59Z`,
      ),
    enabled: !!projectId,
  })
}
