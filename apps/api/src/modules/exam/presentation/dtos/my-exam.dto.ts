import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsObject, IsOptional, IsUUID } from 'class-validator'

import { csvToList } from '@/modules/exam/presentation/dtos/transforms'
import {
  IsBooleanField,
  IsIntField,
  IsStringField,
  MaxField,
  MaxLengthField,
  MinField,
} from '@/shared-kernel/infrastructure/decorators/validators'

import type { ExamDoc } from '@workspace/core'

export class PublishExamDto {
  @ApiProperty({ type: 'object', additionalProperties: true, description: 'Full exam document' })
  @IsObject()
  doc!: ExamDoc

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBooleanField()
  listed = true
}

export class SetListedDto {
  @ApiProperty()
  @IsBooleanField()
  listed!: boolean
}

export class MyExamsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(100)
  limit = 20

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(0)
  offset = 0
}

export class ExamAttemptsQueryDto {
  @ApiProperty({ description: 'Comma-separated exam ids owned by the caller' })
  @Transform(csvToList)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  examIds!: string[]

  @ApiPropertyOptional({ description: 'Pass the previous page nextCursor' })
  @IsOptional()
  @IsUUID()
  cursor?: string

  @ApiPropertyOptional({ type: Number, default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsIntField()
  @MinField(1)
  @MaxField(1000)
  limit = 1000
}

export class ExamAttemptDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  examId!: string

  @ApiProperty({ nullable: true })
  userId!: string | null

  @ApiProperty()
  studentName!: string

  @ApiProperty()
  score!: number

  @ApiProperty()
  maxScore!: number

  @ApiProperty()
  durationSeconds!: number

  @ApiProperty()
  createdAt!: string

  @ApiProperty({ nullable: true })
  deviceId!: string | null

  @ApiProperty({ nullable: true })
  className!: string | null

  @ApiProperty({ nullable: true })
  seatNo!: number | null
}

export class ExamAttemptsPageDto {
  @ApiProperty({ type: ExamAttemptDto, isArray: true })
  items!: ExamAttemptDto[]

  @ApiProperty({ nullable: true })
  nextCursor!: string | null
}

export class ReportRequestDto {
  @ApiProperty({ maxLength: 100 })
  @IsStringField()
  @MaxLengthField(100)
  reason!: string

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsStringField()
  @MaxLengthField(1000)
  detail?: string
}
