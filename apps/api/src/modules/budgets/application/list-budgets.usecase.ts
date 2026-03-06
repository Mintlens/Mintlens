import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { budgets, projects } from '#schema'
import { redis } from '../../../shared/infrastructure/redis.js'
import { NotFoundError } from '../../../shared/errors/app-errors.js'
import type { BudgetUsage, BudgetPeriod } from '../domain/budgets.types.js'

/** Returns the Redis key for a budget's current-period counter */
function budgetRedisKey(
  scope: string,
  scopeId: string,
  period: BudgetPeriod,
): string {
  const now = new Date()
  const today = now.toISOString().slice(0, 10) // YYYY-MM-DD
  const month = today.slice(0, 7)              // YYYY-MM

  const periodKey = period === 'daily'
    ? today
    : period === 'monthly'
      ? month
      : today // rolling_30d uses same daily key; sum is aggregated separately

  return `budget:${scope}:${scopeId}:${period === 'daily' ? 'daily' : 'monthly'}:${periodKey}`
}

export async function listBudgetsUseCase(
  organisationId: string,
  projectId: string,
): Promise<BudgetUsage[]> {
  // Verify project belongs to org
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organisationId, organisationId)))
    .limit(1)

  if (!project) throw new NotFoundError('Project', projectId)

  const rows = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.projectId, projectId), eq(budgets.isActive, true)))
    .orderBy(budgets.createdAt)

  if (rows.length === 0) return []

  // Fetch current spend from Redis for all budgets in one pipeline
  const pipeline = redis.pipeline()
  for (const b of rows) {
    const scopeId = b.tenantId ?? b.featureId ?? b.projectId
    const scope   = b.tenantId ? 'tenant' : b.featureId ? 'feature' : 'project'
    pipeline.get(budgetRedisKey(scope, scopeId, b.period as BudgetPeriod))
  }
  const results = await pipeline.exec()

  return rows.map((b, i) => {
    const raw = results?.[i]?.[1]
    const spentMicro = raw ? Number(raw) : 0
    const usagePct   = b.limitMicro > 0 ? spentMicro / b.limitMicro : 0

    return {
      budgetId:          b.id,
      name:              b.name,
      scope:             b.scope as BudgetUsage['scope'],
      period:            b.period as BudgetPeriod,
      limitMicro:        b.limitMicro,
      spentMicro,
      usagePct,
      killSwitchEnabled: b.killSwitchEnabled,
      isActive:          b.isActive,
    }
  })
}

export async function deleteBudgetUseCase(
  organisationId: string,
  budgetId: string,
): Promise<void> {
  // Fetch budget and verify org ownership via project join
  const [row] = await db
    .select({ id: budgets.id, projectId: budgets.projectId })
    .from(budgets)
    .where(eq(budgets.id, budgetId))
    .limit(1)

  if (!row) throw new NotFoundError('Budget', budgetId)

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(
      eq(projects.id, row.projectId),
      eq(projects.organisationId, organisationId),
      isNull(projects.deletedAt),
    ))
    .limit(1)

  if (!project) throw new NotFoundError('Budget', budgetId)

  await db
    .update(budgets)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(budgets.id, budgetId))
}
