import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import {
  SETTING_KEYS,
  SettingsValidationError,
  sanitizeSetting,
  resolveFeatures,
} from '@/modules/app-settings/domain/policies/settings.policy'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'

const DEFAULTS: Record<string, unknown> = {
  maintenance: { on: false },
  announcements: { items: [] },
  pricing: null,
  ai_welcome: null,
}

const camelCase = (key: string) => key.replaceAll(/_(\w)/g, (_, char: string) => char.toUpperCase())

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly settings: AppSettingsService,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
  ) {}

  async getAll(): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      SETTING_KEYS.map(
        async (key) =>
          [
            camelCase(key),
            key === 'features'
              ? resolveFeatures(await this.settings.get('features'))
              : ((await this.settings.get(key)) ?? DEFAULTS[key]),
          ] as const,
      ),
    )
    return Object.fromEntries(entries)
  }

  async set(
    adminId: string,
    key: string,
    value: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let clean: Record<string, unknown>
    try {
      clean = sanitizeSetting(key, value)
    } catch (error) {
      if (error instanceof SettingsValidationError) {
        throw new BadRequestException({ code: ErrorCode.VALIDATION_ERROR, message: error.message })
      }
      throw error
    }
    await this.settings.set(key, clean)
    await this.audit.record(adminId, 'settings.set', key, clean)
    return clean
  }
}
