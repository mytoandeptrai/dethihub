import { Injectable } from '@nestjs/common'

import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'

interface MaintenanceSetting {
  on?: boolean
  message?: string
}

const DEFAULT_MESSAGE = 'Ứng dụng đang bảo trì, vui lòng quay lại sau.'

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly settings: AppSettingsService,
    private readonly roles: PlatformRoleService,
  ) {}

  /** The message to show when the caller is blocked by maintenance mode, otherwise null */
  async blockMessage(userId: string | undefined): Promise<string | null> {
    const maintenance = await this.settings.get<MaintenanceSetting>('maintenance').catch(() => null)
    if (!maintenance?.on) return null

    if (userId) {
      const role = await this.roles.getRole(userId).catch(() => null)
      if (role) return null
    }
    return maintenance.message?.trim() || DEFAULT_MESSAGE
  }
}
