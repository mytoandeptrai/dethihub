import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/app/database/prisma.service'

import type {
  ProviderSettingRow,
  ProviderSettingsRepository,
} from '@/modules/ai/application/ports/provider-settings.repository.port'

@Injectable()
export class ProviderSettingsRepositoryImpl implements ProviderSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProviderSettingRow[]> {
    return this.prisma.aiProviderSetting.findMany({
      select: { provider: true, model: true, baseUrl: true, apiKeyEnc: true },
    })
  }
}
