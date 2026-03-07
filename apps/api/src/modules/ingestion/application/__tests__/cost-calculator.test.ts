import { describe, it, expect, beforeAll } from 'vitest'
import { calculateCostMicro, setPricingLoader } from '../cost-calculator.js'

// Inject a static price table — no DB connection needed.
beforeAll(() => {
  setPricingLoader(() =>
    Promise.resolve([
      { model: 'gpt-4o',            inputMicroPerToken: 2.5,   outputMicroPerToken: 10 },
      { model: 'gpt-5.2',           inputMicroPerToken: 1.75,  outputMicroPerToken: 14 },
      { model: 'claude-opus-4-6',   inputMicroPerToken: 5,     outputMicroPerToken: 25 },
      { model: 'claude-sonnet-4-6', inputMicroPerToken: 3,     outputMicroPerToken: 15 },
      { model: 'grok-4',            inputMicroPerToken: 3,     outputMicroPerToken: 15 },
      { model: 'grok-4.1-fast',     inputMicroPerToken: 0.2,   outputMicroPerToken: 0.5 },
      { model: 'mistral-large-3',   inputMicroPerToken: 0.5,   outputMicroPerToken: 1.5 },
    ]),
  )
})

describe('calculateCostMicro', () => {
  it('computes gpt-4o cost correctly', async () => {
    // input $2.5/M, output $10/M → 1000*2.5 + 500*10 = 7500 µ$
    expect(await calculateCostMicro('openai', 'gpt-4o', 1000, 500)).toBe(7500)
  })

  it('computes gpt-5.2 cost correctly', async () => {
    // input $1.75/M, output $14/M → 1000*1.75 + 500*14 = 8750 µ$
    expect(await calculateCostMicro('openai', 'gpt-5.2', 1000, 500)).toBe(8750)
  })

  it('computes claude-opus-4-6 updated pricing', async () => {
    // input $5/M, output $25/M → 1000*5 + 500*25 = 17500 µ$
    expect(await calculateCostMicro('anthropic', 'claude-opus-4-6', 1000, 500)).toBe(17500)
  })

  it('computes claude-sonnet-4-6 cost correctly', async () => {
    // input $3/M, output $15/M → 2000*3 + 300*15 = 10500 µ$
    expect(await calculateCostMicro('anthropic', 'claude-sonnet-4-6', 2000, 300)).toBe(10500)
  })

  it('computes grok-4 cost correctly', async () => {
    // input $3/M, output $15/M → 1000*3 + 500*15 = 10500 µ$
    expect(await calculateCostMicro('xai', 'grok-4', 1000, 500)).toBe(10500)
  })

  it('computes grok-4.1-fast cost correctly', async () => {
    // input $0.2/M, output $0.5/M → 1000*0.2 + 500*0.5 = 450 µ$
    expect(await calculateCostMicro('xai', 'grok-4.1-fast', 1000, 500)).toBe(450)
  })

  it('computes mistral-large-3 pricing', async () => {
    // input $0.5/M, output $1.5/M → 1000*0.5 + 1000*1.5 = 2000 µ$
    expect(await calculateCostMicro('mistral', 'mistral-large-3', 1000, 1000)).toBe(2000)
  })

  it('handles partial model name match', async () => {
    // "gpt-4o-2024-11-20" should match "gpt-4o" pricing
    const exact   = await calculateCostMicro('openai', 'gpt-4o',            100, 100)
    const partial = await calculateCostMicro('openai', 'gpt-4o-2024-11-20', 100, 100)
    expect(partial).toBe(exact)
  })

  it('uses fallback pricing for unknown models', async () => {
    // fallback: input 1 µ$/token, output 3 µ$/token → 1000 + 3000 = 4000 µ$
    expect(await calculateCostMicro('other', 'unknown-model-xyz', 1000, 1000)).toBe(4000)
  })

  it('returns 0 for zero tokens', async () => {
    expect(await calculateCostMicro('openai', 'gpt-4o', 0, 0)).toBe(0)
  })
})
