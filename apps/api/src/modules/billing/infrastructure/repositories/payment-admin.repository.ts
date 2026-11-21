import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'
import { STALE_PENDING_MS } from '@/modules/billing/domain/policies/revenue.policy'

import type {
  AdminPaymentRow,
  MonthlyRevenue,
  PaymentAdminRepositoryPort,
  PaymentFilter,
  RevenueSlot,
} from '@/modules/billing/application/ports/payment-admin.repository.port'
import type { RevenueRange } from '@/modules/billing/domain/policies/revenue.policy'
import type { Prisma } from '@workspace/database'

const CLOSED = ['cancelled', 'expired', 'failed']

function filterWhere(filter: PaymentFilter): Prisma.PaymentOrderWhereInput {
  switch (filter) {
    case 'pending': {
      return { status: 'pending' }
    }
    case 'paid': {
      return { status: 'paid' }
    }
    case 'closed': {
      return { status: { in: CLOSED } }
    }
    case 'attention': {
      return {
        status: { not: 'paid' },
        OR: [
          { reference: { startsWith: 'THIEU' } },
          { status: 'pending', createdAt: { lt: new Date(Date.now() - STALE_PENDING_MS) } },
        ],
      }
    }
    default: {
      return {}
    }
  }
}

@Injectable()
export class PaymentAdminRepositoryImpl implements PaymentAdminRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filter: PaymentFilter,
    orderCode: number | null,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminPaymentRow[]; total: number }> {
    const where: Prisma.PaymentOrderWhereInput = {
      ...filterWhere(filter),
      ...(orderCode !== null && { orderCode }),
    }
    const [orders, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.paymentOrder.count({ where }),
    ])
    return {
      total,
      rows: orders.map((order) => ({
        orderCode: Number(order.orderCode),
        userId: order.userId,
        vnd: order.vnd,
        points: order.points,
        bonusPoints: order.bonusPoints,
        status: order.status,
        reference: order.reference,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      })),
    }
  }

  async revenue(ranges: RevenueRange[]): Promise<RevenueSlot[]> {
    return Promise.all(
      ranges.map(async ({ from, to }) => {
        const total = await this.prisma.paymentOrder.aggregate({
          where: { status: 'paid', paidAt: { gte: from, lt: to } },
          _sum: { vnd: true },
          _count: { _all: true },
        })
        return { vnd: total._sum.vnd ?? 0, count: total._count._all }
      }),
    )
  }

  async monthlyRevenue(months: number): Promise<MonthlyRevenue[]> {
    const rows = await this.prisma.$queryRaw<{ month: string; vnd: bigint; n: bigint }[]>`
      SELECT to_char(date_trunc('month', paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM') AS month,
        coalesce(sum(vnd), 0)::bigint AS vnd, count(*)::bigint AS n
      FROM payment_orders
      WHERE status = 'paid'
        AND paid_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
          - make_interval(months => ${months}::int - 1)) AT TIME ZONE 'Asia/Ho_Chi_Minh'
      GROUP BY 1 ORDER BY 1 DESC`
    return rows.map((row) => ({ month: row.month, vnd: Number(row.vnd), count: Number(row.n) }))
  }
}
