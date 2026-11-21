import { Global, Module } from '@nestjs/common'

import { ADMIN_AUDIT_REPOSITORY } from '@/modules/access-control/application/ports/admin-audit.repository.port'
import { SECURITY_FLAG_REPOSITORY } from '@/modules/access-control/application/ports/security-flag.repository.port'
import { TOKEN_VERIFIER } from '@/modules/access-control/application/ports/token-verifier.port'
import { USER_ROLE_REPOSITORY } from '@/modules/access-control/application/ports/user-role.repository.port'
import { AuthenticationService } from '@/modules/access-control/application/services/authentication.service'
import { PlatformRoleService } from '@/modules/access-control/application/services/platform-role.service'
import { RoleAuthorizationService } from '@/modules/access-control/application/services/role-authorization.service'
import { SecurityStrikeService } from '@/modules/access-control/application/services/security-strike.service'
import { JoseTokenVerifier } from '@/modules/access-control/infrastructure/adapters/jose-token-verifier.adapter'
import { SupabaseAuthAdminAdapter } from '@/modules/access-control/infrastructure/adapters/supabase-auth-admin.adapter'
import { AdminAuditRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/admin-audit.repository'
import { SecurityFlagRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/security-flag.repository'
import { UserRoleRepositoryImpl } from '@/modules/access-control/infrastructure/repositories/user-role.repository'
import { MeController } from '@/modules/access-control/presentation/controllers/me.controller'
import { AUTH_USER_DIRECTORY } from '@/shared-kernel/application/ports/auth-user-directory.port'
import { SECURITY_STRIKE } from '@/shared-kernel/application/ports/security-strike.port'

@Global() // @global-approved: auth guards and the auth user directory are consumed by every context
@Module({
  controllers: [MeController],
  providers: [
    AuthenticationService,
    PlatformRoleService,
    RoleAuthorizationService,
    SecurityStrikeService,
    SupabaseAuthAdminAdapter,
    { provide: TOKEN_VERIFIER, useClass: JoseTokenVerifier },
    { provide: AUTH_USER_DIRECTORY, useExisting: SupabaseAuthAdminAdapter },
    { provide: SECURITY_STRIKE, useExisting: SecurityStrikeService },
    { provide: USER_ROLE_REPOSITORY, useClass: UserRoleRepositoryImpl },
    { provide: SECURITY_FLAG_REPOSITORY, useClass: SecurityFlagRepositoryImpl },
    { provide: ADMIN_AUDIT_REPOSITORY, useClass: AdminAuditRepositoryImpl },
  ],
  exports: [
    AuthenticationService,
    PlatformRoleService,
    RoleAuthorizationService,
    AUTH_USER_DIRECTORY,
    SECURITY_STRIKE,
  ],
})
export class AccessControlModule {}
