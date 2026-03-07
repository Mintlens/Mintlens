import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'
import type { LlmProvider } from '@mintlens/shared'

/**
 * Wraps the OpenAI SDK client to automatically track usage.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai'
 * import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'
 *
 * const openai = wrapOpenAI(new OpenAI(), new MintlensClient({ apiKey: 'sk_live_...' }))
 *
 * // Usage is tracked automatically — no other changes needed
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * })
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

// Minimal interface types to avoid hard dependency on openai package
interface OpenAILike {
  chat: {
    completions: {
      create: (...args: unknown[]) => Promise<unknown>
    }
  }
}

interface OpenAIChatCompletionParams {
  model: string
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
