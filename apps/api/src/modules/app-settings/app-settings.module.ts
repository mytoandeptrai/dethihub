import { Module } from '@nestjs/common'

import { APP_SETTINGS_REPOSITORY } from '@/modules/app-settings/application/ports/app-settings.repository.port'
import { AdminSettingsService } from '@/modules/app-settings/application/services/admin-settings.service'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import { MaintenanceService } from '@/modules/app-settings/application/services/maintenance.service'
import { SiteStatusService } from '@/modules/app-settings/application/services/site-status.service'
import { AppSettingsRepositoryImpl } from '@/modules/app-settings/infrastructure/repositories/app-settings.repository'
import { AdminSettingsController } from '@/modules/app-settings/presentation/controllers/admin-settings.controller'
import { SiteStatusController } from '@/modules/app-settings/presentation/controllers/site-status.controller'

@Module({
  controllers: [AdminSettingsController, SiteStatusController],
  providers: [
    AppSettingsService,
    AdminSettingsService,
    MaintenanceService,
    SiteStatusService,
    { provide: APP_SETTINGS_REPOSITORY, useClass: AppSettingsRepositoryImpl },
  ],
  exports: [AppSettingsService, MaintenanceService],
})
export class AppSettingsModule {}
