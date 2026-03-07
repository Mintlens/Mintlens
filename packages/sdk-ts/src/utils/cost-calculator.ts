import type { LlmProvider } from '@mintlens/shared'

/**
 * Client-side cost estimator — microdollars per token, per provider.
 *
 * NOTE: This table is for *estimation only* (displayed in SDK / client apps).
 *       The authoritative cost used for billing is calculated server-side from
 *       the `model_pricing` table, which is synced daily from LiteLLM.
 *
 * Prices in microdollars per 1M tokens (= µ$/token numerically).
 * 1 µ$/token = $1/1M tokens = $0.000001/token
 *
 * Updated: March 2026. Sources: official provider pricing pages + LiteLLM.
 */
interface ModelPricing {
  inputPricePerMToken: number   // µ$/token (= $/1M tokens)
  outputPricePerMToken: number
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── OpenAI ──────────────────────────────────────────────────────────
  'gpt-5.2':                    { inputPricePerMToken: 1.75,  outputPricePerMToken: 14 },
  'gpt-5.2-pro':                { inputPricePerMToken: 21,    outputPricePerMToken: 168 },
  'gpt-5-mini':                 { inputPricePerMToken: 0.25,  outputPricePerMToken: 2 },
  'gpt-4o':                     { inputPricePerMToken: 2.5,   outputPricePerMToken: 10 },
  'gpt-4o-mini':                { inputPricePerMToken: 0.15,  outputPricePerMToken: 0.6 },
  'gpt-4-turbo':                { inputPricePerMToken: 10,    outputPricePerMToken: 30 },
  'gpt-4':                      { inputPricePerMToken: 30,    outputPricePerMToken: 60 },
  'gpt-3.5-turbo':              { inputPricePerMToken: 0.5,   outputPricePerMToken: 1.5 },
  'o1':                         { inputPricePerMToken: 15,    outputPricePerMToken: 60 },
  'o1-mini':                    { inputPricePerMToken: 3,     outputPricePerMToken: 12 },
  'o3-mini':                    { inputPricePerMToken: 1.1,   outputPricePerMToken: 4.4 },
  'text-embedding-3-small':     { inputPricePerMToken: 0.02,  outputPricePerMToken: 0 },
  'text-embedding-3-large':     { inputPricePerMToken: 0.13,  outputPricePerMToken: 0 },

  // ── Anthropic ───────────────────────────────────────────────────────
  'claude-opus-4-6':            { inputPricePerMToken: 5,     outputPricePerMToken: 25 },
  'claude-sonnet-4-6':          { inputPricePerMToken: 3,     outputPricePerMToken: 15 },
  'claude-haiku-4-5':           { inputPricePerMToken: 1,     outputPricePerMToken: 5 },
  'claude-haiku-4-5-20251001':  { inputPricePerMToken: 1,     outputPricePerMToken: 5 },
  'claude-3-5-sonnet-20241022': { inputPricePerMToken: 3,     outputPricePerMToken: 15 },
  'claude-3-5-haiku-20241022':  { inputPricePerMToken: 0.8,   outputPricePerMToken: 4 },
  'claude-3-opus-20240229':     { inputPricePerMToken: 15,    outputPricePerMToken: 75 },

  // ── Google Gemini ────────────────────────────────────────────────────
  'gemini-3-pro':               { inputPricePerMToken: 2,     outputPricePerMToken: 12 },
  'gemini-2.5-flash':           { inputPricePerMToken: 0.1,   outputPricePerMToken: 0.4 },
  'gemini-2.0-flash':           { inputPricePerMToken: 0.1,   outputPricePerMToken: 0.4 },
  'gemini-1.5-pro':             { inputPricePerMToken: 1.25,  outputPricePerMToken: 5 },
  'gemini-1.5-flash':           { inputPricePerMToken: 0.075, outputPricePerMToken: 0.3 },

  // ── Mistral ─────────────────────────────────────────────────────────
  'mistral-large-3':            { inputPricePerMToken: 0.5,   outputPricePerMToken: 1.5 },
  'mistral-large-latest':       { inputPricePerMToken: 0.5,   outputPricePerMToken: 1.5 },
  'mistral-medium-3':           { inputPricePerMToken: 0.4,   outputPricePerMToken: 2 },
  'mistral-small-3':            { inputPricePerMToken: 0.05,  outputPricePerMToken: 0.08 },
  'mistral-small-latest':       { inputPricePerMToken: 0.05,  outputPricePerMToken: 0.08 },
  'codestral-latest':           { inputPricePerMToken: 0.2,   outputPricePerMToken: 0.6 },

  // ── xAI (Grok) ──────────────────────────────────────────────────────
  'grok-4':                     { inputPricePerMToken: 3,     outputPricePerMToken: 15 },
  'grok-4.1-fast':              { inputPricePerMToken: 0.2,   outputPricePerMToken: 0.5 },

  // ── Cohere ──────────────────────────────────────────────────────────
  'command-r-plus':             { inputPricePerMToken: 2.5,   outputPricePerMToken: 10 },
  'command-r':                  { inputPricePerMToken: 0.5,   outputPricePerMToken: 1.5 },
  'command':                    { inputPricePerMToken: 1,     outputPricePerMToken: 2 },
  'command-light':              { inputPricePerMToken: 0.3,   outputPricePerMToken: 0.6 },

