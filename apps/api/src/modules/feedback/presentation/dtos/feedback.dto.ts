import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

import { Trim } from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'
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

export class SubmitFeedbackDto {
  @ApiProperty({ maxLength: 2000 })
  @Trim(Number.MAX_SAFE_INTEGER)
  @IsString()
  @IsNotEmpty({ message: 'Nhập nội dung góp ý.' })
  @MaxLength(2000, { message: 'Góp ý tối đa 2000 ký tự.' })
  message!: string

  @ApiPropertyOptional({ description: 'Defaults to the signed-in account email' })
  @IsOptional()
  @Trim(255)
  @IsString()
  email?: string

  @ApiPropertyOptional({ description: 'Cut to 500 characters' })
  @IsOptional()
  @Trim(500)
  @IsString()
  page?: string
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
