import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'

/**
 * Wraps the Mistral AI SDK client to automatically track usage.
 *
 * @example
 * ```typescript
 * import { Mistral } from '@mistralai/mistralai'
 * import { MintlensClient, wrapMistral } from '@mintlens/sdk'
 *
 * const mistral = wrapMistral(new Mistral({ apiKey: process.env.MISTRAL_API_KEY! }), mintlens)
 *
 * const response = await mistral.chat.complete({
 *   model: 'mistral-large-latest',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * })
 * ```
 *
 * NOTE: Streaming (chat.stream) is not yet tracked.
 */
export function wrapMistral<T extends MistralLike>(
  client: T,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
): T {
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'chat') {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp) {
            if (chatProp === 'complete') {
              return createTrackedComplete(
                chatTarget.complete.bind(chatTarget),
                mintlens,
                defaultContext,
              )
            }
            return Reflect.get(chatTarget, chatProp)
          },
        })
      }
      return Reflect.get(target, prop)
    },
  }) as T
}

function createTrackedComplete(
  originalFn: (...args: unknown[]) => Promise<unknown>,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
) {
  return async function trackedComplete(
    params: MistralChatParams & { mintlens?: TrackingContext },
    ...rest: unknown[]
  ) {
    const { mintlens: callContext, ...mistralParams } = params
    const context = { ...defaultContext, ...callContext }
    const startMs = Date.now()

    const response = (await originalFn(mistralParams, ...rest)) as MistralChatResponse
    const latencyMs = Date.now() - startMs

    const usage = response?.usage
    if (usage) {
      mintlens.track({
        provider: 'mistral',
        model: params.model,
        tokensInput:  usage.prompt_tokens     ?? 0,
        tokensOutput: usage.completion_tokens ?? 0,
        latencyMs,
        ...context,
      })
    }

    return response
  }
}

// ── Minimal interface types (no hard dependency on @mistralai/mistralai) ──

interface MistralLike {
  chat: {
    complete: (...args: unknown[]) => Promise<unknown>
  }
}

interface MistralChatParams {
  model: string
  [key: string]: unknown
}

interface MistralChatResponse {
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}
