import { createHmac, timingSafeEqual } from 'node:crypto'

const hmac = (key: string, data: string): string =>
  createHmac('sha256', key).update(data).digest('hex')

export const sameSignature = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export interface CreateLinkFields {
  amount: number
  cancelUrl: string
  description: string
  orderCode: number
  returnUrl: string
}

/** Signature sent when creating a link: five fields in alphabetical order */
export const signCreate = (key: string, fields: CreateLinkFields): string =>
  hmac(
    key,
    `amount=${fields.amount}&cancelUrl=${fields.cancelUrl}&description=${fields.description}&orderCode=${fields.orderCode}&returnUrl=${fields.returnUrl}`,
  )

const sortKeys = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.keys(value)
      .toSorted()
      .map((key) => [key, value[key]]),
  )

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || value === 'null' || value === 'undefined'

const stringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((item) =>
        item && typeof item === 'object' ? sortKeys(item as Record<string, unknown>) : item,
      ),
    )
  }
  return isBlank(value) ? '' : String(value)
}

/** Signature of a webhook `data` object: keys sorted, null becomes empty, arrays become JSON */
export function signData(key: string, data: Record<string, unknown>): string {
  const text = Object.keys(data)
    .toSorted()
    .filter((name) => data[name] !== undefined)
    .map((name) => `${name}=${stringify(data[name])}`)
    .join('&')
  return hmac(key, text)
}
