import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsObject, IsOptional } from 'class-validator'

import { trimmedTo } from '@/modules/exam/presentation/dtos/transforms'
import {
  IsNotEmptyField,
  IsStringField,
} from '@/shared-kernel/infrastructure/decorators/validators'

import type { AttemptOutcome } from '@/modules/exam/application/services/attempt.service'
import type { AnswerKeyEntry } from '@/modules/exam/domain/policies/attempt-grading.policy'

const MAX_SECONDS = 86_400

export class SubmitAttemptDto {
  @ApiProperty({ maxLength: 60 })
  @Transform(trimmedTo(60))
  @IsStringField()
  @IsNotEmptyField()
  name!: string

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsObject()
  answers!: Record<string, unknown>

  @ApiPropertyOptional({ type: Number, description: 'Seconds spent, clamped to 0..86400' })
  @IsOptional()
  @Transform(({ value }) => Math.max(0, Math.min(MAX_SECONDS, Math.round(Number(value) || 0))))
  seconds = 0

  @ApiPropertyOptional({
    type: String,
    maxLength: 64,
    description: 'Ignored when shorter than 8 characters',
  })
  @IsOptional()
  @Transform(trimmedTo(64))
  @IsStringField()
  deviceId = ''

  @ApiPropertyOptional({ type: String, maxLength: 30 })
  @IsOptional()
  @Transform(trimmedTo(30))
  @IsStringField()
  className = ''

  @ApiPropertyOptional({ minimum: 1, maximum: 999, description: 'Ignored when out of range' })
  @IsOptional()
  @Transform(({ value }) => {
    const seat = Number(value)
    return Number.isInteger(seat) && seat >= 1 && seat <= 999 ? seat : undefined
  })
  seat?: number
}

export class AttemptResultDto {
  @ApiPropertyOptional({ description: 'True when the score is withheld from the student' })
  submitted?: boolean

  @ApiPropertyOptional()
  hidden?: boolean

  @ApiPropertyOptional()
  score?: number

  @ApiPropertyOptional()
  max?: number

  @ApiPropertyOptional({ description: 'Total points of the auto-graded questions' })
  gradable?: number

  @ApiPropertyOptional()
  correct?: number

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        explanation: { type: 'string' },
        solution: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  key?: Record<string, AnswerKeyEntry>

  static from(outcome: AttemptOutcome): AttemptResultDto {
    return Object.assign(new AttemptResultDto(), outcome)
  }
}
