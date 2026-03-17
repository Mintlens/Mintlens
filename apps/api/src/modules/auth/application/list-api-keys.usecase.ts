import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { apiKeys, projects } from '#schema'
import { NotFoundError } from '../../../shared/errors/app-errors.js'

export interface ApiKeyRow {
  id: string
  projectId: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  isRevoked: boolean
}

export async function listApiKeysUseCase(
  organisationId: string,
  projectId: string,
): Promise<ApiKeyRow[]> {
  // Verify project belongs to org
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organisationId, organisationId), isNull(projects.deletedAt)))
    .limit(1)

  if (!project) throw new NotFoundError('Project', projectId)

  const rows = await db
    .select({
      id:         apiKeys.id,
      projectId:  apiKeys.projectId,
      name:       apiKeys.name,
      keyPrefix:  apiKeys.keyPrefix,
      scopes:     apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt:  apiKeys.expiresAt,
      createdAt:  apiKeys.createdAt,
      revokedAt:  apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.projectId, projectId))
    .orderBy(apiKeys.createdAt)

  return rows.map((r) => ({
    id:         r.id,
    projectId:  r.projectId,
    name:       r.name,
    keyPrefix:  r.keyPrefix,
    scopes:     r.scopes,
    lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
    expiresAt:  r.expiresAt?.toISOString() ?? null,
    createdAt:  r.createdAt.toISOString(),
    isRevoked:  r.revokedAt != null,
  }))
}

export async function revokeApiKeyUseCase(
  organisationId: string,
  keyId: string,
): Promise<void> {
  // Get the key + project in one query
  const [key] = await db
    .select({ id: apiKeys.id, projectId: apiKeys.projectId })
    .from(apiKeys)
    .where(eq(apiKeys.id, keyId))
    .limit(1)

  if (!key) throw new NotFoundError('ApiKey', keyId)

  // Verify ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, key.projectId), eq(projects.organisationId, organisationId), isNull(projects.deletedAt)))
    .limit(1)

  if (!project) throw new NotFoundError('ApiKey', keyId)

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId))
}
