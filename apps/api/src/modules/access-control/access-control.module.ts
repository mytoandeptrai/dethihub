import { Global, Module } from '@nestjs/common'

import { ADMIN_AUDIT_REPOSITORY } from '@/modules/access-control/application/ports/admin-audit.repository.port'
import { ADMIN_USER_REPOSITORY } from '@/modules/access-control/application/ports/admin-user.repository.port'
import { AUTH_USER_DIRECTORY } from '@/modules/access-control/application/ports/auth-user-directory.port'
import { SECURITY_FLAG_REPOSITORY } from '@/modules/access-control/application/ports/security-flag.repository.port'
import { TOKEN_VERIFIER } from '@/modules/access-control/application/ports/token-verifier.port'
import { USER_ROLE_REPOSITORY } from '@/modules/access-control/application/ports/user-role.repository.port'
import { AdminUserService } from '@/modules/access-control/application/services/admin-user.service'
import { UserDeletionService } from '@/modules/access-control/application/services/user-deletion.service'
import { AuthenticationService } from '@/modules/access-control/application/services/authentication.service'
import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'
import { RoleAuthorizationService } from '@/modules/access-control/application/services/role-authorization.service'
import { SecurityStrikeService } from '@/modules/access-control/application/services/security-strike.service'
import { AdminAuditAdapter } from '@/modules/access-control/infrastructure/adapters/admin-audit.adapter'
import { PlatformRoleLookupAdapter } from '@/modules/access-control/infrastructure/adapters/platform-role-lookup.adapter'
import { JoseTokenVerifierAdapter } from '@/modules/access-control/infrastructure/adapters/jose-token-verifier.adapter'
import { SupabaseUserProfileLookupAdapter } from '@/modules/access-control/infrastructure/adapters/supabase-user-profile-lookup.adapter'
import { SupabaseAuthAdminAdapter } from '@/modules/access-control/infrastructure/adapters/supabase-auth-admin.adapter'
import { AdminAuditRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/admin-audit.repository'
import { AdminUserRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/admin-user.repository'
import { SecurityFlagRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/security-flag.repository'
import { UserRoleRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/user-role.repository'
import { AdminUserController } from '@/modules/access-control/presentation/controllers/admin-user.controller'
import { PresenceController } from '@/modules/access-control/presentation/controllers/presence.controller'
import { PresenceRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/presence.repository'
import { PRESENCE_REPOSITORY } from '@/modules/access-control/application/ports/presence.repository.port'
import { MeController } from '@/modules/access-control/presentation/controllers/me.controller'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { PLATFORM_ROLE_LOOKUP } from '@/shared-kernel/application/ports/platform-role-lookup.port'
import { USER_PROFILE_LOOKUP } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import { USER_DATA_REPOSITORY } from '@/modules/access-control/application/ports/user-data.repository.port'
import { UserDeletionListener } from '@/modules/access-control/application/listeners/user-deletion.listener'
import { UserDataRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/user-data.repository'

@Global() // @global-approved: auth guards and the auth user directory are consumed by every context
@Module({
  controllers: [MeController, AdminUserController, PresenceController],
  providers: [
    UserDeletionListener,
    { provide: USER_DATA_REPOSITORY, useClass: UserDataRepositoryImpl },
    AuthenticationService,
    PlatformRoleService,
    { provide: PLATFORM_ROLE_LOOKUP, useClass: PlatformRoleLookupAdapter },
    RoleAuthorizationService,
    SecurityStrikeService,
    AdminUserService,
    UserDeletionService,
    SupabaseAuthAdminAdapter,
    { provide: TOKEN_VERIFIER, useClass: JoseTokenVerifierAdapter },
    { provide: AUTH_USER_DIRECTORY, useExisting: SupabaseAuthAdminAdapter },
    { provide: USER_PROFILE_LOOKUP, useClass: SupabaseUserProfileLookupAdapter },
    { provide: USER_ROLE_REPOSITORY, useClass: UserRoleRepositoryImpl },
    { provide: SECURITY_FLAG_REPOSITORY, useClass: SecurityFlagRepositoryImpl },
    { provide: ADMIN_AUDIT_REPOSITORY, useClass: AdminAuditRepositoryImpl },
    { provide: ADMIN_USER_REPOSITORY, useClass: AdminUserRepositoryImpl },
    { provide: PRESENCE_REPOSITORY, useClass: PresenceRepositoryImpl },
    { provide: ADMIN_AUDIT, useClass: AdminAuditAdapter },
  ],
  exports: [
    PLATFORM_ROLE_LOOKUP,
    AuthenticationService,
    PlatformRoleService,
    RoleAuthorizationService,
    USER_PROFILE_LOOKUP,
    ADMIN_AUDIT,
  ],
})
export class AccessControlModule {}
