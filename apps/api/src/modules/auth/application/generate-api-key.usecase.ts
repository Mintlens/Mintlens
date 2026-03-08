import { createHmac, randomBytes } from 'node:crypto'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { apiKeys, projects } from '#schema'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app-errors.js'
import type { GenerateApiKeyInput, GeneratedApiKey } from '../domain/auth.types.js'

const KEY_PREFIX_STR = 'sk_live_'
const KEY_BYTES = 32

const API_KEY_SALT = process.env['API_KEY_SALT']
if (!API_KEY_SALT) {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('API_KEY_SALT env var is required in production')
  }
}
const _salt = API_KEY_SALT ?? 'dev-salt-change-in-production'

/** HMAC-SHA256(rawKey, API_KEY_SALT) — the only value ever stored */
export function hashApiKey(rawKey: string): string {
  return createHmac('sha256', _salt).update(rawKey).digest('hex')
}

export async function generateApiKeyUseCase(
  organisationId: string,
  input: GenerateApiKeyInput,
): Promise<GeneratedApiKey> {
  // Verify project belongs to this organisation
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.organisationId, organisationId), isNull(projects.deletedAt)))
    .limit(1)

  if (!project) {
    throw new NotFoundError('Project', input.projectId)
  }

  // Generate cryptographically random key
  const rawSecret = randomBytes(KEY_BYTES).toString('hex')
  const rawKey = `${KEY_PREFIX_STR}${rawSecret}`
  const keyPrefix = rawKey.slice(0, 16)

  // HMAC-SHA256(rawKey, API_KEY_SALT) — only this is stored
  const keyHash = hashApiKey(rawKey)

  const [created] = await db
    .insert(apiKeys)
    .values({
      projectId: input.projectId,
      name: input.name,
      keyHash,
      keyPrefix,
      scopes: input.scopes ?? ['ingest'],
      expiresAt: input.expiresAt ?? null,
    })
    .returning({ id: apiKeys.id })

  if (!created) throw new Error('Failed to create API key')

  return { rawKey, keyPrefix, keyId: created.id }
}
