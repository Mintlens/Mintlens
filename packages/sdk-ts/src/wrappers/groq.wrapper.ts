import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'
import { wrapOpenAI } from './openai.wrapper.js'

/**
 * Wraps the Groq SDK client to automatically track usage.
 *
 * Groq exposes an OpenAI-compatible API (same SDK shape), so this wrapper
 * delegates to wrapOpenAI and reports the provider as 'groq'.
 *
 * @example
 * ```typescript
 * import Groq from 'groq-sdk'
 * import { MintlensClient, wrapGroq } from '@mintlens/sdk'
 *
 * const groq = wrapGroq(
 *   new Groq({ apiKey: process.env.GROQ_API_KEY! }),
 *   new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! }),
 * )
 *
 * const response = await groq.chat.completions.create({
 *   model: 'llama-3.3-70b-versatile',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * })
 * ```
 *
 * NOTE: Streaming is not yet tracked.
 */
export function wrapGroq<T extends OpenAICompatibleLike>(
  client: T,
  mintlens: MintlensClient,
  defaultContext?: TrackingContext,
): T {
  return wrapOpenAI(client, mintlens, defaultContext, 'groq') as unknown as T
}

interface OpenAICompatibleLike {
  chat: {
    completions: {
      create: (...args: unknown[]) => Promise<unknown>
    }
  }
}
