import { Module } from '@nestjs/common'

import { DB_METRICS_SOURCE } from '@/modules/ops/application/ports/db-metrics.port'
import { OPS_QUERY_REPOSITORY } from '@/modules/ops/application/ports/ops-query.repository.port'
import { OpsService } from '@/modules/ops/application/services/ops.service'
import { SupabaseMetricsAdapter } from '@/modules/ops/infrastructure/adapters/supabase-metrics.adapter'
import { OpsQueryRepositoryImpl } from '@/modules/ops/infrastructure/repositories/ops-query.repository'
import { AdminOpsController } from '@/modules/ops/presentation/controllers/admin-ops.controller'

@Module({
  controllers: [AdminOpsController],
  providers: [
    OpsService,
    { provide: OPS_QUERY_REPOSITORY, useClass: OpsQueryRepositoryImpl },
    { provide: DB_METRICS_SOURCE, useClass: SupabaseMetricsAdapter },
  ],
})
export class OpsModule {}
