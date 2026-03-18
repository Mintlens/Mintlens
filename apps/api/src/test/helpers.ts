import type { FastifyInstance } from 'fastify'

export function extractAccessToken(setCookieHeader: string | string[]): string {
  const header = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader
  const match = header?.match(/access_token=([^;]+)/)
  if (!match?.[1]) throw new Error('access_token cookie not found in response')
  return match[1]
}

export async function getCsrf(app: FastifyInstance) {
  const res = await app.inject({ method: 'GET', url: '/v1/auth/csrf-token' })
  const token = res.json<{ data: { csrfToken: string } }>().data.csrfToken
  const raw = res.headers['set-cookie']
  const cookie = (Array.isArray(raw) ? raw : [raw])
    .map((c) => c?.split(';')[0])
    .filter(Boolean)
    .join('; ')
  return { token, cookie }
}

export function authHeaders(accessToken: string, csrf: { token: string; cookie: string }) {
  return {
    cookie: `access_token=${accessToken}; ${csrf.cookie}`,
    'x-csrf-token': csrf.token,
  }
}

export function authGetHeaders(accessToken: string, csrf: { token: string; cookie: string }) {
  return {
    cookie: `access_token=${accessToken}; ${csrf.cookie}`,
    'x-csrf-token': csrf.token,
  }
}
