import jwt from 'jsonwebtoken'
import type { AuthTokens, JwtPayload } from '../domain/auth.types.js'

const _rawJwtSecret = process.env['JWT_SECRET']
const _devFallback = 'dev-secret-change-in-production'
if (!_rawJwtSecret || _rawJwtSecret === _devFallback) {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('JWT_SECRET must be set to a non-default value in production')
  }
}
const JWT_SECRET = _rawJwtSecret ?? _devFallback
const JWT_TTL_SECONDS = 60 * 60 // 1 hour — sliding window extends on activity

export function issueTokens(
  userId: string,
  organisationId: string,
  role: string,
): AuthTokens {
  const now = Math.floor(Date.now() / 1000)
  const payload: Omit<JwtPayload, 'iat' | 'exp'> & { iat: number; exp: number } = {
    sub: userId,
    org: organisationId,
    role,
    iat: now,
    exp: now + JWT_TTL_SECONDS,
  }

  const accessToken = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' })
  const expiresAt = new Date((now + JWT_TTL_SECONDS) * 1000).toISOString()

  return { accessToken, expiresAt }
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload
}

/** Convert an org/user name to a URL-safe slug */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}
