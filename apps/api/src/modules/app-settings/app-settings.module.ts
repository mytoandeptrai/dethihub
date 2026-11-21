import { Module } from '@nestjs/common'

import { APP_SETTINGS_REPOSITORY } from '@/modules/app-settings/application/ports/app-settings.repository.port'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import { MaintenanceService } from '@/modules/app-settings/application/services/maintenance.service'
import { PrismaAppSettingsRepository } from '@/modules/app-settings/infrastructure/repositories/app-settings.repository'
import { APP_SETTINGS } from '@/shared-kernel/application/ports/app-settings.port'

@Module({
  providers: [
    AppSettingsService,
    MaintenanceService,
    { provide: APP_SETTINGS, useExisting: AppSettingsService },
    { provide: APP_SETTINGS_REPOSITORY, useClass: PrismaAppSettingsRepository },
  ],
  exports: [APP_SETTINGS, MaintenanceService],
})
export class AppSettingsModule {}
