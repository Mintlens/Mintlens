import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'
import type { LlmProvider } from '@mintlens/shared'

/**
 * Wraps the OpenAI SDK client to automatically track usage.
 *
 * Supports both regular (non-streaming) and streaming completions.
 * For streaming, `stream_options: { include_usage: true }` is injected
 * automatically so the final chunk carries usage data.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai'
 * import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'
 *
 * const openai = wrapOpenAI(new OpenAI(), new MintlensClient({ apiKey: 'sk_live_...' }))
 *
 * // Non-streaming — tracked automatically
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * })
 *
 * // Streaming — also tracked automatically
 * const stream = await openai.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   stream: true,
 * })
 * for await (const chunk of stream) { ... }
 * ```
 */
export function wrapOpenAI<T extends OpenAILike>(
  client: T,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
  provider: LlmProvider = 'openai',
): T {
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'chat') {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp) {
            if (chatProp === 'completions') {
              return new Proxy(chatTarget.completions, {
                get(completionsTarget, completionsProp) {
                  if (completionsProp === 'create') {
                    return createTrackedChatCompletion(
                      completionsTarget.create.bind(completionsTarget),
                      mintlens,
                      defaultContext,
                      provider,
                    )
                  }
                  return Reflect.get(completionsTarget, completionsProp)
                },
              })
            }
            return Reflect.get(chatTarget, chatProp)
          },
        })
      }
      return Reflect.get(target, prop)
    },
  }) as T
}

function createTrackedChatCompletion(
  originalCreate: (...args: unknown[]) => Promise<unknown>,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
  provider: LlmProvider = 'openai',
) {
  return async function trackedCreate(
    params: OpenAIChatCompletionParams & { mintlens?: TrackingContext },
    options?: unknown,
  ) {
    const { mintlens: callContext, ...openaiParams } = params
    const context = { ...defaultContext, ...callContext }
    const startMs = Date.now()

    // ── Streaming path ────────────────────────────────────────────────────────
    if (openaiParams.stream === true) {
      // Inject stream_options.include_usage so the final SSE chunk carries usage.
      const streamParams = {
        ...openaiParams,
        stream_options: {
          include_usage: true,
          ...(openaiParams.stream_options as Record<string, unknown> | undefined),
        },
      }

      const rawStream = (await originalCreate(streamParams, options)) as AsyncIterable<OpenAIStreamChunk>

      return wrapStream(rawStream, (usage) => {
        if (usage) {
          mintlens.track({
            provider,
            model: params.model,
            tokensInput: usage.prompt_tokens ?? 0,
            tokensOutput: usage.completion_tokens ?? 0,
            latencyMs: Date.now() - startMs,
            ...context,
          })
        }
      })
    }

    // ── Non-streaming path ────────────────────────────────────────────────────
    const response = (await originalCreate(openaiParams, options)) as OpenAIChatCompletionResponse
    const latencyMs = Date.now() - startMs

    const usage = response?.usage
    if (usage) {
      mintlens.track({
        provider,
        model: params.model,
        tokensInput: usage.prompt_tokens ?? 0,
        tokensOutput: usage.completion_tokens ?? 0,
        latencyMs,
        ...context,
      })
    }

    return response
  }
}

/**
 * Wraps an OpenAI streaming async iterable transparently.
 *
 * With `stream_options: { include_usage: true }`, OpenAI emits a final SSE
 * chunk where `choices` is empty and `usage` is populated. We collect that
 * usage and fire `onUsage` once the stream is exhausted — without buffering
 * any content chunks.
 */
async function* wrapStream(
  stream: AsyncIterable<OpenAIStreamChunk>,
  onUsage: (usage: OpenAIStreamUsage | undefined) => void,
): AsyncIterable<OpenAIStreamChunk> {
  let lastUsage: OpenAIStreamUsage | undefined

  for await (const chunk of stream) {
    if (chunk.usage) lastUsage = chunk.usage
    yield chunk
  }

  onUsage(lastUsage)
}

// ── Minimal interface types (no hard dependency on openai package) ─────────────

interface OpenAILike {
  chat: {
    completions: {
      create: (...args: unknown[]) => Promise<unknown>
    }
  }
}

interface OpenAIChatCompletionParams {
  model: string
  stream?: boolean
  stream_options?: unknown
  [key: string]: unknown
}

interface OpenAIChatCompletionResponse {
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  [key: string]: unknown
}

interface OpenAIStreamUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

interface OpenAIStreamChunk {
  usage?: OpenAIStreamUsage
  choices?: unknown[]
  [key: string]: unknown
}
