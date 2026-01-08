import type { LlmUsageEventPayload } from '@mintlens/shared'

export interface BatchQueueOptions {
  /** Max number of events before an automatic flush. Default: 50 */
  maxBatchSize: number
  /** Max time in ms to hold events before flushing. Default: 1000 */
  flushIntervalMs: number
  /** Called with each batch ready to be sent */
  onFlush: (events: LlmUsageEventPayload[]) => Promise<void>
  /** Called on flush errors (non-throwing by design) */
  onError?: (error: Error) => void
}

/**
 * Internal buffer that accumulates events and flushes them in batches.
 * Fire-and-forget: enqueue() never blocks the caller.
 *
 * Guarantees:
 * - No event is lost if flush is triggered before process exit
 * - Flush errors are reported via onError but never thrown
 * - Timer is cleared on destroy() to prevent memory leaks
 */
export class BatchQueue {
  private buffer: LlmUsageEventPayload[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private flushPromise: Promise<void> | null = null
  private readonly opts: BatchQueueOptions

  constructor(opts: BatchQueueOptions) {
    this.opts = opts
    this.scheduleFlush()
  }

  enqueue(event: LlmUsageEventPayload): void {
    this.buffer.push(event)
    if (this.buffer.length >= this.opts.maxBatchSize) {
      this.triggerFlush()
    }
  }

  async flush(): Promise<void> {
    if (this.flushPromise) return this.flushPromise
    this.flushPromise = this._flush().finally(() => {
      this.flushPromise = null
    })
    return this.flushPromise
  }

  async destroy(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    await this.flush()
  }

  private triggerFlush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    void this.flush()
    this.scheduleFlush()
  }

  private scheduleFlush(): void {
    this.timer = setTimeout(() => {
      void this.flush()
      this.scheduleFlush()
    }, this.opts.flushIntervalMs)
    // Unref so the timer doesn't prevent Node.js from exiting
    if (typeof this.timer === 'object' && 'unref' in this.timer) {
      this.timer.unref()
    }
  }

  private async _flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const batch = this.buffer.splice(0, this.opts.maxBatchSize)
    try {
      await this.opts.onFlush(batch)
    } catch (err) {
      this.opts.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }
}
