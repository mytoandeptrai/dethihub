import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator'

import type {
  BankRow,
  BankStatus,
} from '@/modules/bank/application/ports/bank-question.repository.port'
import type { PublicOverride } from '@/modules/bank/application/services/bank.service'

export class SaveBankQuestionDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  entry!: Record<string, unknown>

  @ApiPropertyOptional({
    enum: ['published', 'hidden'],
    description: "Anything but 'hidden' publishes",
  })
  @IsOptional()
  @IsString()
  status?: string
}

export class HideBankQuestionDto {
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Stored when the question has no override row yet',
  })
  @IsOptional()
  @IsObject()
  entry?: Record<string, unknown>
}

export class BankVisionDto {
  @ApiProperty({ type: [String], description: '1..4 jpeg/png/webp data URLs' })
  @IsArray()
  images!: unknown[]
}

export class BankVisionResponseDto {
  @ApiProperty() content!: string
  @ApiProperty() model!: string
  @ApiProperty() tokens!: number
}

export class BankSavedResponseDto {
  @ApiProperty() id!: string
  @ApiProperty({ type: 'object', additionalProperties: true }) entry!: Record<string, unknown>
}

export class PublicOverrideDto {
  @ApiProperty() id!: string
  @ApiProperty({ enum: ['published', 'hidden'] }) status!: BankStatus
  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true }) data!: unknown

  static from(override: PublicOverride): PublicOverrideDto {
    return { id: override.id, status: override.status, data: override.data }
  }
}

export class AdminOverrideDto extends PublicOverrideDto {
  @ApiProperty({ nullable: true }) updatedAt!: string | null
  @ApiProperty({ nullable: true }) updatedBy!: string | null

  static fromRow(row: BankRow): AdminOverrideDto {
    return {
      id: row.id,
      status: row.status,
      data: row.data,
      updatedAt: row.updatedAt?.toISOString() ?? null,
      updatedBy: row.updatedBy,
    }
  }
}
