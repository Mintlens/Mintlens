/**
 * Server-side cost calculator — microdollar pricing for all supported models.
 * Kept in sync with packages/sdk-ts/src/utils/cost-calculator.ts.
 * Updated: March 2026
 */

interface ModelPricing {
  /** µ$ per token (input) */
  input: number
  /** µ$ per token (output) */
  output: number
}

const PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o':              { input: 2.5,  output: 10 },
  'gpt-4o-mini':         { input: 0.15, output: 0.6 },
  'gpt-4-turbo':         { input: 10,   output: 30 },
  'gpt-4':               { input: 30,   output: 60 },
  'gpt-3.5-turbo':       { input: 0.5,  output: 1.5 },
  'o1':                  { input: 15,   output: 60 },
  'o1-mini':             { input: 3,    output: 12 },
  'o3-mini':             { input: 1.1,  output: 4.4 },
  // Anthropic
  'claude-opus-4-6':              { input: 15,  output: 75 },
  'claude-sonnet-4-6':            { input: 3,   output: 15 },
  'claude-haiku-4-5-20251001':    { input: 0.8, output: 4 },
  'claude-3-5-sonnet-20241022':   { input: 3,   output: 15 },
  'claude-3-5-haiku-20241022':    { input: 0.8, output: 4 },
  'claude-3-opus-20240229':       { input: 15,  output: 75 },
  // Google
  'gemini-2.0-flash':    { input: 0.1,   output: 0.4 },
  'gemini-1.5-pro':      { input: 1.25,  output: 5 },
  'gemini-1.5-flash':    { input: 0.075, output: 0.3 },
  // Mistral
  'mistral-large-latest': { input: 2,   output: 6 },
  'mistral-small-latest': { input: 0.1, output: 0.3 },
  'codestral-latest':     { input: 0.2, output: 0.6 },
}

const FALLBACK: ModelPricing = { input: 1, output: 3 }

function lookup(model: string): ModelPricing {
  if (model in PRICING) return PRICING[model]!
  for (const [key, p] of Object.entries(PRICING)) {
    if (model.startsWith(key) || model.includes(key)) return p
  }
  return FALLBACK
}

export function calculateCostMicro(
  provider: string,
  model: string,
  tokensInput: number,
  tokensOutput: number,
): number {
  const p = lookup(model)
  return Math.round(tokensInput * p.input + tokensOutput * p.output)
}
