import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

import { AdminPageQueryDto } from '@/shared-kernel/infrastructure/dtos/admin-page-query.dto'

import type { FeedbackRecord } from '@/modules/feedback/application/ports/feedback.repository.port'

export class FeedbackListQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ description: 'Only filters when given' })
  @IsOptional()
  // Implicit conversion would turn the string 'false' into true
  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    obj['read'] === 'true' ? true : obj['read'] === 'false' ? false : obj['read'],
  )
  @IsBoolean()
  read?: boolean
}

export class MarkFeedbackReadDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  read?: boolean
}

export class FeedbackResponseDto {
  @ApiProperty() id!: string
  @ApiProperty({ nullable: true }) userId!: string | null
  @ApiProperty({ nullable: true }) email!: string | null
  @ApiProperty() message!: string
  @ApiProperty({ nullable: true }) page!: string | null
  @ApiProperty() createdAt!: string
  @ApiProperty() read!: boolean

  static from(row: FeedbackRecord): FeedbackResponseDto {
    return { ...row, createdAt: row.createdAt.toISOString() }
  }
}

export class FeedbackListResponseDto {
  @ApiProperty({ type: [FeedbackResponseDto] }) items!: FeedbackResponseDto[]
  @ApiProperty() total!: number
}
