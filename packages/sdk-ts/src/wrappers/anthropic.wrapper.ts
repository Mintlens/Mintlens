import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'

/**
 * Wraps the Anthropic SDK client to automatically track usage.
 *
 * @example
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk'
 * import { MintlensClient, wrapAnthropic } from '@mintlens/sdk'
 *
 * const anthropic = wrapAnthropic(new Anthropic(), new MintlensClient({ apiKey: 'sk_live_...' }))
 *
 * const response = await anthropic.messages.create({
 *   model: 'claude-sonnet-4-6',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello' }],
 * })
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

// Minimal interface types to avoid hard dependency on @anthropic-ai/sdk
interface AnthropicLike {
  messages: {
    create: (...args: unknown[]) => Promise<unknown>
  }
}

interface AnthropicMessageParams {
  model: string
  [key: string]: unknown
}

interface AnthropicMessageResponse {
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
  [key: string]: unknown
}
