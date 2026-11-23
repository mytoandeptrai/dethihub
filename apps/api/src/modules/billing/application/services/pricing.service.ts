import { Inject, Injectable } from '@nestjs/common'
import { DEFAULT_PRICING } from '@workspace/core'

import { APP_SETTINGS_READER } from '@/shared-kernel/application/ports/app-settings-reader.port'

import type { AppSettingsReaderPort } from '@/shared-kernel/application/ports/app-settings-reader.port'
import type { PricingConfig } from '@workspace/core'

@Injectable()
export class PricingService {
  constructor(@Inject(APP_SETTINGS_READER) private readonly settings: AppSettingsReaderPort) {}

  /** The stored price list; a missing or malformed one falls back to the defaults */
  async get(): Promise<PricingConfig> {
    const stored = await this.settings.get<Partial<PricingConfig>>('pricing')
    return stored && Array.isArray(stored.packs) && stored.packs.length > 0
      ? { ...DEFAULT_PRICING, ...stored }
      : DEFAULT_PRICING
  }
}
