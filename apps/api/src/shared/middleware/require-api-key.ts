import { createHash } from 'node:crypto'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../infrastructure/db.js'
import { apiKeys, projects } from '../../drizzle/schema/index.js'
import { AuthError } from '../errors/app-errors.js'

declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: {
      keyId: string
      projectId: string
      organisationId: string
      scopes: string[]
    }
  }
}

export async function requireApiKey(req: FastifyRequest, _reply: FastifyReply) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid Authorization header')
  }

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey.startsWith('sk_live_') && !rawKey.startsWith('sk_test_')) {
    throw new AuthError('Invalid API key format')
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const [row] = await db
    .select({
      id:             apiKeys.id,
      projectId:      apiKeys.projectId,
      organisationId: projects.organisationId,
      scopes:         apiKeys.scopes,
      revokedAt:      apiKeys.revokedAt,
      expiresAt:      apiKeys.expiresAt,
    })
    .from(apiKeys)
    .innerJoin(projects, eq(apiKeys.projectId, projects.id))
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1)

  if (!row) {
    throw new AuthError('Invalid API key')
  }

  if (row.expiresAt && row.expiresAt < new Date()) {
    throw new AuthError('API key has expired')
  }

  // Update lastUsedAt asynchronously — don't await
  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => undefined)

  req.apiKey = {
    keyId:          row.id,
    projectId:      row.projectId,
    organisationId: row.organisationId,
    scopes:         row.scopes,
  }
}
