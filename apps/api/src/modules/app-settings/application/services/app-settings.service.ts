import { Inject, Injectable } from '@nestjs/common'

import { APP_SETTINGS_REPOSITORY } from '@/modules/app-settings/application/ports/app-settings.repository.port'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'

import type { AppSettingsRepository } from '@/modules/app-settings/application/ports/app-settings.repository.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'

const SETTINGS_CACHE_TTL_SECONDS = 30

@Injectable()
export class AppSettingsService {
  constructor(
    @Inject(APP_SETTINGS_REPOSITORY) private readonly settings: AppSettingsRepository,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const cacheKey = settingCacheKey(key)
    // The value is wrapped so that "setting does not exist" is cached too
    const cached = await this.cache.get<{ value: T | undefined }>(cacheKey)
    if (cached) return cached.value

    const value = (await this.settings.find(key)) as T | undefined
    await this.cache.set(cacheKey, { value }, SETTINGS_CACHE_TTL_SECONDS)
    return value
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.settings.upsert(key, value)
    await this.cache.del(settingCacheKey(key))
  }
}

const settingCacheKey = (key: string) => `platform:setting:${key}`
