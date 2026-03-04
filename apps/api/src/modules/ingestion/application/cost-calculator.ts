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
  // ── OpenAI ──────────────────────────────────────────────────────────
  'gpt-5.2':             { input: 1.75, output: 14 },
  'gpt-5.2-pro':         { input: 21,   output: 168 },
  'gpt-5-mini':          { input: 0.25, output: 2 },
  'gpt-4o':              { input: 2.5,  output: 10 },
  'gpt-4o-mini':         { input: 0.15, output: 0.6 },
  'gpt-4-turbo':         { input: 10,   output: 30 },
  'gpt-4':               { input: 30,   output: 60 },
  'gpt-3.5-turbo':       { input: 0.5,  output: 1.5 },
  'o1':                  { input: 15,   output: 60 },
  'o1-mini':             { input: 3,    output: 12 },
  'o3-mini':             { input: 1.1,  output: 4.4 },
  // ── Anthropic ───────────────────────────────────────────────────────
  'claude-opus-4-6':            { input: 5,   output: 25 },
  'claude-sonnet-4-6':          { input: 3,   output: 15 },
  'claude-haiku-4-5':           { input: 1,   output: 5 },
  'claude-haiku-4-5-20251001':  { input: 1,   output: 5 },
  'claude-3-5-sonnet-20241022': { input: 3,   output: 15 },
  'claude-3-5-haiku-20241022':  { input: 0.8, output: 4 },
  'claude-3-opus-20240229':     { input: 15,  output: 75 },
  // ── Google ──────────────────────────────────────────────────────────
  'gemini-3-pro':        { input: 2,     output: 12 },
  'gemini-2.5-flash':    { input: 0.1,   output: 0.4 },
  'gemini-2.0-flash':    { input: 0.1,   output: 0.4 },
  'gemini-1.5-pro':      { input: 1.25,  output: 5 },
  'gemini-1.5-flash':    { input: 0.075, output: 0.3 },
  // ── Mistral ─────────────────────────────────────────────────────────
  'mistral-large-3':      { input: 0.5,  output: 1.5 },
  'mistral-large-latest': { input: 0.5,  output: 1.5 },
  'mistral-medium-3':     { input: 0.4,  output: 2 },
  'mistral-small-3':      { input: 0.05, output: 0.08 },
  'mistral-small-latest': { input: 0.05, output: 0.08 },
  'codestral-latest':     { input: 0.2,  output: 0.6 },
  // ── xAI ─────────────────────────────────────────────────────────────
  'grok-4':              { input: 3,    output: 15 },
  'grok-4.1-fast':       { input: 0.2,  output: 0.5 },
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

/** Convert microdollars to USD (1 USD = 1 000 000 µ$) */
export function microToUsd(micro: number): number {
  return micro / 1_000_000
}
