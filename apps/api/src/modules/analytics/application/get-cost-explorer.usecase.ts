import { sql, SQL } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import type { CostExplorerResult, CostExplorerFilters, CostByDimension } from '../domain/analytics.types.js'

type TimeSeriesRow = {
  bucket:        string
  cost_micro:    string
  tokens:        string
  requests:      string
}

type DimensionRow = {
  key:       string
  label:     string
  cost:      string
  tokens:    string
  requests:  string
}

/** Builds the WHERE clause conditions common to all queries in this use case */
function buildConditions(f: CostExplorerFilters): SQL[] {
  const conds: SQL[] = [
    sql`project_id  = ${f.projectId}::uuid`,
    sql`created_at >= ${f.from.toISOString()}`,
    sql`created_at <  ${f.to.toISOString()}`,
  ]
  if (f.provider)    conds.push(sql`provider    = ${f.provider}`)
  if (f.model)       conds.push(sql`model ILIKE ${'%' + f.model + '%'}`)
  if (f.environment) conds.push(sql`environment = ${f.environment}`)
  if (f.featureKey) {
    conds.push(sql`feature_id = (
      SELECT id FROM features
      WHERE project_id = ${f.projectId}::uuid AND key = ${f.featureKey}
      LIMIT 1
    )`)
  }
  if (f.tenantId) {
    conds.push(sql`tenant_id = ${f.tenantId}::uuid`)
  }
  return conds
}

function granularityTrunc(g: CostExplorerFilters['granularity']): string {
  return g === 'month' ? 'month' : g === 'week' ? 'week' : 'day'
}

function toDimensions(rows: DimensionRow[], totalCost: number): CostByDimension[] {
  return rows.map((r) => ({
    key:       r.key,
    label:     r.label ?? r.key,
    costMicro: Number(r.cost),
    tokens:    Number(r.tokens),
    requests:  Number(r.requests),
    costPct:   totalCost > 0 ? Number(r.cost) / totalCost : 0,
  }))
}

export async function getCostExplorerUseCase(f: CostExplorerFilters): Promise<CostExplorerResult> {
  const conds = buildConditions(f)
  const where = sql.join(conds, sql` AND `)
  const trunc = granularityTrunc(f.granularity)

  // 1. Time series
  const tsSql = sql`
    SELECT
      date_trunc(${trunc}, created_at)::date::text  AS bucket,
      COALESCE(SUM(cost_total_micro), 0)::text       AS cost_micro,
      COALESCE(SUM(tokens_total), 0)::text            AS tokens,
      COUNT(*)::text                                  AS requests
    FROM llm_requests
    WHERE ${where}
    GROUP BY 1
    ORDER BY 1
  `

  // 2. By model
  const byModelSql = sql`
    SELECT
      model                                          AS key,
      model                                          AS label,
      COALESCE(SUM(cost_total_micro), 0)::text       AS cost,
      COALESCE(SUM(tokens_total), 0)::text           AS tokens,
      COUNT(*)::text                                 AS requests
    FROM llm_requests
    WHERE ${where}
    GROUP BY model
    ORDER BY SUM(cost_total_micro) DESC
    LIMIT 20
  `

  // 3. By feature
  const byFeatureSql = sql`
    SELECT
      COALESCE(f.key, 'untagged')                    AS key,
      COALESCE(f.name, 'Untagged')                   AS label,
      COALESCE(SUM(lr.cost_total_micro), 0)::text    AS cost,
      COALESCE(SUM(lr.tokens_total), 0)::text        AS tokens,
      COUNT(*)::text                                 AS requests
    FROM llm_requests lr
    LEFT JOIN features f ON lr.feature_id = f.id
    WHERE ${where}
    GROUP BY f.key, f.name
    ORDER BY SUM(lr.cost_total_micro) DESC
    LIMIT 20
  `

  // 4. By provider
  const byProviderSql = sql`
    SELECT
      provider::text                                 AS key,
      provider::text                                 AS label,
      COALESCE(SUM(cost_total_micro), 0)::text       AS cost,
      COALESCE(SUM(tokens_total), 0)::text           AS tokens,
      COUNT(*)::text                                 AS requests
    FROM llm_requests
    WHERE ${where}
    GROUP BY provider
    ORDER BY SUM(cost_total_micro) DESC
  `

  const [tsResult, modelResult, featureResult, providerResult] = await Promise.all([
    db.execute<TimeSeriesRow>(tsSql),
    db.execute<DimensionRow>(byModelSql),
    db.execute<DimensionRow>(byFeatureSql),
    db.execute<DimensionRow>(byProviderSql),
  ])

  const tsRows       = tsResult.rows
  const modelRows    = modelResult.rows
  const featureRows  = featureResult.rows
  const providerRows = providerResult.rows

  const totalCostMicro = tsRows.reduce((acc, r) => acc + Number(r.cost_micro), 0)
  const totalTokens    = tsRows.reduce((acc, r) => acc + Number(r.tokens), 0)
  const totalRequests  = tsRows.reduce((acc, r) => acc + Number(r.requests), 0)

  return {
    timeSeries: tsRows.map((r) => ({
      date:      r.bucket,
      costMicro: Number(r.cost_micro),
      tokens:    Number(r.tokens),
      requests:  Number(r.requests),
    })),
    byModel:    toDimensions(modelRows, totalCostMicro),
    byFeature:  toDimensions(featureRows, totalCostMicro),
    byProvider: toDimensions(providerRows, totalCostMicro),
    totalCostMicro,
    totalTokens,
    totalRequests,
  }
}
