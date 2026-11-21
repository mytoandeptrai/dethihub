import { describe, expect, it } from 'vitest'

import { DEFAULT_PRICING, basePoints, clampVnd, packPoints, usesFor, vndFor } from './pricing.js'

describe('pricing', () => {
  it('converts VND to base points', () => {
    expect(basePoints(DEFAULT_PRICING, 10_000)).toBe(250)
    expect(basePoints(DEFAULT_PRICING, 0)).toBe(0)
    expect(basePoints(DEFAULT_PRICING, Number.NaN)).toBe(0)
  })

  it('adds the pack bonus only on the first purchase', () => {
    const pack = { vnd: 10_000, bonus: 0.1 }
    expect(packPoints(DEFAULT_PRICING, pack, true)).toBe(275)
    expect(packPoints(DEFAULT_PRICING, pack, false)).toBe(250)
  })

  it('rounds up to 1,000 VND and clamps to the configured range', () => {
    expect(clampVnd(DEFAULT_PRICING, 2500)).toBe(3000)
    expect(clampVnd(DEFAULT_PRICING, 1)).toBe(2000)
    expect(clampVnd(DEFAULT_PRICING, 1_000_000)).toBe(100_000)
    expect(clampVnd(DEFAULT_PRICING, -5)).toBe(2000)
  })

  it('finds the smallest amount that buys the requested points', () => {
    const vnd = vndFor(DEFAULT_PRICING, 100)
    expect(basePoints(DEFAULT_PRICING, vnd)).toBeGreaterThanOrEqual(100)
    expect(basePoints(DEFAULT_PRICING, vnd - 1000)).toBeLessThan(100)
  })

  it('estimates usage counts per task', () => {
    const counts = Object.fromEntries(usesFor(54).map((u) => [u.id, u.count]))
    expect(counts['exam']).toBe(2)
    expect(counts['edit']).toBe(10)
    expect(usesFor(-1).every((u) => u.count === 0)).toBe(true)
  })
})
