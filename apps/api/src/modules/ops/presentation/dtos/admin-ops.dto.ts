import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString } from 'class-validator'

import {
  LenientInt,
  Trim,
} from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'

import type { OnlineUser } from '@/modules/ops/application/services/ops.service'

export class StatsQueryDto {
  @ApiPropertyOptional({ example: 7, description: 'Clamped to 1..90' })
  @IsOptional()
  @LenientInt(7, 1, 90)
  @IsInt()
  days?: number
}

export class HealthQueryDto {
  @ApiPropertyOptional({ enum: ['supabase', 'r2'] })
  @IsOptional()
  @Trim(40)
  @IsString()
  target?: string
}

export class DailyStatsDto {
  @ApiProperty() day!: string
  @ApiProperty() newUsers!: number
  @ApiProperty() newDocs!: number
  @ApiProperty() newDecks!: number
  @ApiProperty() newCommunityExams!: number
}

export class StatsOverviewResponseDto {
  @ApiProperty() days!: number
  @ApiProperty() totalUsers!: number
  @ApiProperty() active7d!: number
  @ApiProperty() active30d!: number
  @ApiProperty() onlineCount!: number
  @ApiProperty({ type: [DailyStatsDto] }) chartDays!: DailyStatsDto[]
}

export class OnlineUserDto {
  @ApiProperty() userId!: string
  @ApiProperty() email!: string
  @ApiProperty() name!: string
  @ApiProperty() avatar!: string
  @ApiProperty() lastSeen!: string

  static from(user: OnlineUser): OnlineUserDto {
    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      lastSeen: user.lastSeen.toISOString(),
    }
  }
}

export class OnlineResponseDto {
  @ApiProperty() onlineCount!: number
  @ApiProperty({ type: [OnlineUserDto] }) users!: OnlineUserDto[]
}

export class PingResultDto {
  @ApiProperty() ok!: boolean
  @ApiProperty() ms!: number
  @ApiPropertyOptional() error?: string
}

export class HealthResponseDto {
  @ApiProperty() checkedAt!: string
  @ApiPropertyOptional({ type: PingResultDto }) supabase?: PingResultDto
  @ApiPropertyOptional({ type: PingResultDto }) r2?: PingResultDto
}

export class HealthTargetDto {
  @ApiProperty() endpoint!: string
  @ApiProperty() keyMask!: string
}

export class HealthTargetsResponseDto {
  @ApiProperty({ type: HealthTargetDto }) supabase!: HealthTargetDto
  @ApiProperty({ type: HealthTargetDto }) r2!: HealthTargetDto
}

export class DbMetricsResponseDto {
  @ApiProperty() name!: string
  @ApiProperty() region!: string
  @ApiProperty() compute!: string
  @ApiProperty() checkedAt!: string
  @ApiProperty({ nullable: true }) cpu!: number | null
  @ApiProperty({ nullable: true }) ram!: number | null
  @ApiProperty({ nullable: true }) disk!: number | null
  @ApiProperty({ nullable: true }) connections!: number | null
  @ApiProperty({ nullable: true }) maxConnections!: number | null
}
