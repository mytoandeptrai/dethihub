import { basePoints, packPoints } from '@workspace/core'

import type { PricingConfig } from '@workspace/core'

export interface OrderQuote {
  points: number
  bonusPoints: number
  packVnd: number | null
}

export const isValidTopUpAmount = (config: PricingConfig, vnd: number): boolean =>
  Number.isInteger(vnd) && vnd >= config.minVnd && vnd <= config.maxVnd && vnd % 1000 === 0

/** Points always come from the stored price list; the first purchase of a pack earns its bonus */
export function quoteOrder(config: PricingConfig, vnd: number, bonusedPacks: number[]): OrderQuote {
  const pack = config.packs.find((candidate) => candidate.vnd === vnd)
  const base = basePoints(config, vnd)
  if (!pack) return { points: base, bonusPoints: 0, packVnd: null }
  const points = packPoints(config, pack, !bonusedPacks.includes(pack.vnd))
  return { points, bonusPoints: points - base, packVnd: pack.vnd }
}
