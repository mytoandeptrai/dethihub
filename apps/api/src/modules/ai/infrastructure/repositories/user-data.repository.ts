import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type { UserDataRepositoryPort } from '@/modules/ai/application/ports/user-data.repository.port'

@Injectable()
export class UserDataRepositoryImpl implements UserDataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async purge(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.aiUsage.deleteMany({ where: { userId } }),
      this.prisma.aiQuotaOverride.deleteMany({ where: { userId } }),
      this.prisma.aiCredit.deleteMany({ where: { userId } }),
      this.prisma.aiCreditEvent.deleteMany({ where: { userId } }),
      this.prisma.aiRefund.deleteMany({ where: { userId } }),
      this.prisma.aiCall.updateMany({ where: { userId }, data: { userId: null } }),
      this.prisma.aiFeedback.updateMany({ where: { userId }, data: { userId: null } }),
    ])
  }
}
