import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { ClsModule } from 'nestjs-cls'

import { createClsConfig } from '@/app/config/cls.config'
import { validateEnv } from '@/app/config/env.schema'
import { createThrottlerOptions } from '@/app/config/throttler.config'
import { PrismaModule } from '@/app/database/prisma.module'
import { DomainEventsModule } from '@/app/events/domain-events.module'
import { AllExceptionsFilter } from '@/app/filters/all-exceptions.filter'
import { ProblemDetailsFilter } from '@/app/filters/problem-details.filter'
import { ThrottlerExceptionFilter } from '@/app/filters/throttler-exception.filter'
import { CorrelationIdInterceptor } from '@/app/interceptors/correlation-id.interceptor'
import { RequestContextInterceptor } from '@/app/interceptors/request-context.interceptor'
import { TraceContextInterceptor } from '@/app/interceptors/trace-context.interceptor'
import { LoggerModule } from '@/app/logger/logger.module'
import { ETagMiddleware } from '@/app/middleware/etag.middleware'
import { AccessControlModule } from '@/modules/access-control/access-control.module'
import { PlatformRolesGuard } from '@/modules/access-control/presentation/guards/platform-roles.guard'
import { SupabaseAuthGuard } from '@/modules/access-control/presentation/guards/supabase-auth.guard'
import { TargetProtectionGuard } from '@/modules/access-control/presentation/guards/target-protection.guard'
import { AiModule } from '@/modules/ai/ai.module'
import { AlertsModule } from '@/modules/alerts/alerts.module'
import { AppSettingsModule } from '@/modules/app-settings/app-settings.module'
import { MaintenanceGuard } from '@/modules/app-settings/presentation/guards/maintenance.guard'
import { BankModule } from '@/modules/bank/bank.module'
import { BillingModule } from '@/modules/billing/billing.module'
import { CacheModule } from '@/modules/cache/cache.module'
import { ExamModule } from '@/modules/exam/exam.module'
import { FeedbackModule } from '@/modules/feedback/feedback.module'
import { HealthModule } from '@/modules/health/health.module'
import { MediaModule } from '@/modules/media/media.module'
import { OpsModule } from '@/modules/ops/ops.module'
import { StorageModule } from '@/modules/storage/storage.module'
import { WorkspaceModule } from '@/modules/workspace/workspace.module'

import type { Env } from '@/app/config/env.schema'
import type { NestModule, MiddlewareConsumer } from '@nestjs/common'

/**
 * Root module: assembles all feature modules and infrastructure
 *
 * Architecture notes:
 * - Based on Modular Layered Architecture
 * - Incorporates the Dependency Inversion Principle (DIP)
 * - Uses DDD (Domain-Driven Design) on demand
 */
@Module({
  imports: [
    // Config module: global environment variable management
    ConfigModule.forRoot({
      isGlobal: true, // make ConfigService available throughout the application
      envFilePath: ['.env'],
      validate: validateEnv, // validate environment variables with Zod
      cache: true, // cache environment variables for improved performance
    }),
    // CLS module: request context management (Request ID, tracing, etc.)
    ClsModule.forRoot(createClsConfig()),
    // Schedule module: cron jobs and task scheduling
    ScheduleModule.forRoot(),
    // Logger module: high-performance structured logging (Pino)
    LoggerModule,
    // Event module: domain events and integration events
    EventEmitterModule.forRoot({
      wildcard: true, // support wildcard event listeners (e.g. 'user.*')
      delimiter: '.', // event name delimiter
      maxListeners: 10, // maximum listeners per event
      verboseMemoryLeak: true, // warn when maxListeners is exceeded
      ignoreErrors: false, // do not suppress errors from event handlers
    }),
    // Database module: global Prisma instance
    PrismaModule,
    // Domain events module: global domain event publisher
    DomainEventsModule,
    // Rate limiting module: prevent API abuse (read from env vars; unlimited by default locally)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Env, true>) =>
        createThrottlerOptions({
          THROTTLE_TTL: configService.get('THROTTLE_TTL', { infer: true }),
          THROTTLE_LIMIT: configService.get('THROTTLE_LIMIT', { infer: true }),
        }),
      inject: [ConfigService],
    }),
    HealthModule, // health check module
    CacheModule, // Redis cache
    AccessControlModule, // authentication, platform roles, security strikes
    AppSettingsModule, // app settings and maintenance mode
    AiModule, // AI quota, credits, chat
    ExamModule, // published exams, attempts, reports
    WorkspaceModule, // synced user items
    StorageModule, // uploads, documents, file reads
    MediaModule, // text extraction, vision, image generation, figure store
    BillingModule, // PayOS top-up orders and webhook
    FeedbackModule, // user feedback inbox
    BankModule, // question bank overrides and admin editing
    OpsModule, // admin stats, health and database metrics
    AlertsModule, // Telegram alerts on signups, AI errors, AI cost and long maintenance
  ],
  providers: [
    // Global guards (order matters: authentication first, then roles, then maintenance, then throttler)
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: PlatformRolesGuard },
    { provide: APP_GUARD, useClass: TargetProtectionGuard },
    { provide: APP_GUARD, useClass: MaintenanceGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Exception filters (require ClsService injection)
    AllExceptionsFilter,
    ProblemDetailsFilter,
    ThrottlerExceptionFilter,
    // Interceptors (require ClsService injection)
    RequestContextInterceptor,
    CorrelationIdInterceptor,
    TraceContextInterceptor,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Register global middleware
    consumer
      .apply(ETagMiddleware) // ETag and 304 Not Modified support
      .forRoutes('{*path}') // apply to all routes
  }
}
