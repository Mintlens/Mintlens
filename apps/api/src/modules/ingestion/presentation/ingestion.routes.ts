import type { FastifyInstance } from 'fastify'
import { requireApiKey, requireScope } from '../../../shared/middleware/require-api-key.js'
import { validateBody } from '../../../shared/middleware/validate-body.js'
import { ingestBatchBody, type IngestBatchBody } from './ingestion.schemas.js'
import { llmEventsQueue } from '../infrastructure/ingestion.queue.js'
import { logger } from '../../../shared/logger/logger.js'
import { redis } from '../../../shared/infrastructure/redis.js'
import { getOrgPlanTier } from '../../../shared/middleware/require-plan.js'
import { getPlanLimits } from '../../billing/domain/plan-limits.js'
import { PlanLimitExceededError } from '../../../shared/errors/app-errors.js'

export async function ingestionRoutes(app: FastifyInstance) {
  /**
   * POST /v1/events/llm-usage
   * Accepts a batch of LLM usage events from SDK clients.
   * Returns 202 immediately — processing is asynchronous via BullMQ.
   */
  app.post<{ Body: IngestBatchBody }>(
    '/llm-usage',
    {
      schema: {
        body: ingestBatchBody,
        tags: ['Events'],
        summary: 'Ingest a batch of LLM usage events',
        security: [{ apiKeyAuth: [] }],
      },
      preHandler: [requireApiKey, requireScope('ingest'), validateBody(ingestBatchBody)],
      config: { rateLimit: { max: 500, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const { projectId, organisationId } = req.apiKey!
      const { events } = req.body

      // Check usage limit before enqueuing
      const month = new Date().toISOString().slice(0, 7)
      const usageKey = `usage:org:${organisationId}:monthly:${month}`
      const planTier = await getOrgPlanTier(organisationId)
      const limits = getPlanLimits(planTier)

      if (limits.requestsPerMonth > 0) {
        const currentUsage = Number(await redis.get(usageKey) ?? 0)
        if (currentUsage + events.length > limits.requestsPerMonth) {
          throw new PlanLimitExceededError('requests', limits.requestsPerMonth)
        }
      }

      // Increment usage counter
      await redis.incrby(usageKey, events.length)
      await redis.expire(usageKey, 60 * 60 * 24 * 35) // 35 days TTL

      const jobs = events.map((event) => ({
        name: 'llm-event' as const,
        data: { projectId, organisationId, event },
      }))

      await llmEventsQueue.addBulk(jobs)

      logger.debug(
        { projectId, count: events.length },
        'LLM events enqueued',
      )

      return reply.status(202).send({
        data: { accepted: events.length },
      })
    },
  )
}
