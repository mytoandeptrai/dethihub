import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import type { Quota } from '@/modules/ai/domain/quota'

export class QuotaDto {
  @ApiProperty()
  used!: number

  @ApiProperty()
  limit!: number

  @ApiProperty({ enum: ['month'] })
  scope!: 'month'

  @ApiPropertyOptional()
  base?: number

  @ApiPropertyOptional()
  credits?: number
}

export class QuotaResponseDto {
  @ApiProperty({ type: QuotaDto, nullable: true })
  quota!: Quota | null

  @ApiProperty({ description: 'Total tokens ever granted (welcome, admin, top-up)' })
  granted!: number

  @ApiProperty()
  unlimited!: boolean

  static from(quota: Quota | null, granted: number): QuotaResponseDto {
    return Object.assign(new QuotaResponseDto(), { quota, granted, unlimited: quota === null })
  }
}
