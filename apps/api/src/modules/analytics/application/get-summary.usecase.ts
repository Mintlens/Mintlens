import { sql } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import type { AnalyticsSummary, DateRange } from '../domain/analytics.types.js'

export async function getSummaryUseCase(
  projectId: string,
  current: DateRange,
  previous: DateRange,
): Promise<AnalyticsSummary> {
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
    WHERE project_id   = ${projectId}::uuid
      AND created_at  >= ${current.from.toISOString()}
      AND created_at  <  ${current.to.toISOString()}
  `)
  const cur = curResult.rows[0]

  // Previous period (for % change)
  const prevResult = await db.execute<{ prev_cost: string; [key: string]: unknown }>(sql`
    SELECT COALESCE(SUM(cost_total_micro), 0)::text AS prev_cost
    FROM llm_requests
    WHERE project_id   = ${projectId}::uuid
      AND created_at  >= ${previous.from.toISOString()}
      AND created_at  <  ${previous.to.toISOString()}
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
