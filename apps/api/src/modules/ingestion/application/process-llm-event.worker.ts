/**
 * BullMQ worker — processes LLM usage events from the queue.
 *
 * For each event:
 * 1. Resolve feature_key → feature_id (upsert)
 * 2. Resolve tenant external_ref → tenant_id (upsert if provided)
 * 3. Calculate cost in microdollars
 * 4. Check budget kill-switch in Redis
 * 5. Write to llm_requests table
 * 6. Increment Redis budget counters
 */
import { Worker } from 'bullmq'
import { eq, and } from 'drizzle-orm'
import { redis, getBullMQConnection } from '../../../shared/infrastructure/redis.js'
import { db } from '../../../shared/infrastructure/db.js'
import { llmRequests, features, tenants, projects } from '#schema'
import { logger } from '../../../shared/logger/logger.js'
import { calculateCostMicro } from './cost-calculator.js'
import type { LlmEventJob } from '../infrastructure/ingestion.queue.js'
import { LLM_EVENTS_QUEUE } from '../infrastructure/ingestion.queue.js'

export function startLlmEventsWorker() {
  const connection = getBullMQConnection()

  const worker = new Worker<LlmEventJob>(
    LLM_EVENTS_QUEUE,
    async (job) => {
      const { projectId, organisationId, event } = job.data

      // 1. Resolve feature ID (upsert by key within project)
      let featureId: string | undefined
      if (event.feature_key) {
        const [feat] = await db
          .insert(features)
          .values({ projectId, key: event.feature_key, name: event.feature_key })
          .onConflictDoNothing()
          .returning({ id: features.id })

        // If conflict (already exists), fetch it
        const existing = feat ?? (
          await db
            .select({ id: features.id })
            .from(features)
            .where(and(eq(features.projectId, projectId), eq(features.key, event.feature_key)))
            .limit(1)
        )[0]

        featureId = existing?.id
      }

      // 2. Resolve tenant ID (look up by externalRef within project)
      let tenantId: string | undefined
      if (event.tenant_id) {
        const [ten] = await db
          .insert(tenants)
          .values({ projectId, externalRef: event.tenant_id, name: event.tenant_id })
          .onConflictDoNothing()
          .returning({ id: tenants.id })

        const existing = ten ?? (
          await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(and(eq(tenants.projectId, projectId), eq(tenants.externalRef, event.tenant_id)))
            .limit(1)
        )[0]

        tenantId = existing?.id
      }

      // 3. Calculate cost
      const tokensTotal = event.tokens_input + event.tokens_output
      const costMicro = await calculateCostMicro(event.provider, event.model, event.tokens_input, event.tokens_output)

      // 4. Check kill-switch (non-blocking: if Redis is down, allow the write)
      const killKey = `kill:project:${projectId}`
      try {
        const killed = await redis.get(killKey)
        if (killed === '1') {
          logger.warn({ projectId }, 'Kill-switch active — event dropped')
          return // drop event but don't fail the job
        }
      } catch {
        // Redis unavailable — best-effort, proceed
      }

      // 5. Write to DB
      await db.insert(llmRequests).values({
        projectId,
        tenantId: tenantId ?? null,
        featureId: featureId ?? null,
        userId: event.user_id ?? null,
        provider: event.provider,
        model: event.model,
        requestRef: event.request_ref ?? null,
        tokensInput: event.tokens_input,
        tokensOutput: event.tokens_output,
        tokensTotal,
        costProviderMicro: costMicro,
        costTotalMicro: costMicro,
        latencyMs: event.latency_ms ?? null,
        environment: event.environment ?? 'production',
        sdkVersion: event.sdk_version ?? null,
        tags: event.tags ?? null,
      })

      // 6. Increment budget counters atomically in Redis
      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const month = today.slice(0, 7)                       // YYYY-MM

      const budgetKeys = [
        `budget:project:${projectId}:daily:${today}`,
        `budget:project:${projectId}:monthly:${month}`,
      ]
      if (tenantId) {
        budgetKeys.push(`budget:tenant:${tenantId}:daily:${today}`)
        budgetKeys.push(`budget:tenant:${tenantId}:monthly:${month}`)
      }
      if (featureId) {
        budgetKeys.push(`budget:feature:${featureId}:daily:${today}`)
        budgetKeys.push(`budget:feature:${featureId}:monthly:${month}`)
      }

      try {
        const pipeline = redis.pipeline()
        for (const key of budgetKeys) {
          pipeline.incrby(key, costMicro)
          pipeline.expire(key, 60 * 60 * 24 * 35) // 35 days TTL
        }
        await pipeline.exec()
      } catch {
        // Redis unavailable — budget counters will be stale, acceptable
      }
    },
    {
      connection,
      concurrency: 20,
    },
  )

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'LLM event job failed')
  })

  logger.info('LLM events worker started')
  return worker
}
