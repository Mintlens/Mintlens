import { sql } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import type { AnalyticsSummary, DateRange } from '../domain/analytics.types.js'

interface SummaryRow {
  total_cost_micro: string
  total_tokens:     string
  total_requests:   string
  avg_latency_ms:   string | null
}

export async function getSummaryUseCase(
  projectId: string,
  current: DateRange,
  previous: DateRange,
): Promise<AnalyticsSummary> {
  // Current period
  const [cur] = await db.execute<SummaryRow>(sql`
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

  // Previous period (for % change)
  const [prev] = await db.execute<{ prev_cost: string }>(sql`
    SELECT COALESCE(SUM(cost_total_micro), 0)::text AS prev_cost
    FROM llm_requests
    WHERE project_id   = ${projectId}::uuid
      AND created_at  >= ${previous.from.toISOString()}
      AND created_at  <  ${previous.to.toISOString()}
  `)

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
