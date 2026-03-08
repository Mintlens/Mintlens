import type { FastifyInstance } from 'fastify'
import { requireApiKey, requireScope } from '../../../shared/middleware/require-api-key.js'
import { validateBody } from '../../../shared/middleware/validate-body.js'
import { ingestBatchBody, type IngestBatchBody } from './ingestion.schemas.js'
import { llmEventsQueue } from '../infrastructure/ingestion.queue.js'
import { logger } from '../../../shared/logger/logger.js'

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
