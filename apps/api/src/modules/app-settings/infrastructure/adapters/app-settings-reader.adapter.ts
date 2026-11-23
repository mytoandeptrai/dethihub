import { Injectable } from '@nestjs/common'

import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'

import type { AppSettingsReaderPort } from '@/shared-kernel/application/ports/app-settings-reader.port'

@Injectable()
export class AppSettingsReaderAdapter implements AppSettingsReaderPort {
  constructor(private readonly settings: AppSettingsService) {}

  get<T>(key: string): Promise<T | undefined> {
    return this.settings.get<T>(key)
  }
}
