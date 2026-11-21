import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

import { monthKey } from '@/modules/ai/domain/quota'

const RECEIPT_TTL_MS = 15 * 60 * 1000

/** h is the hash of the request that produced the receipt: only that exact request can be refunded */
export interface Receipt {
  u: string
  m: string
  t: number
  e: number
  n: string
  h?: string
}

const sign = (secret: string, data: string): string =>
  createHmac('sha256', secret).update(data).digest('base64url')

/** Hashes everything that decides the price of a call, so a receipt is tied to the exact retry */
export function requestHash(
  messages: unknown,
  maxTokens: number,
  extra: { model?: unknown; effort?: unknown; temperature?: unknown } = {},
): string {
  return createHash('sha256')
    .update(JSON.stringify(messages ?? null))
    .update(
      `|${maxTokens}|${JSON.stringify([extra.model ?? null, extra.effort ?? null, extra.temperature ?? null])}`,
    )
    .digest('base64url')
    .slice(0, 22)
}

export function issueReceipt(
  secret: string,
  userId: string,
  tokens: number,
  hash: string,
): string | undefined {
  if (!secret || tokens <= 0) return undefined
  const receipt: Receipt = {
    u: userId,
    m: monthKey(),
    t: Math.round(tokens),
    e: Date.now() + RECEIPT_TTL_MS,
    n: randomUUID(),
    h: hash,
  }
  const data = Buffer.from(JSON.stringify(receipt)).toString('base64url')
  return `${data}.${sign(secret, data)}`
}

export function readReceipt(secret: string, raw: string, userId: string): Receipt | null {
  const [data, mac] = raw.split('.')
  if (!data || !mac || !secret) return null
  const expected = Buffer.from(sign(secret, data))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const receipt = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as Receipt
    return receipt.u === userId && receipt.e > Date.now() && receipt.t > 0 ? receipt : null
  } catch {
    return null
  }
}

/** A receipt without a request hash (or with another one) refunds nothing */
export function checkReceipt(
  secret: string,
  raw: string,
  userId: string,
  hash: string,
): Receipt | null {
  const receipt = readReceipt(secret, raw, userId)
  return receipt?.h && receipt.h === hash ? receipt : null
}
