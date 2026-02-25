import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../../modules/auth/application/auth.helpers.js'
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

export async function requireAuth(req: FastifyRequest, _reply: FastifyReply) {
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
  } catch {
    throw new AuthError('Session expired — please log in again')
  }
}
