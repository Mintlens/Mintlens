import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export interface LlmRequestRow {
  id: string
  provider: string
  model: string
  featureKey: string | null
  tenantRef: string | null
  userId: string | null
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  costTotalMicro: number
  latencyMs: number | null
  environment: string
  tags: string[]
  createdAt: string
}

export interface RequestsPage {
  rows: LlmRequestRow[]
  total: number
}

export interface UseRequestsParams {
  projectId?: string | null
  from: string
  to: string
  limit?: number
  offset?: number
  provider?: string
  model?: string
  featureKey?: string
  tenantId?: string
  environment?: string
}

export function useRequests(params: UseRequestsParams) {
  const qs = new URLSearchParams({
    from:      `${params.from}T00:00:00Z`,
    to:        `${params.to}T23:59:59Z`,
    limit:     String(params.limit ?? 50),
    offset:    String(params.offset ?? 0),
  })
  if (params.projectId)   qs.set('projectId', params.projectId)
  if (params.provider)    qs.set('provider', params.provider)
  if (params.model)       qs.set('model', params.model)
  if (params.featureKey)  qs.set('featureKey', params.featureKey)
  if (params.tenantId)    qs.set('tenantId', params.tenantId)
  if (params.environment) qs.set('environment', params.environment)

  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => apiFetch<RequestsPage>(`/v1/analytics/requests?${qs}`),
    // Always enabled — null projectId triggers org-wide query
  })
}
