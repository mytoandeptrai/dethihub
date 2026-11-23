import { Module } from '@nestjs/common'

import { UserDeletionListener } from '@/modules/billing/application/listeners/user-deletion.listener'
import { PAYMENT_ADMIN_REPOSITORY } from '@/modules/billing/application/ports/payment-admin.repository.port'
import { PAYMENT_ORDER_REPOSITORY } from '@/modules/billing/application/ports/payment-order.repository.port'
import { PAYOS_GATEWAY } from '@/modules/billing/application/ports/payos-gateway.port'
import { USER_DATA_REPOSITORY } from '@/modules/billing/application/ports/user-data.repository.port'
import { PaymentAdminService } from '@/modules/billing/application/services/payment-admin.service'
import { PaymentOrderService } from '@/modules/billing/application/services/payment-order.service'
import { PaymentSettlementService } from '@/modules/billing/application/services/payment-settlement.service'
import { PricingService } from '@/modules/billing/application/services/pricing.service'
import { PayosGatewayAdapter } from '@/modules/billing/infrastructure/adapters/payos-gateway.adapter'
import { PaymentAdminRepositoryImpl } from '@/modules/billing/infrastructure/repositories/payment-admin.repository'
import { PaymentOrderRepositoryImpl } from '@/modules/billing/infrastructure/repositories/payment-order.repository'
import { UserDataRepositoryImpl } from '@/modules/billing/infrastructure/repositories/user-data.repository'
import { BillingController } from '@/modules/billing/presentation/controllers/billing.controller'
import { PaymentAdminController } from '@/modules/billing/presentation/controllers/payment-admin.controller'

@Module({
  controllers: [BillingController, PaymentAdminController],
  providers: [
    UserDeletionListener,
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
    PricingService,
    PaymentOrderService,
    PaymentSettlementService,
    PaymentAdminService,
    { provide: PAYMENT_ADMIN_REPOSITORY, useClass: PaymentAdminRepositoryImpl },
    { provide: PAYMENT_ORDER_REPOSITORY, useClass: PaymentOrderRepositoryImpl },
    { provide: PAYOS_GATEWAY, useClass: PayosGatewayAdapter },
  ],
  exports: [PaymentSettlementService],
})
export class BillingModule {}
