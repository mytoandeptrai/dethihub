import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional } from 'class-validator'

import {
  AI_FEEDBACK_KINDS,
  AI_FEEDBACK_MODES,
} from '@/modules/ai/application/ports/feedback.repository.port'
import { IsInField, IsStringField } from '@/shared-kernel/infrastructure/decorators/validators'

export class FeedbackRequestDto {
  @ApiProperty({ enum: AI_FEEDBACK_KINDS })
  @IsInField([...AI_FEEDBACK_KINDS])
  kind!: (typeof AI_FEEDBACK_KINDS)[number]

  @ApiPropertyOptional({ enum: AI_FEEDBACK_MODES, default: 'exam' })
  @IsOptional()
  @IsInField([...AI_FEEDBACK_MODES])
  mode?: (typeof AI_FEEDBACK_MODES)[number]

  @ApiPropertyOptional()
  @IsOptional()
  @IsStringField()
  request?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsStringField()
  reply?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsStringField()
  context?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsStringField()
  note?: string
}
