import { describe, it, expect } from 'vitest'

/**
 * Unit tests for analytics pure-logic helpers.
 * DB queries are integration-tested separately (require a running PG).
 */

describe('gross margin calculation', () => {
  function grossMargin(costMicro: number, revenueMicro: number): number | null {
    if (revenueMicro === 0) return null
    return (revenueMicro - costMicro) / revenueMicro
  }

  it('computes positive margin correctly', () => {
    // revenue $10, cost $7 → margin 30%
    const m = grossMargin(7_000_000, 10_000_000)
    expect(m).toBeCloseTo(0.3, 5)
  })

  it('computes negative margin (cost > revenue)', () => {
    const m = grossMargin(12_000_000, 10_000_000)
    expect(m).toBeCloseTo(-0.2, 5)
  })

  it('returns null when revenue is zero', () => {
    expect(grossMargin(5_000_000, 0)).toBeNull()
  })
})

describe('period-over-period change', () => {
  function costChangePct(current: number, previous: number): number | null {
    if (previous === 0) return null
    return (current - previous) / previous
  }

  it('computes +20% increase', () => {
    expect(costChangePct(120, 100)).toBeCloseTo(0.2, 5)
  })

  it('computes -50% decrease', () => {
    expect(costChangePct(50, 100)).toBeCloseTo(-0.5, 5)
  })

  it('returns null when previous period is zero', () => {
    expect(costChangePct(100, 0)).toBeNull()
  })
})

describe('date range helpers', () => {
  it('prior period mirrors the current period length', () => {
    // Jan 1 → Feb 1 = 31 days, so previous period = Dec 1 → Jan 1
    const from = new Date('2026-01-01T00:00:00Z')
    const to   = new Date('2026-02-01T00:00:00Z')
    const rangeMs = to.getTime() - from.getTime()

    const prevFrom = new Date(from.getTime() - rangeMs)
    const prevTo   = from

    expect(prevFrom.toISOString().slice(0, 10)).toBe('2025-12-01')
    expect(prevTo.toISOString().slice(0, 10)).toBe('2026-01-01')
    // Same duration
    expect(prevTo.getTime() - prevFrom.getTime()).toBe(rangeMs)
  })
})
