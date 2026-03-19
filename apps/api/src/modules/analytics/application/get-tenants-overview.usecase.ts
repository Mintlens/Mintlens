import { sql, and, eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { projects } from '#schema'
import { NotFoundError } from '../../../shared/errors/app-errors.js'
import type { TenantOverview } from '../domain/analytics.types.js'

type TenantRow = {
  tenant_id:                string
  external_ref:             string
  name:                     string | null
  cost_micro:               string
  revenue_estimated_micro:  string
  requests:                 string
  tokens:                   string
  last_seen_at:             string | null
  [key: string]: unknown
}

export async function getTenantsOverviewUseCase(
  scope: { projectId?: string; organisationId?: string },
  from: Date,
  to: Date,
  limit = 100,
  offset = 0,
): Promise<TenantOverview[]> {
  // Verify project belongs to the caller's organisation
  if (scope.projectId && scope.organisationId) {
    const [project] = await db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.id, scope.projectId), eq(projects.organisationId, scope.organisationId)))
      .limit(1)
    if (!project) throw new NotFoundError('Project', scope.projectId)
  }

  const projectFilter = scope.projectId
    ? sql`t.project_id = ${scope.projectId}::uuid`
    : scope.organisationId
      ? sql`t.project_id IN (SELECT id FROM projects WHERE organisation_id = ${scope.organisationId}::uuid)`
      : sql`1=0`

  const rows = await db.execute<TenantRow>(sql`
    SELECT
      t.id                                              AS tenant_id,
      t.external_ref,
      t.name,
      COALESCE(SUM(lr.cost_total_micro), 0)::text       AS cost_micro,
      COALESCE(SUM(lr.revenue_estimated_micro), 0)::text AS revenue_estimated_micro,
      COUNT(lr.id)::text                                AS requests,
      COALESCE(SUM(lr.tokens_total), 0)::text           AS tokens,
      MAX(lr.created_at)::text                          AS last_seen_at
    FROM tenants t
    LEFT JOIN llm_requests lr
           ON lr.tenant_id  = t.id
          AND lr.created_at >= ${from.toISOString()}
          AND lr.created_at <  ${to.toISOString()}
    WHERE ${projectFilter}
    GROUP BY t.id, t.external_ref, t.name
    ORDER BY SUM(lr.cost_total_micro) DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `)

  return rows.rows.map((r) => {
    const cost    = Number(r.cost_micro)
    const revenue = Number(r.revenue_estimated_micro)
    const grossMargin = revenue > 0 ? (revenue - cost) / revenue : null

    return {
      tenantId:              r.tenant_id,
      externalRef:           r.external_ref,
      name:                  r.name,
      costMicro:             cost,
      revenueEstimatedMicro: revenue,
      grossMargin,
      requests:              Number(r.requests),
      tokens:                Number(r.tokens),
      lastSeenAt:            r.last_seen_at,
    }
  })
}
