import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator'

import {
  LenientInt,
  Trim,
} from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'

import type { AiCallStatsRow } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import type { ErrorView, UserQuotaView } from '@/modules/ai/application/services/ai-admin.service'
import type { ProviderView } from '@/modules/ai/application/services/provider-config.service'

export class SetQuotaDto {
  @ApiProperty({
    nullable: true,
    description: 'null = unlimited; otherwise 0..1e9 tokens per month',
  })
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  monthlyTokens!: number | null

  @ApiPropertyOptional()
  @IsOptional()
  @Trim(300)
  @IsString()
  note?: string
}

export class GrantCreditsDto {
  @ApiProperty({ description: 'Tokens to add (1 point = 1,000 tokens), 1..100,000,000' })
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  tokens!: number

  @ApiPropertyOptional()
  @IsOptional()
  @Trim(300)
  @IsString()
  note?: string
}

export class SaveProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Trim(100)
  @IsString()
  model?: string

  @ApiPropertyOptional({ description: 'Empty = the default endpoint' })
  @IsOptional()
  @Trim(300)
  @IsString()
  endpoint?: string

  @ApiPropertyOptional({ description: 'Empty = keep the saved key' })
  @IsOptional()
  @Trim(500)
  @IsString()
  apiKey?: string
}

export class AiStatsQueryDto {
  @ApiPropertyOptional({ example: 7, description: 'Clamped to 1..90' })
  @IsOptional()
  @LenientInt(7, 1, 90)
  @IsInt()
  days?: number
}

export class AiErrorsQueryDto {
  @ApiPropertyOptional({ example: 30, description: 'Clamped to 1..100' })
  @IsOptional()
  @LenientInt(30, 1, 100)
  @IsInt()
  limit?: number
}

class QuotaOverrideDto {
  @ApiProperty({ nullable: true }) monthlyTokens!: number | null
  @ApiProperty() note!: string
}

export class UserQuotaResponseDto {
  @ApiProperty({ type: QuotaOverrideDto, nullable: true }) override!: QuotaOverrideDto | null
  @ApiProperty() defaultLimit!: number
  @ApiProperty() usedThisMonth!: number
  @ApiProperty() requestsThisMonth!: number
  @ApiProperty() credits!: number
  @ApiProperty() welcomePending!: boolean
  @ApiProperty() emptyDay!: number
  @ApiProperty() freeEmpty!: number

  static from(view: UserQuotaView): UserQuotaResponseDto {
    return view
  }
}

export class BalanceResponseDto {
  @ApiProperty() balance!: number
}

export class AiStatsRowDto {
  @ApiProperty() day!: string
  @ApiProperty() model!: string
  @ApiProperty() provider!: string
  @ApiProperty() calls!: number
  @ApiProperty() errors!: number
  @ApiProperty() tokens!: number
  @ApiProperty({ nullable: true }) cost!: number | null
  @ApiProperty() avgMs!: number
}

export class AiStatsResponseDto {
  @ApiProperty() days!: number
  @ApiProperty({ type: [AiStatsRowDto] }) rows!: AiStatsRowDto[]

  static from(days: number, rows: AiCallStatsRow[]): AiStatsResponseDto {
    return { days, rows }
  }
}

export class AiErrorDto {
  @ApiProperty() id!: number
  @ApiProperty({ nullable: true }) userId!: string | null
  @ApiProperty() model!: string
  @ApiProperty() provider!: string
  @ApiProperty({ nullable: true }) error!: string | null
  @ApiProperty() ms!: number
  @ApiProperty() createdAt!: string
  @ApiProperty() userName!: string
  @ApiProperty() userEmail!: string
  @ApiProperty() emptyDay!: number

  static from(view: ErrorView): AiErrorDto {
    return { ...view, createdAt: view.createdAt.toISOString() }
  }
}

export class AiErrorsResponseDto {
  @ApiProperty() freeEmpty!: number
  @ApiProperty({ type: [AiErrorDto] }) items!: AiErrorDto[]
}

export class ProviderDto {
  @ApiProperty() provider!: string
  @ApiProperty() model!: string
  @ApiProperty() defaultModel!: string
  @ApiProperty() endpoint!: string
  @ApiProperty() defaultEndpoint!: string
  @ApiProperty() keyMask!: string
  @ApiProperty() custom!: boolean

  static from(view: ProviderView): ProviderDto {
    return view
  }
}

export class ProvidersResponseDto {
  @ApiProperty({ type: [ProviderDto] }) providers!: ProviderDto[]
}

export class PingResponseDto {
  @ApiProperty() provider!: string
  @ApiProperty() model!: string
  @ApiProperty() ok!: boolean
  @ApiProperty() ms!: number
  @ApiPropertyOptional() error?: string
}
