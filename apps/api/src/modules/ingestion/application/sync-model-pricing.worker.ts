/**
 * BullMQ worker — syncs LLM model pricing from LiteLLM's community-maintained
 * price list once per day.
 *
 * Source: https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json
 *
 * LiteLLM units: USD per single token  (input_cost_per_token, output_cost_per_token)
 * Mintlens units: microdollars per token (1 USD = 1 000 000 µ$)
 * Conversion: litellm_value × 1 000 000 = µ$/token
 */
import { Queue, Worker } from 'bullmq'
import { sql } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { modelPricing } from '#schema'
import { logger } from '../../../shared/logger/logger.js'

const LITELLM_PRICE_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

const QUEUE_NAME = 'model-pricing-sync'

interface LiteLLMEntry {
  input_cost_per_token?: number
  output_cost_per_token?: number
  max_input_tokens?: number
  litellm_provider?: string
  mode?: string
}

/** Extract a clean provider name from the LiteLLM model key or litellm_provider field */
function extractProvider(modelKey: string, entry: LiteLLMEntry): string {
  if (entry.litellm_provider) return entry.litellm_provider

  // Keys like "groq/llama-3.3-70b-versatile" → "groq"
  const slash = modelKey.indexOf('/')
  if (slash > 0) return modelKey.slice(0, slash)

  // Top-level OpenAI-style keys (gpt-*, o1, o3, etc.)
  if (modelKey.startsWith('gpt-') || modelKey.startsWith('o1') || modelKey.startsWith('o3') || modelKey.startsWith('text-embedding')) return 'openai'
  if (modelKey.startsWith('claude-')) return 'anthropic'
  if (modelKey.startsWith('gemini-') || modelKey.startsWith('gemma')) return 'google'
  if (modelKey.startsWith('mistral') || modelKey.startsWith('codestral')) return 'mistral'
  if (modelKey.startsWith('command')) return 'cohere'
  if (modelKey.startsWith('grok-')) return 'xai'
  if (modelKey.startsWith('deepseek')) return 'deepseek'

  return 'other'
}

export async function runModelPricingSync(): Promise<void> {
  logger.info('Model pricing sync started')

  const res = await fetch(LITELLM_PRICE_URL)
  if (!res.ok) throw new Error(`LiteLLM fetch failed: ${res.status} ${res.statusText}`)

  const data = (await res.json()) as Record<string, LiteLLMEntry>
  const entries: Array<typeof modelPricing.$inferInsert> = []

  for (const [modelKey, entry] of Object.entries(data)) {
    // Skip meta entries and models without pricing data
    if (modelKey === 'sample_spec') continue
    if (entry.input_cost_per_token === undefined && entry.output_cost_per_token === undefined) continue

    const inputMicro  = Math.round((entry.input_cost_per_token  ?? 0) * 1_000_000)
    const outputMicro = Math.round((entry.output_cost_per_token ?? 0) * 1_000_000)

    entries.push({
      provider:            extractProvider(modelKey, entry),
      model:               modelKey,
      inputMicroPerToken:  inputMicro,
      outputMicroPerToken: outputMicro,
      contextWindow:       entry.max_input_tokens ?? null,
      updatedAt:           new Date(),
    })
  }

  if (entries.length === 0) {
    logger.warn('Model pricing sync: no entries found in LiteLLM response')
    return
  }

  // Upsert in batches of 500 to avoid query size limits
  const BATCH = 500
  let upserted = 0
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH)
    await db
      .insert(modelPricing)
      .values(batch)
      .onConflictDoUpdate({
        target: modelPricing.model,
        set: {
          provider:            sql`excluded.provider`,
          inputMicroPerToken:  sql`excluded.input_micro_per_token`,
          outputMicroPerToken: sql`excluded.output_micro_per_token`,
          contextWindow:       sql`excluded.context_window`,
          updatedAt:           sql`excluded.updated_at`,
        },
      })
    upserted += batch.length
  }

  logger.info({ upserted }, 'Model pricing sync completed')
}

export function startModelPricingSyncWorker() {
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379'
  const parsedUrl = new URL(redisUrl)
  const connection = {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || 6379,
    password: parsedUrl.password || undefined,
    db: parsedUrl.pathname ? Number(parsedUrl.pathname.slice(1)) || 0 : 0,
  }

  // Schedule repeatable job every 24 hours
  const queue = new Queue(QUEUE_NAME, { connection })
  queue.add('sync', {}, {
    repeat: { every: 24 * 60 * 60 * 1000 },
    jobId: 'model-pricing-sync-daily',
  }).catch((err) => logger.error({ err }, 'Failed to schedule model pricing sync'))

  // Run immediately on first boot so the table is populated before any events arrive
  runModelPricingSync().catch((err) =>
    logger.error({ err }, 'Initial model pricing sync failed'),
  )

  const worker = new Worker(
    QUEUE_NAME,
    async () => { await runModelPricingSync() },
    { connection },
  )

  worker.on('failed', (_job, err) => {
    logger.error({ err }, 'Model pricing sync job failed')
  })

  logger.info('Model pricing sync worker started (runs every 24h)')
  return worker
}
