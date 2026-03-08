import type { ApiSuccess, ApiError } from '@mintlens/shared'
import { getCsrfToken } from '@/hooks/use-csrf'

const BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (MUTATING.has(method)) {
    const token = await getCsrfToken()
    if (token) headers.set('x-csrf-token', token)
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    let code = 'INTERNAL_ERROR'
    let message = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as ApiError
      code    = body.error.code
      message = body.error.message
    } catch {
      // keep defaults
    }
    throw new ApiRequestError(code, message)
  }

  const body = (await res.json()) as ApiSuccess<T>
  return body.data
}
