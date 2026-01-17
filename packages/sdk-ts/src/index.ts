/**
 * @mintlens/sdk — Official TypeScript SDK for Mintlens
 *
 * Track LLM costs, enforce budgets, and attribute spend
 * across features, tenants, and models.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai'
 * import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'
 *
 * const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })
 * const openai = wrapOpenAI(new OpenAI(), mintlens)
 *
 * // That's it — all calls are tracked automatically
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   mintlens: { featureKey: 'support_chat', tenantId: 'customer-123' },
 * })
 * ```
 *
 * @see https://docs.mintlens.io/sdk/typescript
 */

export { MintlensClient, buildEventPayload } from './client/mintlens-client.js'
export type { MintlensClientOptions, TrackingContext } from './client/mintlens-client.js'

export { wrapOpenAI } from './wrappers/openai.wrapper.js'
export { wrapAnthropic } from './wrappers/anthropic.wrapper.js'

export { calculateCostMicro, microToUsd } from './utils/cost-calculator.js'

// Re-export shared types for convenience
export type { LlmUsageEventPayload, LlmProvider, Environment } from '@mintlens/shared'
