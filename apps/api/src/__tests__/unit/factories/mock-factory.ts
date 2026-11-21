/**
 * Mock factories for unit tests
 *
 * Each function returns typed mock instances via createMock&lt;T>(),
 * suitable for direct instantiation: new SomeService(...createAuthMocks())
 */
import { createMock } from '@golevelup/ts-vitest'

import type { DomainEventPublisher } from '@/app/events/domain-event-publisher'
import type { AuthIdentityRepositoryPort } from '@/modules/auth/application/ports/auth-identity.repository.port'
import type { AuthSessionRepositoryPort } from '@/modules/auth/application/ports/auth-session.repository.port'
import type { LoginLogRepositoryPort } from '@/modules/auth/application/ports/login-log.repository.port'
import type { PasswordHasherPort } from '@/modules/auth/application/ports/password-hasher.port'
import type { UserRoleRepositoryPort } from '@/modules/auth/application/ports/user-role.repository.port'
import type { UserRepositoryPort } from '@/modules/auth/application/ports/user.repository.port'
import type { IdentityRepositoryPort } from '@/modules/identity/application/ports/user.repository.port'
import type { JobRepositoryPort } from '@/modules/order/application/ports/job.repository.port'
import type { OrderRepositoryPort } from '@/modules/order/application/ports/order.repository.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type { ConfigService } from '@nestjs/config'
import type { JwtService } from '@nestjs/jwt'

export function createAuthMocks() {
  return {
    authIdentityRepo: createMock<AuthIdentityRepositoryPort>(),
    authSessionRepo: createMock<AuthSessionRepositoryPort>(),
    passwordHasher: createMock<PasswordHasherPort>(),
    userRoleRepo: createMock<UserRoleRepositoryPort>(),
    userRepo: createMock<UserRepositoryPort>(),
    jwtService: createMock<JwtService>(),
    configService: createMock<ConfigService>(),
    eventPublisher: createMock<DomainEventPublisher>(),
    loginLogRepo: createMock<LoginLogRepositoryPort>(),
  }
}

export function createOAuthMocks() {
  return {
    authIdentityRepo: createMock<AuthIdentityRepositoryPort>(),
    authSessionRepo: createMock<AuthSessionRepositoryPort>(),
    userRoleRepo: createMock<UserRoleRepositoryPort>(),
    userRepo: createMock<UserRepositoryPort>(),
    jwtService: createMock<JwtService>(),
    configService: createMock<ConfigService>(),
    eventPublisher: createMock<DomainEventPublisher>(),
  }
}

export function createOrderMocks() {
  return {
    orderRepository: createMock<OrderRepositoryPort>(),
    jobRepository: createMock<JobRepositoryPort>(),
    cache: createMock<CachePort>(),
    domainEventPublisher: createMock<DomainEventPublisher>(),
  }
}

export function createUserMocks() {
  return {
    userRepository: createMock<IdentityRepositoryPort>(),
    eventPublisher: createMock<DomainEventPublisher>(),
  }
}
