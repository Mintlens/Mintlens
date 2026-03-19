import { eq, and, isNull, sql } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { projects, features } from '#schema'
import { slugify } from '../../auth/application/auth.helpers.js'
import { NotFoundError, ConflictError } from '../../../shared/errors/app-errors.js'

export async function listProjectsUseCase(organisationId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      environment: projects.environment,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(and(eq(projects.organisationId, organisationId), isNull(projects.deletedAt)))
    .orderBy(projects.createdAt)
}

export async function getProjectUseCase(organisationId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.organisationId, organisationId),
      isNull(projects.deletedAt),
    ))
    .limit(1)

  if (!project) throw new NotFoundError('Project', projectId)
  return project
}

export async function createProjectUseCase(
  organisationId: string,
  input: { name: string; environment?: string },
) {
  const slug = slugify(input.name)

  // Check for slug collision within org
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(
      eq(projects.organisationId, organisationId),
      eq(projects.slug, slug),
      isNull(projects.deletedAt),
    ))
    .limit(1)

  if (existing.length > 0) {
    throw new ConflictError(`A project with slug "${slug}" already exists in this organisation`)
  }

  const [created] = await db
    .insert(projects)
    .values({
      organisationId,
      name: input.name,
      slug,
      environment: input.environment ?? 'production',
    })
    .returning()

  return created!
}

export async function updateProjectUseCase(
  organisationId: string,
  projectId: string,
  input: { name?: string | undefined; environment?: string | undefined },
) {
  const project = await getProjectUseCase(organisationId, projectId)

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) {
    updates.name = input.name
    updates.slug = slugify(input.name)
  }
  if (input.environment !== undefined) {
    updates.environment = input.environment
  }

  const [updated] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning()

  return updated!
}

export async function deleteProjectUseCase(
  organisationId: string,
  projectId: string,
) {
  await getProjectUseCase(organisationId, projectId)

  await db
    .update(projects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(projects.id, projectId))
}

export async function listFeaturesWithCostUseCase(
  organisationId: string,
  projectId: string,
  from: Date,
  to: Date,
) {
  // Verify project belongs to org first
  await getProjectUseCase(organisationId, projectId)

  const result = await db.execute<{
    id: string
    key: string
    name: string
    cost_micro: string
    requests: string
    tokens: string
    [key: string]: unknown
  }>(sql`
    SELECT
      f.id,
      f.key,
      f.name,
      COALESCE(SUM(lr.cost_total_micro), 0)::text  AS cost_micro,
      COUNT(lr.id)::text                           AS requests,
      COALESCE(SUM(lr.tokens_total), 0)::text      AS tokens
    FROM features f
    LEFT JOIN llm_requests lr
           ON lr.feature_id = f.id
          AND lr.created_at >= ${from.toISOString()}
          AND lr.created_at <  ${to.toISOString()}
    WHERE f.project_id = ${projectId}::uuid
    GROUP BY f.id, f.key, f.name
    ORDER BY SUM(lr.cost_total_micro) DESC NULLS LAST
  `)

  return result.rows.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    costMicro: Number(r.cost_micro),
    requests: Number(r.requests),
    tokens: Number(r.tokens),
  }))
}
