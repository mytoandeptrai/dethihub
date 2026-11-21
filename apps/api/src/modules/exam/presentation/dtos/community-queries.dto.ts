import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator'

import { csvToList, trimmedTo } from '@/modules/exam/presentation/dtos/transforms'
import {
  IsIntField,
  IsStringField,
  MaxField,
  MinField,
} from '@/shared-kernel/infrastructure/decorators/validators'

export class CommunityListQueryDto {
  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(100)
  limit?: number = 100
}

export class CommunityAuthorsQueryDto {
  @ApiProperty({ description: 'Comma-separated owner ids' })
  @Transform(csvToList)
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  ids!: string[]
}

export class GateQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimmedTo(64))
  @IsStringField()
  deviceId?: string
}
