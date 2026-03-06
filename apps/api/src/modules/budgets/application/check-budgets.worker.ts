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
import { budgets, budgetAlerts, projects } from '#schema'
import { redis } from '../../../shared/infrastructure/redis.js'
import { logger } from '../../../shared/logger/logger.js'
import { sendBudgetAlertEmail } from './budget-alert.service.js'

const BUDGET_CHECK_QUEUE = 'budget-check'

/** Returns Redis spend key for the current period of a budget */
function spendKey(b: {
  scope: string
  projectId: string
  tenantId: string | null
  featureId: string | null
  period: string
}): string {
  const scopeId = b.tenantId ?? b.featureId ?? b.projectId
  const scope   = b.tenantId ? 'tenant' : b.featureId ? 'feature' : 'project'
  const today   = new Date().toISOString().slice(0, 10)
  const month   = today.slice(0, 7)
  const periodSuffix = b.period === 'daily' ? `daily:${today}` : `monthly:${month}`
  return `budget:${scope}:${scopeId}:${periodSuffix}`
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
    .where(and(eq(budgets.isActive, true), isNull(projects.deletedAt)))

  for (const { budgets: b, projects: p } of activeBudgets) {
    try {
      const key          = spendKey(b)
      const spentRaw     = await redis.get(key)
      const spentMicro   = spentRaw ? Number(spentRaw) : 0
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
          recipient: p.name, // placeholder — real email from user table in next iteration
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
  const redisUrl  = process.env['REDIS_URL'] ?? 'redis://localhost:6379'
  const parsedUrl = new URL(redisUrl)
  const connection = {
    host:     parsedUrl.hostname,
    port:     Number(parsedUrl.port) || 6379,
    password: parsedUrl.password || undefined,
    db:       parsedUrl.pathname ? Number(parsedUrl.pathname.slice(1)) || 0 : 0,
  }

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
