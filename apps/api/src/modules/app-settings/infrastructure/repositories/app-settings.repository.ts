import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type { AppSettingsRepository } from '@/modules/app-settings/application/ports/app-settings.repository.port'
import type { Prisma } from '@workspace/database'

@Injectable()
export class AppSettingsRepositoryImpl implements AppSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(key: string): Promise<unknown> {
    const row = await this.prisma.appSetting.findUnique({ where: { key } })
    return row?.value
  }

  async upsert(key: string, value: unknown): Promise<void> {
    const json = value as Prisma.InputJsonValue
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value: json },
      update: { value: json },
    })
  }
}
