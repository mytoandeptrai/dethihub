import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'
import { PaymentOrder } from '@/modules/billing/domain/aggregates/payment-order.aggregate'
import { PaymentOrderStatus } from '@/modules/billing/domain/enums/order-status.enum'
import { decideSettlement } from '@/modules/billing/domain/policies/settlement.policy'
import { TOKENS_PER_POINT } from '@/shared-kernel/application/ports/ai-meter.port'
import { CREDIT_GRANT } from '@/shared-kernel/application/ports/credit-grant.port'

import type {
  NewPaymentOrder,
  PaymentOrderRepositoryPort,
  SettleOutcome,
} from '@/modules/billing/application/ports/payment-order.repository.port'
import type { PaymentOrderStatus as Status } from '@/modules/billing/domain/enums/order-status.enum'
import type {
  CreditGrantPort,
  TxContext,
} from '@/shared-kernel/application/ports/credit-grant.port'
import type { PaymentOrder as PaymentOrderRow } from '@workspace/database'

const toDomain = (row: PaymentOrderRow): PaymentOrder =>
  PaymentOrder.reconstitute({
    orderCode: Number(row.orderCode),
    userId: row.userId,
    vnd: row.vnd,
    points: row.points,
    packVnd: row.packVnd,
    bonusPoints: row.bonusPoints,
    status: row.status as Status,
    paymentLinkId: row.paymentLinkId,
    checkoutUrl: row.checkoutUrl,
    reference: row.reference,
    createdAt: row.createdAt,
    paidAt: row.paidAt,
  })

const MAX_REFERENCE = 120

@Injectable()
export class PaymentOrderRepositoryImpl implements PaymentOrderRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CREDIT_GRANT) private readonly credits: CreditGrantPort,
  ) {}

  async create(draft: NewPaymentOrder): Promise<PaymentOrder> {
    return toDomain(await this.prisma.paymentOrder.create({ data: draft }))
  }

  async findByCode(orderCode: number): Promise<PaymentOrder | null> {
    const row = await this.prisma.paymentOrder.findUnique({ where: { orderCode } })
    return row ? toDomain(row) : null
  }

  async findOwned(orderCode: number, userId: string): Promise<PaymentOrder | null> {
    const row = await this.prisma.paymentOrder.findFirst({ where: { orderCode, userId } })
    return row ? toDomain(row) : null
  }

  async findPending(userId: string, limit: number): Promise<PaymentOrder[]> {
    const rows = await this.prisma.paymentOrder.findMany({
      where: { userId, status: PaymentOrderStatus.PENDING },
      take: limit,
    })
    return rows.map((row) => toDomain(row))
  }

  async save(order: PaymentOrder): Promise<boolean> {
    const { count } = await this.prisma.paymentOrder.updateMany({
      where: { orderCode: order.orderCode, status: PaymentOrderStatus.PENDING },
      data: {
        status: order.status,
        checkoutUrl: order.checkoutUrl,
        paymentLinkId: order.paymentLinkId,
      },
    })
    return count > 0
  }

  async bonusedPacks(userId: string): Promise<number[]> {
    const rows = await this.prisma.paymentOrder.findMany({
      where: { userId, status: PaymentOrderStatus.PAID, bonusPoints: { gt: 0 } },
      select: { packVnd: true },
      distinct: ['packVnd'],
    })
    return rows.flatMap((row) => (row.packVnd === null ? [] : [row.packVnd]))
  }

  async convertToBase(orderCode: number, paidVnd: number, points: number): Promise<boolean> {
    const { count } = await this.prisma.paymentOrder.updateMany({
      where: { orderCode, status: { not: PaymentOrderStatus.PAID } },
      data: { vnd: paidVnd, points, bonusPoints: 0, packVnd: null },
    })
    return count > 0
  }

  async settle(orderCode: number, paid: number | null, reference: string): Promise<SettleOutcome> {
    return this.prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<{ user_id: string }[]>`
        SELECT user_id FROM payment_orders WHERE order_code = ${orderCode}::bigint FOR UPDATE`
      if (!locked) return 'missing'
      const row = await tx.paymentOrder.findUniqueOrThrow({ where: { orderCode } })
      if (row.status === PaymentOrderStatus.PAID) return 'already'

      // Serializes orders of one user so a pack bonus is granted once even for parallel orders
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment:${row.userId}`}))`
      const bonusEarned =
        row.bonusPoints > 0 && row.packVnd !== null
          ? (await tx.paymentOrder.count({
              where: {
                userId: row.userId,
                packVnd: row.packVnd,
                status: PaymentOrderStatus.PAID,
                bonusPoints: { gt: 0 },
              },
            })) > 0
          : false

      const decision = decideSettlement(row, paid, bonusEarned, reference)
      if (decision.kind === 'unknown_amount') return 'unknown_amount'
      if (decision.kind === 'underpaid') {
        await tx.paymentOrder.update({
          where: { orderCode },
          data: { reference: decision.reference.slice(0, MAX_REFERENCE) },
        })
        return 'underpaid'
      }

      await tx.paymentOrder.update({
        where: { orderCode },
        data: {
          status: PaymentOrderStatus.PAID,
          paidAt: new Date(),
          reference: reference.slice(0, MAX_REFERENCE),
          points: decision.points,
          bonusPoints: decision.bonusPoints,
        },
      })
      // The transaction is handed to the credit context as an opaque value
      await this.credits.grant(
        tx as unknown as TxContext,
        row.userId,
        decision.points * TOKENS_PER_POINT,
        'topup',
      )
      return 'ok'
    })
  }
}
