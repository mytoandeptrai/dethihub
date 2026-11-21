import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional } from 'class-validator'

import {
  IsIntField,
  MaxField,
  MinField,
} from '@/shared-kernel/infrastructure/decorators/validators'

export class CreditEventsQueryDto {
  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(100)
  limit?: number = 20
}
