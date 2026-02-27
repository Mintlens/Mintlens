/**
 * BullMQ queue for asynchronous LLM event processing.
 *
 * The ingestion endpoint enqueues events and returns 202 immediately.
 * The worker picks them up, resolves tenant/feature IDs, calculates cost,
 * checks budget kill-switches, and writes to llm_requests.
 */
import { Queue } from 'bullmq'
import { redis } from '../../../shared/infrastructure/redis.js'
import type { LlmUsageEventInput } from '../presentation/ingestion.schemas.js'

export const LLM_EVENTS_QUEUE = 'llm-events'

export interface LlmEventJob {
  projectId:      string
  organisationId: string
  event:          LlmUsageEventInput
}

export const llmEventsQueue = new Queue<LlmEventJob>(LLM_EVENTS_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { age: 60 * 60 * 24 },  // keep 24h for debugging
    removeOnFail:     { age: 60 * 60 * 24 * 7 }, // keep 7 days for retries
    attempts: 3,
    backoff: { type: 'exponential', delay: 500 },
  },
})
