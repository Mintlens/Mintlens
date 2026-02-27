import { z } from 'zod'

export const llmUsageEventSchema = z.object({
  provider:    z.enum(['openai', 'anthropic', 'google', 'mistral', 'cohere', 'other']),
  model:       z.string().min(1).max(120),
  /** Opaque ID issued by the provider (for deduplication) */
  request_ref: z.string().max(256).optional(),

  tokens_input:  z.number().int().min(0),
  tokens_output: z.number().int().min(0),

  latency_ms:    z.number().int().min(0).optional(),
  environment:   z.string().max(50).optional(),
  sdk_version:   z.string().max(32).optional(),

  /** Per-call overrides — can also be set on the API key / SDK client level */
  tenant_id:   z.string().max(256).optional(),
  user_id:     z.string().max(256).optional(),
  feature_key: z.string().max(256).optional(),
  tags:        z.array(z.string().max(64)).max(20).optional(),
})

export const ingestBatchBody = z.object({
  events: z.array(llmUsageEventSchema).min(1).max(500),
})

export type LlmUsageEventInput = z.infer<typeof llmUsageEventSchema>
export type IngestBatchBody    = z.infer<typeof ingestBatchBody>
