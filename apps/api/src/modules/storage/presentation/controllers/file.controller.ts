import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'

import { FileReadService } from '@/modules/storage/application/services/file-read.service'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { Public } from '@/shared-kernel/infrastructure/decorators/public.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'
import type { Response } from 'express'

@ApiTags('storage')
@Public()
@RateLimit('files')
@Controller('files')
export class FileController {
  constructor(private readonly files: FileReadService) {}

  @Get('*key')
  @ApiOperation({
    summary: 'Read a stored file: images are public, documents only for their owner',
  })
  @ApiParam({ name: 'key', description: 'e.g. img/<hash>.png', type: String })
  async read(
    @Param('key') key: string | string[],
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const file = await this.files.read(Array.isArray(key) ? key.join('/') : key, user?.id)
    res.set({
      // Stops browsers from re-guessing user-uploaded content as HTML or script
      'X-Content-Type-Options': 'nosniff',
      // Names are content hashes, so public files never change; private ones must not sit in shared caches
      'Cache-Control': file.isPrivate ? 'private, no-store' : 'public, max-age=31536000, immutable',
    })
    return new StreamableFile(file.stream, {
      type: file.contentType ?? 'application/octet-stream',
      length: file.size,
    })
  }
}
