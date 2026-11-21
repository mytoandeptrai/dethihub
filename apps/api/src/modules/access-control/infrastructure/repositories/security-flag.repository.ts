import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  SecurityFlagRepositoryPort,
  StrikeResult,
} from '@/modules/access-control/application/ports/security-flag.repository.port'

const TEMPORARY_LOCK_MS = 3 * 24 * 60 * 60 * 1000
const PERMANENT_AFTER_STRIKES = 2
// Postgres 'infinity' cannot be represented by Prisma, so a permanent lock is a far-future date
const PERMANENT_LOCK = new Date('9999-12-31T00:00:00.000Z')
const MAX_TEXT_LENGTH = 60

@Injectable()
export class SecurityFlagRepositoryImpl implements SecurityFlagRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async recordStrike(userId: string, action: string, ip: string): Promise<StrikeResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO security_flags (user_id) VALUES (${userId}::uuid) ON CONFLICT (user_id) DO NOTHING`
      const [row] = await tx.$queryRaw<{ strikes: number; locked_until: Date | null }[]>`
        SELECT strikes, locked_until FROM security_flags WHERE user_id = ${userId}::uuid FOR UPDATE`
      if (!row) throw new Error('security flag row missing after insert')

      // A burst of requests during an active lock counts as a single strike
      if (row.locked_until && row.locked_until.getTime() > Date.now()) {
        return { strikes: row.strikes, isNew: false }
      }

      const strikes = row.strikes + 1
      await tx.securityFlag.update({
        where: { userId },
        data: {
          strikes,
          lockedUntil:
            strikes >= PERMANENT_AFTER_STRIKES
              ? PERMANENT_LOCK
              : new Date(Date.now() + TEMPORARY_LOCK_MS),
          lastAt: new Date(),
          lastAction: action.slice(0, MAX_TEXT_LENGTH),
          lastIp: ip.slice(0, MAX_TEXT_LENGTH),
        },
      })
      return { strikes, isNew: true }
    })
  }

  async revertStrike(userId: string, strikes: number): Promise<void> {
    await this.prisma.securityFlag.update({
      where: { userId },
      data: { strikes, lockedUntil: null },
    })
  }
}
