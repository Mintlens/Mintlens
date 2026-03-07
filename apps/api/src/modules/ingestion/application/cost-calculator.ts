/**
 * Server-side cost calculator.
 *
 * Pricing source: `model_pricing` table, synced daily from LiteLLM.
 * Falls back to { input: 1, output: 3 } µ$/token when the model is unknown.
 *
 * An in-process cache (TTL = 5 min) avoids a DB query on every event.
 *
 * The loader function is injectable (via `setPricingLoader`) to allow
 * unit tests to provide a static price table without a real DB connection.
 */
import { db } from '../../../shared/infrastructure/db.js'
import { modelPricing } from '#schema'

export interface Pricing {
  input: number   // µ$/token
  output: number  // µ$/token
}

const FALLBACK: Pricing = { input: 1, output: 3 }

// ── Loader (injectable for testing) ──────────────────────────────
type PricingRow = { model: string; inputMicroPerToken: number; outputMicroPerToken: number }
type PricingLoader = () => Promise<PricingRow[]>

let pricingLoader: PricingLoader = () => db.select().from(modelPricing)

/** Override the pricing data source — intended for unit tests only. */
export function setPricingLoader(loader: PricingLoader): void {
  pricingLoader = loader
  cache = new Map()
  cacheExpiresAt = 0
}

// ── In-process price cache ────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let cache: Map<string, Pricing> = new Map()
let cacheExpiresAt = 0

async function getCache(): Promise<Map<string, Pricing>> {
  if (Date.now() < cacheExpiresAt && cache.size > 0) return cache

  const rows = await pricingLoader()
  const next = new Map<string, Pricing>()
  for (const r of rows) {
    next.set(r.model, { input: r.inputMicroPerToken, output: r.outputMicroPerToken })
  }

  cache = next
  cacheExpiresAt = Date.now() + CACHE_TTL_MS
  return cache
}

async function lookup(model: string): Promise<Pricing> {
  const prices = await getCache()

  // 1. Exact match
  if (prices.has(model)) return prices.get(model)!

  // 2. Prefix / substring match — handles versioned names like "gpt-4o-2024-11-20"
  for (const [key, p] of prices) {
    if (model.startsWith(key) || model.includes(key)) return p
  }

  return FALLBACK
}

export async function calculateCostMicro(
  provider: string,
  model: string,
  tokensInput: number,
  tokensOutput: number,
): Promise<number> {
  const p = await lookup(model)
  return Math.round(tokensInput * p.input + tokensOutput * p.output)
}

/** Convert microdollars to USD (1 USD = 1 000 000 µ$) */
export function microToUsd(micro: number): number {
  return micro / 1_000_000
}

/** Force-invalidate the in-process cache. */
export function invalidatePricingCache(): void {
  cache = new Map()
  cacheExpiresAt = 0
}
