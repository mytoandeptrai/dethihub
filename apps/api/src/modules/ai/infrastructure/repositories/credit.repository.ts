import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'
import { mailboxKey } from '@/modules/ai/domain/mailbox-key'

import type {
  CreditEvent,
  CreditRepositoryPort,
} from '@/modules/ai/application/ports/credit.repository.port'

const MAX_REFUNDS_PER_DAY = 20
const DAY_MS = 24 * 60 * 60 * 1000

@Injectable()
export class CreditRepositoryImpl implements CreditRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findBalance(userId: string): Promise<number | null> {
    const row = await this.prisma.aiCredit.findUnique({ where: { userId } })
    return row ? Number(row.balance) : null
  }

  async claimWelcome(userId: string, tokens: number): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.aiCredit.findUnique({ where: { userId } })
      if (existing) return Number(existing.balance)

      let grant = Math.max(tokens, 0)
      if (grant > 0) {
        const [account] = await tx.$queryRaw<
          { email: string | null }[]
        >`SELECT email FROM auth.users WHERE id = ${userId}::uuid`
        const mailbox = mailboxKey(account?.email)
        if (mailbox) {
          await tx.$executeRaw`
            INSERT INTO ai_welcome_claims (mailbox, user_id) VALUES (${mailbox}, ${userId}::uuid)
            ON CONFLICT (mailbox) DO NOTHING`
          const claim = await tx.aiWelcomeClaim.findUnique({ where: { mailbox } })
          // Another account already took this mailbox's gift
          if (claim?.userId !== userId) grant = 0
        }
      }

      const inserted = await tx.$executeRaw`
        INSERT INTO ai_credits (user_id, balance) VALUES (${userId}::uuid, ${grant}::bigint)
        ON CONFLICT (user_id) DO NOTHING`
      if (inserted > 0 && grant > 0) {
        // Usage before the gift must not eat into it
        await tx.aiUsage.updateMany({ where: { userId }, data: { tokens: 0 } })
        await tx.aiCreditEvent.create({ data: { userId, kind: 'welcome', tokens: grant } })
      }
      const row = await tx.aiCredit.findUnique({ where: { userId } })
      return Number(row?.balance ?? 0)
    })
  }

  async consume(
    userId: string,
    month: string,
    base: number,
  ): Promise<{ used: number; balance: number }> {
    return this.prisma.$transaction(async (tx) => {
      const [usage] = await tx.$queryRaw<
        { tokens: bigint }[]
      >`SELECT tokens FROM ai_usage WHERE user_id = ${userId}::uuid AND month = ${month} FOR UPDATE`
      const [credit] = await tx.$queryRaw<
        { balance: bigint }[]
      >`SELECT balance FROM ai_credits WHERE user_id = ${userId}::uuid FOR UPDATE`
      const used = Number(usage?.tokens ?? 0)
      const balance = Number(credit?.balance ?? 0)
      const pay = Math.min(Math.max(used - base, 0), balance)
      if (pay > 0) {
        await tx.aiUsage.update({
          where: { userId_month: { userId, month } },
          data: { tokens: { decrement: pay } },
        })
        await tx.aiCredit.update({ where: { userId }, data: { balance: { decrement: pay } } })
      }
      return { used: used - pay, balance: balance - pay }
    })
  }

  async refund(
    userId: string,
    month: string,
    receipt: string,
    tokens: number,
  ): Promise<number | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ai_refund:${userId}`}))`
      const recent = await tx.aiRefund.count({
        where: { userId, createdAt: { gt: new Date(Date.now() - DAY_MS) } },
      })
      if (recent >= MAX_REFUNDS_PER_DAY) return null

      const refundable = Math.max(tokens, 0)
      const inserted = await tx.$executeRaw`
        INSERT INTO ai_refunds (receipt, user_id, tokens) VALUES (${receipt}, ${userId}::uuid, ${refundable}::bigint)
        ON CONFLICT (receipt) DO NOTHING`
      if (inserted === 0) return null

      const [usage] = await tx.$queryRaw<
        { tokens: bigint }[]
      >`SELECT tokens FROM ai_usage WHERE user_id = ${userId}::uuid AND month = ${month} FOR UPDATE`
      const takenBack = Math.min(Number(usage?.tokens ?? 0), refundable)
      if (takenBack > 0) {
        await tx.aiUsage.update({
          where: { userId_month: { userId, month } },
          data: { tokens: { decrement: takenBack } },
        })
      }

      const toBalance = refundable - takenBack
      const credit = await tx.aiCredit.upsert({
        where: { userId },
        create: { userId, balance: toBalance },
        update: { balance: { increment: toBalance } },
      })
      return Number(credit.balance)
    })
  }

  async grant(userId: string, tokens: number, kind: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.aiCredit.upsert({
        where: { userId },
        create: { userId, balance: tokens },
        update: { balance: { increment: tokens } },
      })
      await tx.aiCreditEvent.create({ data: { userId, kind, tokens } })
      return Number(credit.balance)
    })
  }

  async sumGranted(userId: string): Promise<number> {
    const result = await this.prisma.aiCreditEvent.aggregate({
      where: { userId },
      _sum: { tokens: true },
    })
    return Number(result._sum.tokens ?? 0)
  }

  async listEvents(userId: string, limit: number): Promise<CreditEvent[]> {
    const rows = await this.prisma.aiCreditEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map((row) => ({
      id: Number(row.id),
      kind: row.kind,
      tokens: Number(row.tokens),
      createdAt: row.createdAt,
    }))
  }
}
