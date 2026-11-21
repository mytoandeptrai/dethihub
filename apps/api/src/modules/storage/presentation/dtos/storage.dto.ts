import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional } from 'class-validator'

import { IsStringField, IsUUIDField } from '@/shared-kernel/infrastructure/decorators/validators'

import type {
  KindUsage,
  StorageUsage,
  UserDocumentRecord,
} from '@/modules/storage/application/ports/user-document.repository.port'

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value

export class UploadFileBodyDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: unknown
}

export class UploadDocumentBodyDto extends UploadFileBodyDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @Transform(trimmed)
  @IsStringField()
  name?: string

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @Transform(trimmed)
  @IsStringField()
  subject?: string
}

export class DocumentParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUIDField()
  id!: string
}

export class UploadImageResponseDto {
  @ApiProperty({ example: '/api/files/img/0123456789abcdef0123456789abcdef01234567.png' })
  url!: string
}

export class DocumentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty() mime!: string
  @ApiProperty({ description: 'Bytes' }) size!: number
  @ApiProperty() url!: string
  @ApiProperty({ nullable: true, type: String }) subject!: string | null
  @ApiProperty({ format: 'date-time' }) createdAt!: string

  static from(record: UserDocumentRecord): DocumentResponseDto {
    const dto = new DocumentResponseDto()
    dto.id = record.id
    dto.name = record.name
    dto.mime = record.mime
    dto.size = record.size
    dto.url = record.url
    dto.subject = record.subject
    dto.createdAt = record.createdAt.toISOString()
    return dto
  }
}

export class KindUsageDto implements KindUsage {
  @ApiProperty() count!: number
  @ApiProperty({ description: 'Bytes' }) bytes!: number
  @ApiProperty({ nullable: true, type: Number }) limit!: number | null
}

export class StorageUsageResponseDto {
  @ApiProperty({ description: 'Bytes used (items + documents; images are counted separately)' })
  used!: number

  @ApiProperty({ description: 'Bytes allowed' })
  max!: number

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/KindUsageDto' },
  })
  kinds!: Record<string, KindUsageDto>

  static from(usage: StorageUsage): StorageUsageResponseDto {
    const dto = new StorageUsageResponseDto()
    dto.used = usage.used
    dto.max = usage.max
    dto.kinds = usage.kinds
    return dto
  }
}
