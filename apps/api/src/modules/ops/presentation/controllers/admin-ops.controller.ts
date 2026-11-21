import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { OpsService } from '@/modules/ops/application/services/ops.service'
import {
  DbMetricsResponseDto,
  HealthQueryDto,
  HealthResponseDto,
  HealthTargetsResponseDto,
  OnlineResponseDto,
  OnlineUserDto,
  StatsOverviewResponseDto,
  StatsQueryDto,
} from '@/modules/ops/presentation/dtos/admin-ops.dto'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

const DEFAULT_DAYS = 7

@ApiTags('admin-ops')
@ApiBearerAuth()
@PlatformRoles('admin')
@RateLimit('admin')
@Controller('admin')
export class AdminOpsController {
  constructor(private readonly ops: OpsService) {}

  @Get('stats/overview')
  @ApiOperation({ summary: 'Totals and per-day counts (Asia/Ho_Chi_Minh days)' })
  @ApiResponse({ status: 200, type: StatsOverviewResponseDto })
  async overview(@Query() query: StatsQueryDto): Promise<StatsOverviewResponseDto> {
    const days = query.days ?? DEFAULT_DAYS
    return { days, ...(await this.ops.overview(days)) }
  }

  @Get('stats/online')
  @ApiOperation({ summary: 'Users seen in the last 2 minutes (newest 20)' })
  @ApiResponse({ status: 200, type: OnlineResponseDto })
  async online(): Promise<OnlineResponseDto> {
    const { total, users } = await this.ops.online()
    return {
      onlineCount: total,
      users: users.map((user) => OnlineUserDto.from(user)),
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Ping the database and file store (all, or one `target`)' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  health(@Query() query: HealthQueryDto): Promise<HealthResponseDto> {
    return this.ops.health(query.target)
  }

  @Get('health/targets')
  @ApiOperation({ summary: 'Endpoints and masked keys of the services that can be pinged' })
  @ApiResponse({ status: 200, type: HealthTargetsResponseDto })
  targets(): HealthTargetsResponseDto {
    return this.ops.targets()
  }

  @Get('db/metrics')
  @ApiOperation({ summary: 'CPU, RAM, disk and connections of the Postgres server' })
  @ApiResponse({ status: 200, type: DbMetricsResponseDto })
  dbMetrics(): Promise<DbMetricsResponseDto> {
    return this.ops.dbMetrics()
  }
}
