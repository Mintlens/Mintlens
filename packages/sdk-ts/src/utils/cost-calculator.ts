import type { LlmProvider } from '@mintlens/shared'

/**
 * Provider pricing in microdollars per 1M tokens.
 * Updated: March 2026. Source: official provider pricing pages.
 *
 * 1 microdollar = $0.000001 USD
 * Formula: (tokens / 1_000_000) * pricePerMillion * 1_000_000
 *        = tokens * pricePerMillion
 */
interface ModelPricing {
  inputPricePerMToken: number  // microdollars per 1 token input
  outputPricePerMToken: number // microdollars per 1 token output
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── OpenAI ──────────────────────────────────────────────────────────
  'gpt-4o': { inputPricePerMToken: 2.5, outputPricePerMToken: 10 },
  'gpt-4o-mini': { inputPricePerMToken: 0.15, outputPricePerMToken: 0.6 },
  'gpt-4-turbo': { inputPricePerMToken: 10, outputPricePerMToken: 30 },
  'gpt-4': { inputPricePerMToken: 30, outputPricePerMToken: 60 },
  'gpt-3.5-turbo': { inputPricePerMToken: 0.5, outputPricePerMToken: 1.5 },
  'o1': { inputPricePerMToken: 15, outputPricePerMToken: 60 },
  'o1-mini': { inputPricePerMToken: 3, outputPricePerMToken: 12 },
  'o3-mini': { inputPricePerMToken: 1.1, outputPricePerMToken: 4.4 },
  'text-embedding-3-small': { inputPricePerMToken: 0.02, outputPricePerMToken: 0 },
  'text-embedding-3-large': { inputPricePerMToken: 0.13, outputPricePerMToken: 0 },

  // ── Anthropic ───────────────────────────────────────────────────────
  'claude-opus-4-6': { inputPricePerMToken: 15, outputPricePerMToken: 75 },
  'claude-sonnet-4-6': { inputPricePerMToken: 3, outputPricePerMToken: 15 },
  'claude-haiku-4-5-20251001': { inputPricePerMToken: 0.8, outputPricePerMToken: 4 },
  'claude-3-5-sonnet-20241022': { inputPricePerMToken: 3, outputPricePerMToken: 15 },
  'claude-3-5-haiku-20241022': { inputPricePerMToken: 0.8, outputPricePerMToken: 4 },
  'claude-3-opus-20240229': { inputPricePerMToken: 15, outputPricePerMToken: 75 },

  // ── Google ──────────────────────────────────────────────────────────
  'gemini-2.0-flash': { inputPricePerMToken: 0.1, outputPricePerMToken: 0.4 },
  'gemini-1.5-pro': { inputPricePerMToken: 1.25, outputPricePerMToken: 5 },
  'gemini-1.5-flash': { inputPricePerMToken: 0.075, outputPricePerMToken: 0.3 },

  // ── Mistral ─────────────────────────────────────────────────────────
  'mistral-large-latest': { inputPricePerMToken: 2, outputPricePerMToken: 6 },
  'mistral-small-latest': { inputPricePerMToken: 0.1, outputPricePerMToken: 0.3 },
  'codestral-latest': { inputPricePerMToken: 0.2, outputPricePerMToken: 0.6 },
}

/** Fallback pricing when the model is unknown */
const UNKNOWN_MODEL_FALLBACK: ModelPricing = {
  inputPricePerMToken: 1,
  outputPricePerMToken: 3,
}

/**
 * Calculates the cost of an LLM request in microdollars.
 *
 * @param model - Model identifier (exact match preferred)
 * @param tokensInput - Number of input/prompt tokens
 * @param tokensOutput - Number of output/completion tokens
 * @param provider - Provider hint for partial model-name matching
 * @returns Cost in microdollars
 */
export function calculateCostMicro(
  model: string,
  tokensInput: number,
  tokensOutput: number,
  _provider?: LlmProvider,
): number {
  const pricing = lookupPricing(model)
  const inputCost = Math.round(tokensInput * pricing.inputPricePerMToken)
  const outputCost = Math.round(tokensOutput * pricing.outputPricePerMToken)
  return inputCost + outputCost
}

function lookupPricing(model: string): ModelPricing {
  // Exact match
  if (model in MODEL_PRICING) return MODEL_PRICING[model]!

  // Partial match (e.g. "gpt-4o-2024-08-06" → "gpt-4o")
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key) || model.includes(key)) return pricing
  }

  return UNKNOWN_MODEL_FALLBACK
}

/** Converts microdollars to a USD string for display */
export function microToUsd(micro: number): string {
  return (micro / 1_000_000).toFixed(6)
}
