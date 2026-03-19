/**
 * Budget checker — runs every 5 minutes via BullMQ repeatable job.
 *
 * For each active budget:
 * 1. Read current spend from Redis counter
 * 2. Compare against limit × threshold %
 * 3. If threshold crossed and not already alerted this period → insert budget_alert
 * 4. If 100% threshold + kill-switch enabled → set kill:project:{id} in Redis
 */
import { Queue, Worker } from 'bullmq'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { budgets, budgetAlerts, projects, users } from '#schema'
import { redis, getBullMQConnection } from '../../../shared/infrastructure/redis.js'
import { logger } from '../../../shared/logger/logger.js'
import { sendBudgetAlertEmail } from './budget-alert.service.js'

const BUDGET_CHECK_QUEUE = 'budget-check'

/** Returns Redis spend for the current period of a budget */
async function currentSpend(b: {
  scope: string
  projectId: string
  tenantId: string | null
  featureId: string | null
  period: string
}): Promise<number> {
  const scopeId = b.tenantId ?? b.featureId ?? b.projectId
  const scope   = b.tenantId ? 'tenant' : b.featureId ? 'feature' : 'project'
  const now     = new Date()
  const today   = now.toISOString().slice(0, 10)
  const month   = today.slice(0, 7)

  if (b.period === 'daily') {
    const raw = await redis.get(`budget:${scope}:${scopeId}:daily:${today}`)
    return raw ? Number(raw) : 0
  }

  if (b.period === 'monthly') {
    const raw = await redis.get(`budget:${scope}:${scopeId}:monthly:${month}`)
    return raw ? Number(raw) : 0
  }

  // rolling_30d: sum last 30 daily counters
  const pipeline = redis.pipeline()
  for (let i = 0; i < 30; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    pipeline.get(`budget:${scope}:${scopeId}:daily:${d.toISOString().slice(0, 10)}`)
  }
  const results = await pipeline.exec()
  let total = 0
  for (const r of results ?? []) {
    if (r?.[1]) total += Number(r[1])
  }
  return total
}

/** Current period key used to deduplicate alerts (e.g. "2026-03" or "2026-03-06") */
function periodKey(period: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return period === 'daily' ? today : today.slice(0, 7)
}

async function checkAllBudgets() {
  const activeBudgets = await db
    .select()
    .from(budgets)
    .innerJoin(projects, eq(budgets.projectId, projects.id))
    .innerJoin(users, and(eq(users.organisationId, projects.organisationId), eq(users.role, 'owner')))
    .where(and(eq(budgets.isActive, true), isNull(projects.deletedAt)))

  for (const { budgets: b, projects: p, users: u } of activeBudgets) {
    try {
      const spentMicro   = await currentSpend(b)
      const usagePct     = b.limitMicro > 0 ? spentMicro / b.limitMicro : 0
      const period       = periodKey(b.period)

      for (const threshold of (b.alertThresholds as number[])) {
        if (usagePct * 100 < threshold) continue

        // Check if we already fired this alert this period
        const [existing] = await db
          .select({ id: budgetAlerts.id })
          .from(budgetAlerts)
          .where(and(
            eq(budgetAlerts.budgetId, b.id),
            eq(budgetAlerts.threshold, threshold),
            eq(budgetAlerts.period, period),
          ))
          .limit(1)

        if (existing) continue // already sent

        // Record the alert
        await db.insert(budgetAlerts).values({
          budgetId:  b.id,
          threshold,
          channel:   'email',
          recipient: u.email,
          period,
          firedAt:   new Date(),
        })

        // Send email notification
        await sendBudgetAlertEmail({
          budgetName:   b.name,
          threshold,
          spentMicro,
          limitMicro:   b.limitMicro,
          projectName:  p.name,
          recipient:    u.email,
        })

        logger.info(
          { budgetId: b.id, threshold, usagePct: Math.round(usagePct * 100) },
          'Budget alert fired',
        )
      }

      // Activate kill-switch if at or above 100% and kill-switch is enabled
      if (b.killSwitchEnabled && usagePct >= 1) {
        const killKey = `kill:project:${b.projectId}`
        await redis.set(killKey, '1', 'EX', 60 * 60 * 25) // 25h TTL — reset next day
        logger.warn({ projectId: b.projectId, budgetId: b.id }, 'Kill-switch activated')
      }
    } catch (err) {
      logger.error({ err, budgetId: b.id }, 'Error checking budget')
    }
  }
}

export function startBudgetCheckerWorker() {
  const connection = getBullMQConnection()

  // Schedule repeatable job every 5 minutes
  const queue = new Queue(BUDGET_CHECK_QUEUE, { connection })
  queue.add(
    'check',
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // 5 minutes
      jobId:  'budget-check-repeatable',
    },
  )

  const worker = new Worker(
    BUDGET_CHECK_QUEUE,
    async () => {
      await checkAllBudgets()
    },
    { connection, concurrency: 1 },
  )

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Budget check job failed')
  })

  logger.info('Budget checker worker started')
  return worker
}
