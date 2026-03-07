import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'

/**
 * Wraps the Cohere SDK client to automatically track usage.
 *
 * @example
 * ```typescript
 * import { CohereClient } from 'cohere-ai'
 * import { MintlensClient, wrapCohere } from '@mintlens/sdk'
 *
 * const cohere = wrapCohere(
 *   new CohereClient({ token: process.env.COHERE_API_KEY! }),
 *   mintlens,
 * )
 *
 * const response = await cohere.chat({
 *   model: 'command-r-plus',
 *   message: 'Hello',
 * })
 * ```
 *
 * NOTE: Streaming (chatStream) is not yet tracked.
 */
export function wrapCohere<T extends CohereLike>(
  client: T,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
): T {
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'chat') {
        return createTrackedChat(
          target.chat.bind(target),
          mintlens,
          defaultContext,
        )
      }
      return Reflect.get(target, prop)
    },
  }) as T
}

function createTrackedChat(
  originalFn: (...args: unknown[]) => Promise<unknown>,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
) {
  return async function trackedChat(
    params: CohereChatParams & { mintlens?: TrackingContext },
    ...rest: unknown[]
  ) {
    const { mintlens: callContext, ...cohereParams } = params
    const context = { ...defaultContext, ...callContext }
    const startMs = Date.now()

    const response = (await originalFn(cohereParams, ...rest)) as CohereChatResponse
    const latencyMs = Date.now() - startMs

    const usage = response?.meta?.tokens
    if (usage) {
      mintlens.track({
        provider: 'cohere',
        model: params.model ?? 'command-r',
        tokensInput:  usage.input_tokens  ?? 0,
        tokensOutput: usage.output_tokens ?? 0,
        latencyMs,
        ...context,
      })
    }

    return response
  }
}

// ── Minimal interface types (no hard dependency on cohere-ai) ──

interface CohereLike {
  chat: (...args: unknown[]) => Promise<unknown>
}

interface CohereChatParams {
  model?: string
  [key: string]: unknown
}

interface CohereChatResponse {
  meta?: {
    tokens?: {
      input_tokens?: number
      output_tokens?: number
    }
  }
}
