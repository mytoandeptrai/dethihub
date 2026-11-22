import { Module } from '@nestjs/common'

import { ALERT_NOTIFIER } from '@/modules/alerts/application/ports/alert-notifier.port'
import { ALERT_REPOSITORY } from '@/modules/alerts/application/ports/alert.repository.port'
import { AlertService } from '@/modules/alerts/application/services/alert.service'
import { TelegramNotifierAdapter } from '@/modules/alerts/infrastructure/adapters/telegram-notifier.adapter'
import { AlertRepositoryImpl } from '@/modules/alerts/infrastructure/repositories/alert.repository'

@Module({
  providers: [
    AlertService,
    { provide: ALERT_REPOSITORY, useClass: AlertRepositoryImpl },
    { provide: ALERT_NOTIFIER, useClass: TelegramNotifierAdapter },
  ],
})
export class AlertsModule {}
