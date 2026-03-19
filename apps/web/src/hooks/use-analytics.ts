import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { AnalyticsSummary, CostExplorerResult, TenantOverview } from '@mintlens/shared'

interface SummaryResponse extends AnalyticsSummary {
  totalCostUsd: number
}

/**
 * Fetches KPI summary.
 * - When `projectId` is provided: per-project summary.
 * - When `projectId` is null: org-wide summary across all projects.
 */
export function useSummary(projectId: string | null, from: string, to: string) {
  const qs = new URLSearchParams({
    from: `${from}T00:00:00Z`,
    to:   `${to}T23:59:59Z`,
  })
  if (projectId) qs.set('projectId', projectId)

  return useQuery({
    queryKey: ['summary', projectId, from, to],
    queryFn: () => apiFetch<SummaryResponse>(`/v1/analytics/summary?${qs}`),
    // Always enabled — null projectId triggers org-wide query
  })
}

export interface CostExplorerParams {
  projectId?: string | null
  from: string
  to: string
  granularity?: 'day' | 'week' | 'month'
  featureKey?: string
  tenantId?: string
  provider?: string
  model?: string
}

/**
 * Fetches cost explorer data (time series + breakdowns).
 * - When `projectId` is provided: per-project data.
 * - When `projectId` is null/undefined: org-wide data.
 */
export function useCostExplorer(params: CostExplorerParams) {
  const qs = new URLSearchParams({
    from:        `${params.from}T00:00:00Z`,
    to:          `${params.to}T23:59:59Z`,
    granularity: params.granularity ?? 'day',
  })
  if (params.projectId)  qs.set('projectId', params.projectId)
  if (params.featureKey) qs.set('featureKey', params.featureKey)
  if (params.tenantId)   qs.set('tenantId', params.tenantId)
  if (params.provider)   qs.set('provider', params.provider)
  if (params.model)      qs.set('model', params.model)

  return useQuery({
    queryKey: ['cost-explorer', params],
    queryFn: () => apiFetch<CostExplorerResult>(`/v1/analytics/cost-explorer?${qs}`),
    // Always enabled — null projectId triggers org-wide query
  })
}

export function useTenants(projectId: string | null, from: string, to: string) {
  const qs = new URLSearchParams({
    from: `${from}T00:00:00Z`,
    to:   `${to}T23:59:59Z`,
  })
  if (projectId) qs.set('projectId', projectId)

  return useQuery({
    queryKey: ['tenants', projectId, from, to],
    queryFn: () => apiFetch<TenantOverview[]>(`/v1/analytics/tenants?${qs}`),
    // Always enabled — null projectId triggers org-wide query
  })
}
