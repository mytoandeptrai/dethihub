import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { AdminUserService } from '@/modules/access-control/application/services/admin-user.service'
import { UserDeletionService } from '@/modules/access-control/application/services/user-deletion.service'
import {
  AdminAuditQueryDto,
  AdminUserListQueryDto,
  AdminUserListResponseDto,
  AdminUserResponseDto,
  AuditListResponseDto,
  AuditRowResponseDto,
  BanUserDto,
  DeleteUserDto,
} from '@/modules/access-control/presentation/dtos/admin-user.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { ProtectTarget } from '@/shared-kernel/infrastructure/decorators/protect-target.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const DEFAULT_USERS_PER_PAGE = 20
const DEFAULT_AUDIT_PER_PAGE = 30

@ApiTags('admin-users')
@ApiBearerAuth()
@PlatformRoles('admin')
@RateLimit('admin')
@Controller('admin')
export class AdminUserController {
  constructor(
    private readonly users: AdminUserService,
    private readonly deletion: UserDeletionService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Accounts with usage, role, security flag and online state' })
  @ApiResponse({ status: 200, type: AdminUserListResponseDto })
  async list(@Query() query: AdminUserListQueryDto): Promise<AdminUserListResponseDto> {
    const { items, total } = await this.users.list(
      query.page ?? 1,
      query.perPage ?? DEFAULT_USERS_PER_PAGE,
      query.q ?? '',
    )
    return { items: items.map((item) => AdminUserResponseDto.from(item)), total }
  }

  @Post('users/:id/ban')
  @HttpCode(204)
  @ProtectTarget('users.ban')
  @ApiOperation({ summary: 'Ban an account; no hours = permanent' })
  async ban(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BanUserDto,
  ): Promise<void> {
    await this.users.ban(admin.id, id, body.hours, body.reason ?? '')
  }

  @Delete('users/:id/ban')
  @HttpCode(204)
  @ProtectTarget('users.unban')
  @ApiOperation({ summary: 'Lift a ban and the security lock (strikes are kept)' })
  async unban(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.users.unban(admin.id, id)
  }

  @Delete('users/:id/security-flags')
  @HttpCode(204)
  @ProtectTarget('security.clear')
  @ApiOperation({ summary: 'Delete the security flag row (does not lift a ban)' })
  async clearFlag(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.users.clearFlag(admin.id, id)
  }

  @Delete('users/:id')
  @HttpCode(204)
  @ProtectTarget('users.delete')
  @ApiOperation({ summary: 'Delete an account and its data in every context' })
  async remove(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeleteUserDto,
  ): Promise<void> {
    await this.deletion.delete(admin.id, id, body.confirmEmail)
  }

  @Get('audit')
  @ApiOperation({ summary: 'Admin audit log, newest first' })
  @ApiResponse({ status: 200, type: AuditListResponseDto })
  async audit(@Query() query: AdminAuditQueryDto): Promise<AuditListResponseDto> {
    const { rows, total } = await this.users.listAudit(
      query.page ?? 1,
      query.perPage ?? DEFAULT_AUDIT_PER_PAGE,
    )
    return { items: rows.map((row) => AuditRowResponseDto.from(row)), total }
  }
}
