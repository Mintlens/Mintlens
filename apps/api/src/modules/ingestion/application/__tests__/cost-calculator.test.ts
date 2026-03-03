import { describe, it, expect } from 'vitest'
import { calculateCostMicro } from '../cost-calculator.js'

describe('calculateCostMicro', () => {
  it('computes gpt-4o cost correctly', () => {
    // gpt-4o: input $2.5/M, output $10/M
    // 1000 input → 2500 µ$, 500 output → 5000 µ$
    expect(calculateCostMicro('openai', 'gpt-4o', 1000, 500)).toBe(7500)
  })

  it('computes gpt-5.2 cost correctly', () => {
    // input $1.75/M, output $14/M
    // 1000 * 1.75 = 1750, 500 * 14 = 7000 → 8750
    expect(calculateCostMicro('openai', 'gpt-5.2', 1000, 500)).toBe(8750)
  })

  it('computes claude-opus-4-6 updated pricing', () => {
    // input $5/M, output $25/M (was $15/$75)
    // 1000 * 5 = 5000, 500 * 25 = 12500 → 17500
    expect(calculateCostMicro('anthropic', 'claude-opus-4-6', 1000, 500)).toBe(17500)
  })

  it('computes claude-sonnet-4-6 cost correctly', () => {
    // input $3/M, output $15/M
    // 2000 * 3 = 6000 + 300 * 15 = 4500 → 10500
    expect(calculateCostMicro('anthropic', 'claude-sonnet-4-6', 2000, 300)).toBe(10500)
  })

  it('computes grok-4 cost correctly', () => {
    // input $3/M, output $15/M
    expect(calculateCostMicro('xai', 'grok-4', 1000, 500)).toBe(10500)
  })

  it('computes grok-4.1-fast cost correctly', () => {
    // input $0.2/M, output $0.5/M
    // 1000 * 0.2 = 200, 500 * 0.5 = 250 → 450
    expect(calculateCostMicro('xai', 'grok-4.1-fast', 1000, 500)).toBe(450)
  })

  it('computes mistral-large-3 updated pricing', () => {
    // input $0.5/M, output $1.5/M (was $2/$6)
    expect(calculateCostMicro('mistral', 'mistral-large-3', 1000, 1000)).toBe(2000)
  })

  it('handles partial model name match', () => {
    // "gpt-4o-2024-11-20" should match "gpt-4o" pricing
    const exact   = calculateCostMicro('openai', 'gpt-4o',            100, 100)
    const partial = calculateCostMicro('openai', 'gpt-4o-2024-11-20', 100, 100)
    expect(partial).toBe(exact)
  })

  it('uses fallback pricing for unknown models', () => {
    // fallback: input 1 µ$/token, output 3 µ$/token → 1000 + 3000 = 4000
    expect(calculateCostMicro('other', 'unknown-model-xyz', 1000, 1000)).toBe(4000)
  })

  it('returns 0 for zero tokens', () => {
    expect(calculateCostMicro('openai', 'gpt-4o', 0, 0)).toBe(0)
  })
})
