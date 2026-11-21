import { Injectable } from '@nestjs/common'

import type {
  CreditGrantPort,
  TxContext,
} from '@/shared-kernel/application/ports/credit-grant.port'
import type { Prisma } from '@workspace/database'

@Injectable()
export class CreditGrantAdapter implements CreditGrantPort {
  async grant(tx: TxContext, userId: string, tokens: number, kind: string): Promise<void> {
    // The caller opened a Prisma transaction and handed it over as an opaque value
    const client = tx as unknown as Prisma.TransactionClient
    await client.aiCredit.upsert({
      where: { userId },
      create: { userId, balance: tokens },
      update: { balance: { increment: tokens } },
    })
    await client.aiCreditEvent.create({ data: { userId, kind, tokens } })
  }
}
