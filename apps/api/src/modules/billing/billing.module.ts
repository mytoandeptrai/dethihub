import { Module } from '@nestjs/common'

import { AppSettingsModule } from '@/modules/app-settings/app-settings.module'
import { PAYMENT_ORDER_REPOSITORY } from '@/modules/billing/application/ports/payment-order.repository.port'
import { PAYOS_GATEWAY } from '@/modules/billing/application/ports/payos-gateway.port'
import { PaymentOrderService } from '@/modules/billing/application/services/payment-order.service'
import { PaymentSettlementService } from '@/modules/billing/application/services/payment-settlement.service'
import { PricingService } from '@/modules/billing/application/services/pricing.service'
import { PayosGatewayAdapter } from '@/modules/billing/infrastructure/adapters/payos-gateway.adapter'
import { PaymentOrderRepositoryImpl } from '@/modules/billing/infrastructure/repositories/payment-order.repository'
import { BillingController } from '@/modules/billing/presentation/controllers/billing.controller'

@Module({
  imports: [AppSettingsModule],
  controllers: [BillingController],
  providers: [
    PricingService,
    PaymentOrderService,
    PaymentSettlementService,
    { provide: PAYMENT_ORDER_REPOSITORY, useClass: PaymentOrderRepositoryImpl },
    { provide: PAYOS_GATEWAY, useClass: PayosGatewayAdapter },
  ],
  exports: [PaymentSettlementService],
})
export class BillingModule {}
