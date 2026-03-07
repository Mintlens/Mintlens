/**
 * Core event types for LLM usage tracking.
 * These types are shared between the SDKs and the API.
 */

export type LlmProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'cohere'
  | 'xai'
  | 'groq'
  | 'together_ai'
  | 'deepseek'
  | 'perplexity'
  | 'kimi'
  | 'bedrock'
  | 'ollama'
  | 'other'

export type Environment = 'production' | 'staging' | 'development'

/**
 * Payload sent from SDK clients to the ingestion API.
 * Privacy-first: never includes prompt content or response text.
 */
export interface LlmUsageEventPayload {
  /** Provider that served the request */
  provider: LlmProvider

  /** Exact model identifier (e.g. "gpt-4o", "claude-3-5-sonnet-20241022") */
  model: string

  /** Input tokens consumed */
  tokensInput: number

  /** Output tokens generated */
  tokensOutput: number

  /** Total latency of the LLM call in milliseconds */
  latencyMs?: number

  /** Your end-customer identifier (opaque — never PII) */
  tenantId?: string

  /** Your end-user identifier (opaque — never PII) */
  userId?: string

  /** Feature or workflow that triggered this call (e.g. "support_chat") */
  featureKey?: string

  /** Deployment environment */
  environment?: Environment

  /** Optional correlation ID for tracing (maps to your own request ID) */
  requestRef?: string

  /** SDK version that sent this event */
  sdkVersion?: string

  /** Free-form tags for custom segmentation (max 10 tags, 50 chars each) */
  tags?: string[]
}

/**
 * Enriched event after server-side processing.
 * Adds computed financial fields.
 */
export interface LlmUsageEvent extends LlmUsageEventPayload {
  id: string
  projectId: string

  /** Provider cost in microdollars (1 USD = 1,000,000 microdollars) */
  costProviderMicro: number

  /** Total cost including markup in microdollars */
  costTotalMicro: number

  /** Estimated revenue based on tenant pricing plan in microdollars */
  revenueEstimatedMicro?: number

  createdAt: Date
}
