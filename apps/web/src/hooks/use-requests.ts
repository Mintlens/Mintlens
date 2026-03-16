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
  projectId: string
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
    projectId: params.projectId,
    from:      `${params.from}T00:00:00Z`,
    to:        `${params.to}T23:59:59Z`,
    limit:     String(params.limit ?? 50),
    offset:    String(params.offset ?? 0),
    ...(params.provider    ? { provider:    params.provider }    : {}),
    ...(params.model       ? { model:       params.model }       : {}),
    ...(params.featureKey  ? { featureKey:  params.featureKey }  : {}),
    ...(params.tenantId    ? { tenantId:    params.tenantId }    : {}),
    ...(params.environment ? { environment: params.environment } : {}),
  })

  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => apiFetch<RequestsPage>(`/v1/analytics/requests?${qs}`),
    enabled: !!params.projectId,
  })
}
