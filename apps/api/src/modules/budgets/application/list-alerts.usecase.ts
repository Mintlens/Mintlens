import { sql, eq, and } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { budgetAlerts, budgets, projects } from '#schema'

export interface AlertRow {
  id: string
  budgetId: string
  budgetName: string
  projectName: string
  threshold: number
  channel: string
  period: string
  firedAt: string | null
  readAt: string | null
  createdAt: string
}

export async function listAlertsUseCase(
  organisationId: string,
  limit = 20,
  offset = 0,
): Promise<{ alerts: AlertRow[]; unreadCount: number }> {
  const rows = await db.execute<{
    id: string
    budget_id: string
    budget_name: string
    project_name: string
    threshold: string
    channel: string
    period: string
    fired_at: string | null
    read_at: string | null
    created_at: string
    [key: string]: unknown
  }>(sql`
    SELECT
      ba.id,
      ba.budget_id,
      b.name           AS budget_name,
      p.name           AS project_name,
      ba.threshold::text,
      ba.channel,
      ba.period,
      ba.fired_at::text,
      ba.read_at::text,
      ba.created_at::text
    FROM budget_alerts ba
    JOIN budgets b ON ba.budget_id = b.id
    JOIN projects p ON b.project_id = p.id
    WHERE p.organisation_id = ${organisationId}::uuid
    ORDER BY ba.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `)

  const countResult = await db.execute<{ cnt: string; [key: string]: unknown }>(sql`
    SELECT COUNT(*)::text AS cnt
    FROM budget_alerts ba
    JOIN budgets b ON ba.budget_id = b.id
    JOIN projects p ON b.project_id = p.id
    WHERE p.organisation_id = ${organisationId}::uuid
      AND ba.read_at IS NULL
  `)

  const unreadCount = Number(countResult.rows[0]?.cnt ?? 0)

  const alerts: AlertRow[] = rows.rows.map((r) => ({
    id: r.id,
    budgetId: r.budget_id,
    budgetName: r.budget_name,
    projectName: r.project_name,
    threshold: Number(r.threshold),
    channel: r.channel,
    period: r.period,
    firedAt: r.fired_at,
    readAt: r.read_at,
    createdAt: r.created_at,
  }))

  return { alerts, unreadCount }
}

export async function markAlertReadUseCase(
  organisationId: string,
  alertId: string,
): Promise<void> {
  // Verify ownership through budget → project → org chain
  const [alert] = await db.execute<{ org_id: string; [key: string]: unknown }>(sql`
    SELECT p.organisation_id AS org_id
    FROM budget_alerts ba
    JOIN budgets b ON ba.budget_id = b.id
    JOIN projects p ON b.project_id = p.id
    WHERE ba.id = ${alertId}::uuid
    LIMIT 1
  `).then((r) => r.rows)

  if (!alert || alert.org_id !== organisationId) return

  await db
    .update(budgetAlerts)
    .set({ readAt: new Date() })
    .where(eq(budgetAlerts.id, alertId))
}
