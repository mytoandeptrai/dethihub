import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { TOKENS_PER_POINT } from '@/modules/ai/domain/quota'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'

import type { Env } from '@/app/config/env.schema'

/** Welcome gift in tokens: the admin setting wins, a missing or unreadable one falls back to the env default */
@Injectable()
export class WelcomePointsService {
  constructor(
    private readonly settings: AppSettingsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async tokens(): Promise<number> {
    let points = this.config.get('AI_WELCOME_POINTS', { infer: true })
    try {
      const stored = (await this.settings.get<{ points?: unknown }>('ai_welcome'))?.points
      if (typeof stored === 'number' && Number.isInteger(stored) && stored >= 0) points = stored
    } catch {
      // keep the env default
    }
    return points * TOKENS_PER_POINT
  }
}
