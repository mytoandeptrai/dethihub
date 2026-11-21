import { Body, Controller, Delete, Get, HttpCode, Param, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { WorkspaceItemService } from '@/modules/workspace/application/services/workspace-item.service'
import {
  DeleteItemsQueryDto,
  ItemKindParamDto,
  ItemKindQueryDto,
  ItemParamsDto,
  ItemResponseDto,
  SaveItemDto,
} from '@/modules/workspace/presentation/dtos/workspace-item.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('workspace')
@ApiBearerAuth()
@RateLimit('workspace')
@Controller('workspace/items')
export class WorkspaceItemController {
  constructor(private readonly items: WorkspaceItemService) {}

  @Get()
  @ApiOperation({ summary: 'Synced items of one kind owned by the current user' })
  @ApiResponse({ status: 200, type: ItemResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ItemKindQueryDto,
  ): Promise<ItemResponseDto[]> {
    const items = await this.items.list(user.id, query.kind)
    return items.map((item) => ItemResponseDto.from(item))
  }

  @Put(':kind/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Create or replace an item; 413 when it exceeds a storage limit' })
  async save(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ItemParamsDto,
    @Body() dto: SaveItemDto,
  ): Promise<void> {
    await this.items.save(user.id, params.kind, params.id, dto.data)
  }

  @Delete(':kind')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete the given items of the current user' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ItemKindParamDto,
    @Query() query: DeleteItemsQueryDto,
  ): Promise<void> {
    await this.items.remove(user.id, params.kind, query.ids)
  }
}
