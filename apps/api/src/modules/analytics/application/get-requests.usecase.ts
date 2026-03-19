import { sql, SQL, and, eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { projects } from '#schema'
import { NotFoundError } from '../../../shared/errors/app-errors.js'

export interface RequestFilters {
  projectId?: string
  organisationId?: string
  from: Date
  to: Date
  limit: number
  offset: number
  provider?: string
  model?: string
  featureKey?: string
  tenantId?: string
  environment?: string
}

export interface LlmRequestRow {
  id: string
  provider: string
  model: string
  featureKey: string | null
  tenantRef: string | null
  userId: string | null
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  costTotalMicro: number
  latencyMs: number | null
  environment: string
  tags: string[]
  createdAt: string
}

export interface RequestsPage {
  rows: LlmRequestRow[]
  total: number
}

type RawRow = {
  id: string
  provider: string
  model: string
  feature_key: string | null
  tenant_ref: string | null
  user_id: string | null
  tokens_input: string
  tokens_output: string
  tokens_total: string
  cost_total_micro: string
  latency_ms: string | null
  environment: string
  tags: string[] | null
  created_at: string
  [key: string]: unknown
}

type CountRow = {
  total: string
  [key: string]: unknown
}

function buildWhere(f: RequestFilters): SQL[] {
  const conds: SQL[] = [
    sql`lr.created_at >= ${f.from.toISOString()}`,
    sql`lr.created_at <  ${f.to.toISOString()}`,
  ]
  if (f.projectId) {
    conds.push(sql`lr.project_id = ${f.projectId}::uuid`)
  } else if (f.organisationId) {
    conds.push(sql`lr.project_id IN (SELECT id FROM projects WHERE organisation_id = ${f.organisationId}::uuid)`)
  }
  if (f.provider)    conds.push(sql`lr.provider::text = ${f.provider}`)
  if (f.model)       conds.push(sql`lr.model ILIKE ${'%' + f.model + '%'}`)
  if (f.environment) conds.push(sql`lr.environment = ${f.environment}`)
  if (f.tenantId)    conds.push(sql`lr.tenant_id = ${f.tenantId}::uuid`)
  if (f.featureKey) {
    conds.push(sql`f.key = ${f.featureKey}`)
  }
  return conds
}

export async function getRequestsUseCase(f: RequestFilters): Promise<RequestsPage> {
  if (f.projectId && f.organisationId) {
    const [project] = await db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.id, f.projectId), eq(projects.organisationId, f.organisationId)))
      .limit(1)
    if (!project) throw new NotFoundError('Project', f.projectId)
  }

  const conds = buildWhere(f)
  const where = sql.join(conds, sql` AND `)

  // Count + rows in parallel
  const [countResult, rowsResult] = await Promise.all([
    db.execute<CountRow>(sql`
      SELECT COUNT(*)::text AS total
      FROM llm_requests lr
      LEFT JOIN features f ON lr.feature_id = f.id
      WHERE ${where}
    `),
    db.execute<RawRow>(sql`
      SELECT
        lr.id,
        lr.provider::text,
        lr.model,
        f.key                            AS feature_key,
        t.external_ref                   AS tenant_ref,
        lr.user_id,
        lr.tokens_input::text,
        lr.tokens_output::text,
        lr.tokens_total::text,
        lr.cost_total_micro::text,
        lr.latency_ms::text,
        lr.environment,
        lr.tags,
        lr.created_at::text              AS created_at
      FROM llm_requests lr
      LEFT JOIN features f ON lr.feature_id = f.id
      LEFT JOIN tenants  t ON lr.tenant_id  = t.id
      WHERE ${where}
      ORDER BY lr.created_at DESC
      LIMIT ${f.limit} OFFSET ${f.offset}
    `),
  ])

  const total = Number(countResult.rows[0]?.total ?? 0)

  const rows: LlmRequestRow[] = rowsResult.rows.map((r) => ({
    id:             r.id,
    provider:       r.provider,
    model:          r.model,
    featureKey:     r.feature_key,
    tenantRef:      r.tenant_ref,
    userId:         r.user_id,
    tokensInput:    Number(r.tokens_input),
    tokensOutput:   Number(r.tokens_output),
    tokensTotal:    Number(r.tokens_total),
    costTotalMicro: Number(r.cost_total_micro),
    latencyMs:      r.latency_ms != null ? Number(r.latency_ms) : null,
    environment:    r.environment,
    tags:           r.tags ?? [],
    createdAt:      r.created_at,
  }))

  return { rows, total }
}
