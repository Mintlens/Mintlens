import type { LlmUsageEventPayload } from '@mintlens/shared'

export interface HttpTransportOptions {
  apiUrl: string
  apiKey: string
  timeoutMs?: number
  maxRetries?: number
  onError?: (error: Error) => void
}

const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_MAX_RETRIES = 3
const RETRY_DELAYS_MS = [200, 500, 1_000]

/**
 * HTTP transport layer for sending event batches to the Mintlens API.
 * Implements retry with exponential backoff on transient failures.
 * Non-throwing by design — errors are reported via onError callback.
 */
export class HttpTransport {
  private readonly opts: Required<HttpTransportOptions>

  constructor(opts: HttpTransportOptions) {
    this.opts = {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      maxRetries: DEFAULT_MAX_RETRIES,
      onError: () => {},
      ...opts,
    }
  }

  async send(events: LlmUsageEventPayload[]): Promise<void> {
    if (events.length === 0) return

    const body = JSON.stringify({ events })
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.opts.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS_MS[attempt - 1] ?? 1_000
        await sleep(delay)
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.opts.timeoutMs)

        const response = await fetch(`${this.opts.apiUrl}/v1/events/llm-usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.opts.apiKey}`,
            'User-Agent': `mintlens-sdk-ts/${SDK_VERSION}`,
          },
          body,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        // 202 Accepted or 200 OK → success
        if (response.status === 202 || response.status === 200) return

        // 4xx (except 429) → don't retry
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const text = await response.text().catch(() => 'unknown error')
          throw new Error(`Mintlens API error ${response.status}: ${text}`)
        }

        // 429 / 5xx → retry
        lastError = new Error(`Mintlens API responded with ${response.status}`)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = new Error(`Mintlens API request timed out after ${this.opts.timeoutMs}ms`)
        } else {
          lastError = err instanceof Error ? err : new Error(String(err))
        }
      }
    }

    if (lastError) this.opts.onError(lastError)
  }
}

const SDK_VERSION = '0.1.0'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
