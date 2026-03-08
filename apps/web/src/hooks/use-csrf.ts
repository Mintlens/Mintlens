const BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

let csrfToken: string | null = null

export async function getCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken
  try {
    const res = await fetch(`${BASE}/v1/auth/csrf-token`, { credentials: 'include' })
    if (!res.ok) return null
    const body = (await res.json()) as { data: { csrfToken: string } }
    csrfToken = body.data.csrfToken
    return csrfToken
  } catch {
    return null
  }
}

export function invalidateCsrfToken() {
  csrfToken = null
}
