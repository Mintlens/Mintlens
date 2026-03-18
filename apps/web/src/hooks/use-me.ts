import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export interface MeResponse {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  organisationId: string
  organisationName: string
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<MeResponse>('/v1/auth/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
