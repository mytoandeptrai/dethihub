import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PayosRequestError } from '@/modules/billing/application/ports/payos-gateway.port'
import {
  sameSignature,
  signCreate,
  signData,
} from '@/modules/billing/infrastructure/payos/signature'

import type { Env } from '@/app/config/env.schema'
import type {
  CreateLinkInput,
  PayosGatewayPort,
  PayosLink,
  PayosPaymentStatus,
  PayosWebhook,
} from '@/modules/billing/application/ports/payos-gateway.port'

const TIMEOUT_MS = 15_000

interface PayosReply<T> {
  code: string
  data: T | null
}

interface LinkData {
  checkoutUrl?: string
  paymentLinkId?: string
  qrCode?: string
  bin?: string
  accountNumber?: string
  accountName?: string
  description?: string
}

interface StatusData {
  status?: string
  amountPaid?: unknown
  transactions?: { reference?: string }[]
}

@Injectable()
export class PayosGatewayAdapter implements PayosGatewayPort {
  constructor(private readonly config: ConfigService<Env, true>) {}

  isConfigured(): boolean {
    return Boolean(this.#keys().clientId && this.#keys().apiKey && this.#keys().checksum)
  }

  async createLink(input: CreateLinkInput): Promise<PayosLink> {
    const signed = {
      orderCode: input.orderCode,
      amount: input.amount,
      description: input.description,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    }
    let reply: PayosReply<LinkData>
    try {
      reply = await this.#request<LinkData>('/v2/payment-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...signed,
          expiredAt: input.expiresAt,
          items: [{ name: input.itemName, quantity: 1, price: input.amount }],
          signature: signCreate(this.#keys().checksum, signed),
        }),
      })
    } catch {
      throw new PayosRequestError('PayOS unreachable')
    }
    const { data } = reply
    if (reply.code !== '00' || !data?.checkoutUrl) {
      throw new PayosRequestError(`PayOS refused the payment link (${reply.code})`)
    }
    return {
      checkoutUrl: data.checkoutUrl,
      paymentLinkId: data.paymentLinkId ?? null,
      qrCode: data.qrCode ?? '',
      bin: data.bin ?? '',
      accountNumber: data.accountNumber ?? '',
      accountName: data.accountName ?? '',
      // PayOS may add its own prefix; the payer must transfer exactly this text
      description: data.description || input.description,
    }
  }

  async getStatus(orderCode: number): Promise<PayosPaymentStatus | null> {
    try {
      const { code, data } = await this.#request<StatusData>(`/v2/payment-requests/${orderCode}`)
      if (code !== '00' || !data?.status) return null
      return {
        status: data.status,
        amountPaid: data.amountPaid,
        reference: data.transactions?.[0]?.reference ?? null,
      }
    } catch {
      return null
    }
  }

  async cancel(orderCode: number, reason: string): Promise<void> {
    try {
      await this.#request(`/v2/payment-requests/${orderCode}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancellationReason: reason }),
      })
    } catch {
      // the next status check settles whatever really happened
    }
  }

  parseWebhook(body: unknown): PayosWebhook | null {
    const payload = (body ?? {}) as { code?: unknown; data?: unknown; signature?: unknown }
    const { data, signature } = payload
    if (!data || typeof data !== 'object' || typeof signature !== 'string' || !signature) {
      return null
    }
    const fields = data as Record<string, unknown>
    if (!sameSignature(signData(this.#keys().checksum, fields), signature)) return null
    const orderCode = Number(fields.orderCode)
    const success =
      payload.code === '00' &&
      fields.code === '00' &&
      Number.isSafeInteger(orderCode) &&
      orderCode > 0
    return { orderCode, success }
  }

  #keys() {
    return {
      clientId: this.config.get('PAYOS_CLIENT_ID', { infer: true }) ?? '',
      apiKey: this.config.get('PAYOS_API_KEY', { infer: true }) ?? '',
      checksum: this.config.get('PAYOS_CHECKSUM_KEY', { infer: true }) ?? '',
    }
  }

  async #request<T>(path: string, init: { method?: string; body?: string } = {}) {
    const { clientId, apiKey } = this.#keys()
    const base = this.config.get('PAYOS_BASE_URL', { infer: true }).replace(/\/+$/, '')
    const response = await fetch(`${base}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: init.body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const json = (await response.json().catch(() => null)) as {
      code?: string
      data?: T
    } | null
    return {
      code: String(json?.code ?? response.status),
      data: json?.data ?? null,
    } as PayosReply<T>
  }
}
