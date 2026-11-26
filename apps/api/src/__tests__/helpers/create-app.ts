import { RequestMethod } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { AppModule } from '@/app.module'
import { createValidationPipe } from '@/app/config/validation.config'
import { PrismaService } from '@/app/database/prisma.service'
import { AllExceptionsFilter } from '@/app/filters/all-exceptions.filter'
import { ProblemDetailsFilter } from '@/app/filters/problem-details.filter'
import { ThrottlerExceptionFilter } from '@/app/filters/throttler-exception.filter'
import { CorrelationIdInterceptor } from '@/app/interceptors/correlation-id.interceptor'
import { LinkHeaderInterceptor } from '@/app/interceptors/link-header.interceptor'
import { LocationHeaderInterceptor } from '@/app/interceptors/location-header.interceptor'
import { RequestContextInterceptor } from '@/app/interceptors/request-context.interceptor'
import { TimeoutInterceptor } from '@/app/interceptors/timeout.interceptor'
import { TraceContextInterceptor } from '@/app/interceptors/trace-context.interceptor'
import { TransformInterceptor } from '@/app/interceptors/transform.interceptor'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'

import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type { INestApplication, Type } from '@nestjs/common'

export interface CreateTestAppOptions {
  moduleOverrides?: { original: Type; replacement: Type }[]
}

export async function createTestApp(options: CreateTestAppOptions = {}): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] })

  for (const { original, replacement } of options.moduleOverrides ?? []) {
    builder = builder.overrideModule(original).useModule(replacement)
  }

  const moduleFixture = await builder.compile()
  const app = moduleFixture.createNestApplication()

  app.setGlobalPrefix('api', {
    exclude: [
      { path: '.well-known', method: RequestMethod.ALL },
      { path: '.well-known/{*path}', method: RequestMethod.ALL },
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/{*path}', method: RequestMethod.ALL },
    ],
  })

  app.useGlobalFilters(
    app.get(ThrottlerExceptionFilter),
    app.get(ProblemDetailsFilter),
    app.get(AllExceptionsFilter),
  )

  app.useGlobalInterceptors(
    app.get(RequestContextInterceptor),
    app.get(CorrelationIdInterceptor),
    app.get(TraceContextInterceptor),
    new TimeoutInterceptor(app.get(Reflector), 30_000),
    new LocationHeaderInterceptor(),
    new LinkHeaderInterceptor(),
    new TransformInterceptor(app.get(Reflector)),
  )

  app.useGlobalPipes(createValidationPipe())

  await app.init()
  return app
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService)
  const cache = app.get<CachePort>(CACHE_PORT)
  const userIds = [...globalThis.e2eAuth.users.keys()]
  try {
    await prisma.userItem.deleteMany({ where: { ownerId: { in: userIds } } })
    await prisma.presence.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.appUserRole.deleteMany({ where: { userId: { in: userIds } } })
    await Promise.all(
      userIds.flatMap((id) => [cache.del(`platform:ban:${id}`), cache.del(`platform:role:${id}`)]),
    )
  } finally {
    await app.close()
  }
}
