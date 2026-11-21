export type SettlementDecision =
  | { kind: 'unknown_amount' }
  | { kind: 'underpaid'; reference: string }
  | { kind: 'credit'; points: number; bonusPoints: number }

export interface SettlementOrder {
  vnd: number
  points: number
  bonusPoints: number
}

/** An amount from the gateway counts only when it is a positive whole number */
export function parseAmount(value: unknown): number | null {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null
}

/**
 * Unknown amount keeps the order untouched; a short payment is flagged for review;
 * enough money credits the points, minus the pack bonus when that pack already earned it.
 */
export function decideSettlement(
  order: SettlementOrder,
  paid: number | null,
  packBonusAlreadyEarned: boolean,
  reference: string,
): SettlementDecision {
  if (paid === null) return { kind: 'unknown_amount' }
  if (paid < order.vnd) {
    return { kind: 'underpaid', reference: `THIEU ${paid}d/${order.vnd}d ${reference}` }
  }
  if (order.bonusPoints > 0 && packBonusAlreadyEarned) {
    return { kind: 'credit', points: order.points - order.bonusPoints, bonusPoints: 0 }
  }
  return { kind: 'credit', points: order.points, bonusPoints: order.bonusPoints }
}
