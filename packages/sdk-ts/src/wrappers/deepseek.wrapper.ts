import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'
import { wrapOpenAI } from './openai.wrapper.js'

/**
 * Wraps a DeepSeek API client to automatically track usage.
 *
 * DeepSeek exposes an OpenAI-compatible API (use the OpenAI SDK with a custom
 * baseURL). This wrapper delegates to wrapOpenAI and reports the provider as 'deepseek'.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai'
 * import { MintlensClient, wrapDeepSeek } from '@mintlens/sdk'
 *
 * const client = wrapDeepSeek(
 *   new OpenAI({
 *     apiKey: process.env.DEEPSEEK_API_KEY!,
 *     baseURL: 'https://api.deepseek.com/v1',
 *   }),
 *   new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! }),
 * )
 *
 * const response = await client.chat.completions.create({
 *   model: 'deepseek-chat',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * })
 * ```
 *
 * Streaming is fully supported (inherited from wrapOpenAI).
 */
export function wrapDeepSeek<T extends OpenAICompatibleLike>(
  client: T,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
): T {
  return wrapOpenAI(client, mintlens, defaultContext, 'deepseek') as unknown as T
}

interface OpenAICompatibleLike {
  chat: {
    completions: {
      create: (...args: unknown[]) => Promise<unknown>
    }
  }
}
