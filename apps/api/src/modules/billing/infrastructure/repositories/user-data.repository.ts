import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type { UserDataRepositoryPort } from '@/modules/billing/application/ports/user-data.repository.port'

@Injectable()
export class UserDataRepositoryImpl implements UserDataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async purge(userId: string): Promise<void> {
    await this.prisma.paymentOrder.deleteMany({ where: { userId } })
  }
}
