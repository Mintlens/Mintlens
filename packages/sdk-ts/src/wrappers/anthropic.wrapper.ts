import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'

/**
 * Wraps the Anthropic SDK client to automatically track usage.
 *
 * Supports both regular (non-streaming) and streaming message creation.
 * For streaming, usage is collected from the `message_start` and
 * `message_delta` SSE events emitted by the Anthropic API, then reported
 * once the stream is exhausted.
 *
 * @example
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk'
 * import { MintlensClient, wrapAnthropic } from '@mintlens/sdk'
 *
 * const anthropic = wrapAnthropic(new Anthropic(), new MintlensClient({ apiKey: 'sk_live_...' }))
 *
 * // Non-streaming — tracked automatically
 * const response = await anthropic.messages.create({
 *   model: 'claude-sonnet-4-6',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello' }],
 * })
 *
 * // Streaming — also tracked automatically
 * const stream = await anthropic.messages.create({
 *   model: 'claude-sonnet-4-6',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   stream: true,
 * })
 * for await (const event of stream) { ... }
 * ```
 */
export function wrapAnthropic<T extends AnthropicLike>(
  client: T,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
): T {
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'messages') {
        return new Proxy(target.messages, {
          get(messagesTarget, messagesProp) {
            if (messagesProp === 'create') {
              return createTrackedMessage(
                messagesTarget.create.bind(messagesTarget),
                mintlens,
                defaultContext,
              )
            }
            return Reflect.get(messagesTarget, messagesProp)
          },
        })
      }
      return Reflect.get(target, prop)
    },
  }) as T
}

function createTrackedMessage(
  originalCreate: (...args: unknown[]) => Promise<unknown>,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
) {
  return async function trackedCreate(
    params: AnthropicMessageParams & { mintlens?: TrackingContext },
    options?: unknown,
  ) {
    const { mintlens: callContext, ...anthropicParams } = params
    const context = { ...defaultContext, ...callContext }
    const startMs = Date.now()

    // ── Streaming path ────────────────────────────────────────────────────────
    if (anthropicParams.stream === true) {
      const rawStream = (await originalCreate(anthropicParams, options)) as AsyncIterable<AnthropicStreamEvent>

      return wrapAnthropicStream(rawStream, (inputTokens, outputTokens) => {
        mintlens.track({
          provider: 'anthropic',
          model: params.model,
          tokensInput: inputTokens,
          tokensOutput: outputTokens,
          latencyMs: Date.now() - startMs,
          ...context,
        })
      })
    }

    // ── Non-streaming path ────────────────────────────────────────────────────
    const response = (await originalCreate(anthropicParams, options)) as AnthropicMessageResponse
    const latencyMs = Date.now() - startMs

    const usage = response?.usage
    if (usage) {
      mintlens.track({
        provider: 'anthropic',
        model: params.model,
        tokensInput: usage.input_tokens ?? 0,
        tokensOutput: usage.output_tokens ?? 0,
        latencyMs,
        ...context,
      })
    }

    return response
  }
}

/**
 * Wraps an Anthropic streaming async iterable transparently.
 *
 * Anthropic SSE event structure for streaming:
 * - `message_start` → `event.message.usage.input_tokens`
 * - `message_delta` → `event.usage.output_tokens`
 *
 * We accumulate both counters across the stream and call `onUsage` once
 * the iterator is exhausted — without buffering content.
 */
async function* wrapAnthropicStream(
  stream: AsyncIterable<AnthropicStreamEvent>,
  onUsage: (inputTokens: number, outputTokens: number) => void,
): AsyncIterable<AnthropicStreamEvent> {
  let inputTokens = 0
  let outputTokens = 0

  for await (const event of stream) {
    // message_start carries input token count
    if (event.type === 'message_start' && event.message?.usage?.input_tokens != null) {
      inputTokens = event.message.usage.input_tokens
    }
    // message_delta carries output token count
    if (event.type === 'message_delta' && event.usage?.output_tokens != null) {
      outputTokens = event.usage.output_tokens
    }
    yield event
  }

  if (inputTokens > 0 || outputTokens > 0) {
    onUsage(inputTokens, outputTokens)
  }
}

// ── Minimal interface types (no hard dependency on @anthropic-ai/sdk) ──────────

interface AnthropicLike {
  messages: {
    create: (...args: unknown[]) => Promise<unknown>
  }
}

interface AnthropicMessageParams {
  model: string
  stream?: boolean
  [key: string]: unknown
}

interface AnthropicMessageResponse {
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
  [key: string]: unknown
}

interface AnthropicStreamEvent {
  type: string
  /** Emitted in message_start */
  message?: {
    usage?: { input_tokens?: number }
    [key: string]: unknown
  }
  /** Emitted in message_delta */
  usage?: { output_tokens?: number }
  [key: string]: unknown
}
