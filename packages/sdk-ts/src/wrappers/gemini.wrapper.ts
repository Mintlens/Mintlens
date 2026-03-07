import type { MintlensClient, TrackingContext } from '../client/mintlens-client.js'

/**
 * Wraps the Google Generative AI (Gemini) SDK client to automatically track usage.
 *
 * @example
 * ```typescript
 * import { GoogleGenerativeAI } from '@google/generative-ai'
 * import { MintlensClient, wrapGemini } from '@mintlens/sdk'
 *
 * const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
 * const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })
 * const model = wrapGemini(genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }), mintlens, {
 *   modelName: 'gemini-2.5-flash',
 * })
 *
 * const result = await model.generateContent('Hello')
 * ```
 *
 * NOTE: Streaming (generateContentStream) is not yet tracked.
 */
export function wrapGemini<T extends GeminiModelLike>(
  model: T,
  mintlens: MintlensClient,
  options: { modelName: string; defaultContext?: TrackingContext },
): T {
  return new Proxy(model, {
    get(target, prop) {
      if (prop === 'generateContent') {
        return createTrackedGenerate(
          target.generateContent.bind(target),
          mintlens,
          options.modelName,
          options.defaultContext,
        )
      }
      return Reflect.get(target, prop)
    },
  }) as T
}

function createTrackedGenerate(
  originalFn: (...args: unknown[]) => Promise<unknown>,
  mintlens: MintlensClient,
  modelName: string,
  defaultContext?: TrackingContext,
) {
  return async function trackedGenerate(
    request: GeminiGenerateRequest & { mintlens?: TrackingContext },
    ...rest: unknown[]
  ) {
    const { mintlens: callContext, ...geminiRequest } = request
    const context = { ...defaultContext, ...callContext }
    const startMs = Date.now()

    const response = (await originalFn(geminiRequest, ...rest)) as GeminiGenerateResponse
    const latencyMs = Date.now() - startMs

    const usage = response?.response?.usageMetadata
    if (usage) {
      mintlens.track({
        provider: 'google',
        model: modelName,
        tokensInput:  usage.promptTokenCount     ?? 0,
        tokensOutput: usage.candidatesTokenCount ?? 0,
        latencyMs,
        ...context,
      })
    }

    return response
  }
}

// ── Minimal interface types (no hard dependency on @google/generative-ai) ──

interface GeminiModelLike {
  generateContent: (...args: unknown[]) => Promise<unknown>
}

interface GeminiGenerateRequest {
  [key: string]: unknown
}

interface GeminiGenerateResponse {
  response?: {
    usageMetadata?: {
      promptTokenCount?: number
      candidatesTokenCount?: number
      totalTokenCount?: number
    }
  }
}
