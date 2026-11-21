import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { StorageAdminService } from '@/modules/storage/application/services/storage-admin.service'
import {
  AdminDocumentDto,
  AdminDocumentListQueryDto,
  AdminDocumentListResponseDto,
  DeleteDocumentResponseDto,
  SetStorageDto,
  TopStorageUserDto,
  UserStorageResponseDto,
} from '@/modules/storage/presentation/dtos/storage-admin.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { ProtectTarget } from '@/shared-kernel/infrastructure/decorators/protect-target.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const DEFAULT_PER_PAGE = 20

@ApiTags('admin-storage')
@ApiBearerAuth()
@PlatformRoles('admin')
@RateLimit('admin')
@Controller('admin')
export class StorageAdminController {
  constructor(private readonly admin: StorageAdminService) {}

  @Get('storage/users/:id')
  @ApiOperation({ summary: 'Storage limit override and usage of a user' })
  @ApiResponse({ status: 200, type: UserStorageResponseDto })
  async getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserStorageResponseDto> {
    return UserStorageResponseDto.from(await this.admin.getUser(id))
  }

  @Put('storage/users/:id')
  @HttpCode(204)
  @ProtectTarget('storage.set')
  @ApiOperation({ summary: 'Set the storage limit of a user (maxBytes null = default 10 MB)' })
  async setUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetStorageDto,
  ): Promise<void> {
    await this.admin.setUser(admin.id, id, body.maxBytes, body.note ?? '')
  }

  @Get('documents')
  @ApiOperation({ summary: 'Uploaded documents of all users plus the top 20 by size' })
  @ApiResponse({ status: 200, type: AdminDocumentListResponseDto })
  async listDocuments(
    @Query() query: AdminDocumentListQueryDto,
  ): Promise<AdminDocumentListResponseDto> {
    const { items, topUsers, total } = await this.admin.listDocuments(
      query.q ?? '',
      query.page ?? 1,
      query.perPage ?? DEFAULT_PER_PAGE,
    )
    return {
      items: items.map((item) => AdminDocumentDto.from(item)),
      topUsers: topUsers.map((user) => TopStorageUserDto.from(user)),
      total,
    }
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a document row and, when unshared, its stored file' })
  @ApiResponse({ status: 200, type: DeleteDocumentResponseDto })
  deleteDocument(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteDocumentResponseDto> {
    return this.admin.deleteDocument(admin.id, id)
  }
}
