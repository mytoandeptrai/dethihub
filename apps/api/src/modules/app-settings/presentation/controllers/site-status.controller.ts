import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { SiteStatusService } from '@/modules/app-settings/application/services/site-status.service'
import { SiteStatusResponseDto } from '@/modules/app-settings/presentation/dtos/site-status.dto'
import { Public } from '@/shared-kernel/infrastructure/decorators/public.decorator'

@ApiTags('platform')
@Controller('site')
export class SiteStatusController {
  constructor(private readonly status: SiteStatusService) {}

  // Stays open during maintenance: the maintenance page itself reads it
  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Maintenance state and the announcements to show' })
  @ApiResponse({ status: 200, type: SiteStatusResponseDto })
  async get(): Promise<SiteStatusResponseDto> {
    const { maintenance, announcements } = await this.status.get()
    return {
      maintenance,
      announcements: announcements.map(({ id, title, text, image, tryPath, until }) => ({
        id,
        title,
        text,
        image,
        tryPath,
        until,
      })),
    }
  }
}