  // ── DeepSeek ────────────────────────────────────────────────────────
  'deepseek-chat':              { inputPricePerMToken: 0.28,  outputPricePerMToken: 0.42 },
  'deepseek-reasoner':          { inputPricePerMToken: 0.28,  outputPricePerMToken: 0.42 },
  'deepseek-coder':             { inputPricePerMToken: 0.28,  outputPricePerMToken: 0.42 },

  // ── Groq (hosted Llama / Qwen — ultra-fast inference) ───────────────
  'llama-3.3-70b-versatile':        { inputPricePerMToken: 0.59,  outputPricePerMToken: 0.79 },
  'llama-3.1-8b-instant':           { inputPricePerMToken: 0.05,  outputPricePerMToken: 0.08 },
  'llama-4-scout-17b-16e-instruct': { inputPricePerMToken: 0.11,  outputPricePerMToken: 0.34 },
  'llama-4-maverick-17b-128e-instruct': { inputPricePerMToken: 0.20, outputPricePerMToken: 0.60 },
  'qwen3-32b':                      { inputPricePerMToken: 0.29,  outputPricePerMToken: 0.59 },

  // ── Together AI ──────────────────────────────────────────────────────
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo':      { inputPricePerMToken: 0.18, outputPricePerMToken: 0.18 },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo':          { inputPricePerMToken: 0.88, outputPricePerMToken: 0.88 },
  'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo':    { inputPricePerMToken: 3.5,  outputPricePerMToken: 3.5 },
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8':{ inputPricePerMToken: 0.27, outputPricePerMToken: 0.85 },
  'deepseek-ai/DeepSeek-V3':                          { inputPricePerMToken: 1.25, outputPricePerMToken: 1.25 },
  'deepseek-ai/DeepSeek-R1':                          { inputPricePerMToken: 3,    outputPricePerMToken: 7 },

  // ── Perplexity ───────────────────────────────────────────────────────
  'sonar':                      { inputPricePerMToken: 1,     outputPricePerMToken: 1 },
  'sonar-pro':                  { inputPricePerMToken: 3,     outputPricePerMToken: 15 },
  'sonar-reasoning-pro':        { inputPricePerMToken: 2,     outputPricePerMToken: 8 },
  'sonar-deep-research':        { inputPricePerMToken: 2,     outputPricePerMToken: 8 },

  // ── Kimi / Moonshot AI ───────────────────────────────────────────────
  'kimi-k2':                    { inputPricePerMToken: 0.6,   outputPricePerMToken: 2.5 },
  'kimi-k2.5':                  { inputPricePerMToken: 0.6,   outputPricePerMToken: 3 },
  'kimi-k2-turbo':              { inputPricePerMToken: 1.15,  outputPricePerMToken: 8 },
  'moonshot-v1-8k':             { inputPricePerMToken: 0.2,   outputPricePerMToken: 2 },
  'moonshot-v1-32k':            { inputPricePerMToken: 1,     outputPricePerMToken: 3 },
  'moonshot-v1-128k':           { inputPricePerMToken: 2,     outputPricePerMToken: 5 },

  // ── AWS Bedrock (Claude on Bedrock) ──────────────────────────────────
  'anthropic.claude-3-5-sonnet-20241022-v2:0': { inputPricePerMToken: 3,    outputPricePerMToken: 15 },
  'anthropic.claude-3-5-haiku-20241022-v1:0':  { inputPricePerMToken: 0.8,  outputPricePerMToken: 4 },
  'anthropic.claude-3-haiku-20240307-v1:0':    { inputPricePerMToken: 0.25, outputPricePerMToken: 1.25 },
  'anthropic.claude-3-opus-20240229-v1:0':     { inputPricePerMToken: 15,   outputPricePerMToken: 75 },

  // ── Ollama (local / self-hosted — always free) ───────────────────────
  'ollama/llama3.1':    { inputPricePerMToken: 0, outputPricePerMToken: 0 },
  'ollama/llama3.2':    { inputPricePerMToken: 0, outputPricePerMToken: 0 },
  'ollama/mistral':     { inputPricePerMToken: 0, outputPricePerMToken: 0 },
  'ollama/deepseek-r1': { inputPricePerMToken: 0, outputPricePerMToken: 0 },
  'ollama/qwen2.5':     { inputPricePerMToken: 0, outputPricePerMToken: 0 },
  'ollama/phi3':        { inputPricePerMToken: 0, outputPricePerMToken: 0 },
  'ollama/gemma3':      { inputPricePerMToken: 0, outputPricePerMToken: 0 },
  'ollama/codellama':   { inputPricePerMToken: 0, outputPricePerMToken: 0 },
}

const UNKNOWN_MODEL_FALLBACK: ModelPricing = {
  inputPricePerMToken: 1,
  outputPricePerMToken: 3,
}

export function calculateCostMicro(
  model: string,
  tokensInput: number,
  tokensOutput: number,
  _provider?: LlmProvider,
): number {
  const pricing = lookupPricing(model)
  return Math.round(
    tokensInput  * pricing.inputPricePerMToken +
    tokensOutput * pricing.outputPricePerMToken,
  )
}

function lookupPricing(model: string): ModelPricing {
  if (model in MODEL_PRICING) return MODEL_PRICING[model]!

  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key) || model.includes(key)) return pricing
  }

  // Ollama catch-all: any locally-run model is free
  if (model.startsWith('ollama/')) return { inputPricePerMToken: 0, outputPricePerMToken: 0 }

  return UNKNOWN_MODEL_FALLBACK
}

/** Converts microdollars to a USD string for display */
export function microToUsd(micro: number): string {
  return (micro / 1_000_000).toFixed(6)
}
