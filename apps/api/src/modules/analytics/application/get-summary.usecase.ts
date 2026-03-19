import { sql, and, eq, type SQL } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { projects } from '#schema'
import { NotFoundError } from '../../../shared/errors/app-errors.js'
import type { AnalyticsSummary, DateRange } from '../domain/analytics.types.js'

interface SummaryScope {
  projectId?: string
  organisationId?: string
}

/**
 * Builds the project filter clause.
 * - When `projectId` is given → filter by single project.
 * - When only `organisationId` is given → filter across ALL projects in the org.
 */
function projectFilter(scope: SummaryScope): SQL {
  if (scope.projectId) {
    return sql`project_id = ${scope.projectId}::uuid`
  }
  return sql`project_id IN (
    SELECT id FROM projects
    WHERE organisation_id = ${scope.organisationId!}::uuid
      AND deleted_at IS NULL
  )`
}

export async function getSummaryUseCase(
  scope: SummaryScope,
  current: DateRange,
  previous: DateRange,
): Promise<AnalyticsSummary> {
  // Verify project belongs to the caller's organisation
  if (scope.projectId && scope.organisationId) {
    const [project] = await db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.id, scope.projectId), eq(projects.organisationId, scope.organisationId)))
      .limit(1)
    if (!project) throw new NotFoundError('Project', scope.projectId)
  }

  const pFilter = projectFilter(scope)

  // Current period
  const curResult = await db.execute<{
    total_cost_micro: string
    total_tokens:     string
    total_requests:   string
    avg_latency_ms:   string | null
    [key: string]: unknown
  }>(sql`
    SELECT
      COALESCE(SUM(cost_total_micro), 0)::text   AS total_cost_micro,
      COALESCE(SUM(tokens_total), 0)::text        AS total_tokens,
      COUNT(*)::text                              AS total_requests,
      AVG(latency_ms)::text                       AS avg_latency_ms
    FROM llm_requests
    WHERE ${pFilter}
      AND created_at >= ${current.from.toISOString()}
      AND created_at <  ${current.to.toISOString()}
  `)
  const cur = curResult.rows[0]

  // Previous period (for % change)
  const prevResult = await db.execute<{ prev_cost: string; [key: string]: unknown }>(sql`
    SELECT COALESCE(SUM(cost_total_micro), 0)::text AS prev_cost
    FROM llm_requests
    WHERE ${pFilter}
      AND created_at >= ${previous.from.toISOString()}
      AND created_at <  ${previous.to.toISOString()}
  `)
  const prev = prevResult.rows[0]

  const totalCostMicro = Number(cur?.total_cost_micro ?? 0)
  const prevCost       = Number(prev?.prev_cost ?? 0)

  const costChangePct = prevCost > 0
    ? (totalCostMicro - prevCost) / prevCost
    : null

  return {
    totalCostMicro,
    totalTokens:   Number(cur?.total_tokens ?? 0),
    totalRequests: Number(cur?.total_requests ?? 0),
    avgLatencyMs:  cur?.avg_latency_ms != null ? Math.round(Number(cur.avg_latency_ms)) : null,
    costChangePct,
  }
}
