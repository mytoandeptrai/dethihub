import { Injectable } from '@nestjs/common'
import { DEFAULT_PRICING } from '@workspace/core'

import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'

import type { PricingConfig } from '@workspace/core'

@Injectable()
export class PricingService {
  constructor(private readonly settings: AppSettingsService) {}

  /** The stored price list; a missing or malformed one falls back to the defaults */
  async get(): Promise<PricingConfig> {
    const stored = await this.settings.get<Partial<PricingConfig>>('pricing')
    return stored && Array.isArray(stored.packs) && stored.packs.length > 0
      ? { ...DEFAULT_PRICING, ...stored }
      : DEFAULT_PRICING
  }
}
