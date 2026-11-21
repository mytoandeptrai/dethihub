import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional } from 'class-validator'

import { LenientInt } from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'

export class AdminPageQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @LenientInt(1, 1, 1_000_000)
  @IsInt()
  page?: number

  @ApiPropertyOptional({ example: 20, description: 'Clamped to 1..100' })
  @IsOptional()
  @LenientInt(20, 1, 100)
  @IsInt()
  perPage?: number
}
