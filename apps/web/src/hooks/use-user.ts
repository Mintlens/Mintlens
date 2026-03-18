import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

interface MeResponse {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
  }
  organisation: {
    id: string
    name: string
    slug: string
    planTier: string
  }
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<MeResponse>('/v1/auth/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}
