import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken, issueTokens } from '../../modules/auth/application/auth.helpers.js'
import { AuthError } from '../errors/app-errors.js'

/** Extend FastifyRequest to carry parsed JWT payload */
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string
      organisationId: string
      role: string
    }
  }
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // cookie lives 7 days; JWT inside is 1h
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies['access_token']

  if (!token) {
    throw new AuthError()
  }

  try {
    const payload = verifyToken(token)
    req.user = {
      userId: payload.sub,
      organisationId: payload.org,
      role: payload.role,
    }

    // Sliding window: reissue a fresh token on every authenticated request
    const fresh = issueTokens(payload.sub, payload.org, payload.role)
    reply.setCookie('access_token', fresh.accessToken, COOKIE_OPTS)
  } catch {
    throw new AuthError('Session expired — please log in again')
  }
}
