import { Global, Module } from '@nestjs/common'

import { APP_SETTINGS_REPOSITORY } from '@/modules/app-settings/application/ports/app-settings.repository.port'
import { AdminSettingsService } from '@/modules/app-settings/application/services/admin-settings.service'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import { MaintenanceService } from '@/modules/app-settings/application/services/maintenance.service'
import { SiteStatusService } from '@/modules/app-settings/application/services/site-status.service'
import { AppSettingsReaderAdapter } from '@/modules/app-settings/infrastructure/adapters/app-settings-reader.adapter'
import { AppSettingsRepositoryImpl } from '@/modules/app-settings/infrastructure/repositories/app-settings.repository'
import { AdminSettingsController } from '@/modules/app-settings/presentation/controllers/admin-settings.controller'
import { SiteStatusController } from '@/modules/app-settings/presentation/controllers/site-status.controller'
import { APP_SETTINGS_READER } from '@/shared-kernel/application/ports/app-settings-reader.port'

@Global() // @global-approved: billing and AI read settings through the shared reader port
@Module({
  controllers: [AdminSettingsController, SiteStatusController],
  providers: [
    AppSettingsService,
    AdminSettingsService,
    MaintenanceService,
    SiteStatusService,
    { provide: APP_SETTINGS_READER, useClass: AppSettingsReaderAdapter },
    { provide: APP_SETTINGS_REPOSITORY, useClass: AppSettingsRepositoryImpl },
  ],
  exports: [AppSettingsService, MaintenanceService, APP_SETTINGS_READER],
})
export class AppSettingsModule {}
