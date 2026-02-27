import { describe, it, expect } from 'vitest'
import { calculateCostMicro } from '../cost-calculator.js'

describe('calculateCostMicro', () => {
  it('computes gpt-4o cost correctly', () => {
    // gpt-4o: input $2.5/M, output $10/M
    // 1000 input tokens → 1000 * 2.5 = 2500 µ$
    // 500 output tokens  → 500 * 10   = 5000 µ$
    const cost = calculateCostMicro('openai', 'gpt-4o', 1000, 500)
    expect(cost).toBe(7500)
  })

  it('computes claude-sonnet-4-6 cost correctly', () => {
    // input $3/M, output $15/M
    const cost = calculateCostMicro('anthropic', 'claude-sonnet-4-6', 2000, 300)
    // 2000 * 3 = 6000 + 300 * 15 = 4500 → 10500
    expect(cost).toBe(10500)
  })

  it('handles partial model name match', () => {
    // "gpt-4o-2024-11-20" should match "gpt-4o" pricing
    const exact    = calculateCostMicro('openai', 'gpt-4o',          100, 100)
    const partial  = calculateCostMicro('openai', 'gpt-4o-2024-11-20', 100, 100)
    expect(partial).toBe(exact)
  })

  it('uses fallback pricing for unknown models', () => {
    const cost = calculateCostMicro('other', 'unknown-model-xyz', 1000, 1000)
    // fallback: input 1 µ$/token, output 3 µ$/token → 1000 + 3000 = 4000
    expect(cost).toBe(4000)
  })

  it('returns 0 for zero tokens', () => {
    expect(calculateCostMicro('openai', 'gpt-4o', 0, 0)).toBe(0)
  })
})
