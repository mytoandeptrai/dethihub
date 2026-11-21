import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator'

import {
  IsBooleanField,
  IsInField,
  IsNotEmptyField,
  IsStringField,
} from '@/shared-kernel/infrastructure/decorators/validators'

const REASONING_EFFORTS = ['low', 'medium', 'high', 'max'] as const

export class ChatMessageDto {
  @ApiProperty({
    enum: ['user', 'assistant', 'system'],
    description: 'system messages are dropped',
  })
  @IsInField(['user', 'assistant', 'system'])
  role!: string

  @ApiProperty()
  @IsStringField()
  content!: string
}

export class ChatRequestDto {
  @ApiProperty({ description: 'Task id; the server builds the system prompt from it' })
  @IsStringField()
  @IsNotEmptyField()
  task!: string

  @ApiPropertyOptional({ description: 'Task-specific data used to build the system prompt' })
  @IsOptional()
  taskInput?: unknown

  @ApiProperty({ type: ChatMessageDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]

  @ApiPropertyOptional({ description: 'Capped at 32000' })
  @IsOptional()
  @IsNumber()
  maxTokens?: number

  @ApiPropertyOptional({ enum: REASONING_EFFORTS })
  @IsOptional()
  @IsInField([...REASONING_EFFORTS])
  reasoningEffort?: (typeof REASONING_EFFORTS)[number]

  @ApiPropertyOptional({ description: 'Clamped to 0..2' })
  @IsOptional()
  @IsNumber()
  temperature?: number

  @ApiPropertyOptional({ description: 'Search the web first (DeepSeek only)' })
  @IsOptional()
  @IsBooleanField()
  webSearch?: boolean

  @ApiPropertyOptional({
    description:
      'Answer as a Server-Sent Events stream (delta, think, retry, done, error). Falls back to JSON when no provider could stream, and is ignored with webSearch',
  })
  @IsOptional()
  @IsBooleanField()
  stream?: boolean

  @ApiPropertyOptional({ description: 'Try the strong model first, priced higher' })
  @IsOptional()
  @IsBooleanField()
  strong?: boolean
}
