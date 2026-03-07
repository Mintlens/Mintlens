import type { LlmUsageEventPayload, LlmProvider, Environment } from '@mintlens/shared'
import { BatchQueue } from '../utils/batch-queue.js'
import { HttpTransport } from './http-transport.js'

export interface MintlensClientOptions {
  /** Your Mintlens project API key (starts with sk_live_ or sk_test_) */
  apiKey: string

  /**
   * Mintlens API base URL.
   * @default "https://api.mintlens.io"
   */
  apiUrl?: string

  /**
   * Default context applied to all tracked events.
   * Can be overridden per-call.
   */
  defaults?: {
    tenantId?: string
    userId?: string
    featureKey?: string
    environment?: Environment
    tags?: string[]
  }

  /**
   * Maximum events to hold before flushing.
   * @default 50
   */
  maxBatchSize?: number

  /**
   * Maximum time in ms between flushes.
   * @default 1000
   */
  flushIntervalMs?: number

  /**
   * Enable debug logging to console.
   * @default false
   */
  debug?: boolean

  /**
   * Called when an event fails to be sent (after retries).
   * Does not throw — your application is never disrupted.
   */
  onError?: (error: Error) => void
}

/**
 * Mintlens SDK client.
 *
 * @example
 * ```typescript
 * import { MintlensClient } from '@mintlens/sdk'
 *
 * const mintlens = new MintlensClient({ apiKey: 'sk_live_...' })
 *
 * // Wrap an OpenAI call
 * const response = await mintlens.trackOpenAI(
 *   openai.chat.completions.create({
 *     model: 'gpt-4o',
 *     messages: [{ role: 'user', content: 'Hello' }],
 *   }),
 *   { featureKey: 'support_chat', tenantId: 'customer-123' }
 * )
 * ```
 */
export class MintlensClient {
  private readonly queue: BatchQueue
  private readonly transport: HttpTransport
  private readonly opts: Required<MintlensClientOptions>

  constructor(opts: MintlensClientOptions) {
    this.opts = {
      apiUrl: 'https://api.mintlens.io',
      defaults: {},
      maxBatchSize: 50,
      flushIntervalMs: 1_000,
      debug: false,
      onError: () => {},
      ...opts,
    }

    this.transport = new HttpTransport({
      apiUrl: this.opts.apiUrl,
      apiKey: this.opts.apiKey,
      onError: this.opts.onError,
    })

    this.queue = new BatchQueue({
      maxBatchSize: this.opts.maxBatchSize,
      flushIntervalMs: this.opts.flushIntervalMs,
      onFlush: (events) => this.transport.send(events),
      onError: this.opts.onError,
    })

    this.log('Mintlens client initialized', { apiUrl: this.opts.apiUrl })
  }

  /**
   * Track a raw LLM usage event.
   * Fire-and-forget: returns immediately, sends in background.
   */
  track(event: LlmUsageEventPayload): void {
    const enriched: LlmUsageEventPayload = {
      ...this.opts.defaults,
      ...event,
      sdkVersion: '0.1.0',
    }
    this.queue.enqueue(enriched)
    this.log('Event enqueued', { provider: enriched.provider, model: enriched.model })
  }

  /**
   * Flush all pending events immediately.
   * Call this before process.exit() to ensure no events are lost.
   */
  async flush(): Promise<void> {
    await this.queue.flush()
  }

  /**
   * Flush pending events and clean up timers.
   * Should be called on graceful shutdown.
   */
  async shutdown(): Promise<void> {
    await this.queue.destroy()
    this.log('Mintlens client shut down')
  }

  private log(message: string, meta?: Record<string, unknown>): void {
    if (this.opts.debug) {
      console.debug('[mintlens]', message, meta ?? '')
    }
  }
}

/** Shared context for a specific LLM call */
export interface TrackingContext {
  tenantId?: string
  userId?: string
  featureKey?: string
  environment?: Environment
  tags?: string[]
}

/** Helper to build an event payload from provider-specific response data */
export function buildEventPayload(
  provider: LlmProvider,
  model: string,
  tokensInput: number,
  tokensOutput: number,
  latencyMs?: number,
  context?: TrackingContext,
): LlmUsageEventPayload {
  return {
    provider,
    model,
    tokensInput,
    tokensOutput,
    ...(latencyMs !== undefined ? { latencyMs } : {}),
    ...context,
  }
}
