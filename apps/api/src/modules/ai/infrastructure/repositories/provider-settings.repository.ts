import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  ProviderSettingRow,
  ProviderSettingsRepositoryPort,
} from '@/modules/ai/application/ports/provider-settings.repository.port'

const COLUMNS = { provider: true, model: true, baseUrl: true, apiKeyEnc: true } as const

@Injectable()
export class ProviderSettingsRepositoryImpl implements ProviderSettingsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProviderSettingRow[]> {
    return this.prisma.aiProviderSetting.findMany({ select: COLUMNS })
  }

  find(provider: string): Promise<ProviderSettingRow | null> {
    return this.prisma.aiProviderSetting.findUnique({ where: { provider }, select: COLUMNS })
  }

  async upsert(row: ProviderSettingRow): Promise<void> {
    const { provider, ...data } = row
    await this.prisma.aiProviderSetting.upsert({
      where: { provider },
      create: row,
      update: data,
    })
  }

  async delete(provider: string): Promise<void> {
    await this.prisma.aiProviderSetting.deleteMany({ where: { provider } })
  }
}
