import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type { PresenceRepositoryPort } from '@/modules/access-control/application/ports/presence.repository.port'

@Injectable()
export class PresenceRepositoryImpl implements PresenceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async touch(userId: string): Promise<void> {
    await this.prisma.presence.upsert({
      where: { userId },
      create: { userId },
      update: { lastSeen: new Date() },
    })
  }
}
