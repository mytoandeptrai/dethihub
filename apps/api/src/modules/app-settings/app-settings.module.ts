import { Module } from '@nestjs/common'

import { APP_SETTINGS_REPOSITORY } from '@/modules/app-settings/application/ports/app-settings.repository.port'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import { MaintenanceService } from '@/modules/app-settings/application/services/maintenance.service'
import { AppSettingsRepositoryImpl } from '@/modules/app-settings/infrastructure/repositories/app-settings.repository'

@Module({
  providers: [
    AppSettingsService,
    MaintenanceService,
    { provide: APP_SETTINGS_REPOSITORY, useClass: AppSettingsRepositoryImpl },
  ],
  exports: [AppSettingsService, MaintenanceService],
})
export class AppSettingsModule {}
