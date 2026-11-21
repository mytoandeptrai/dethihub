import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, ValidateIf } from 'class-validator'

import { Trim } from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'
import { AdminPageQueryDto } from '@/shared-kernel/infrastructure/dtos/admin-page-query.dto'

import type {
  DocumentWithOwner,
  TopUserView,
  UserStorageView,
} from '@/modules/storage/application/services/storage-admin.service'

export class SetStorageDto {
  @ApiProperty({
    nullable: true,
    description: 'null removes the override; else 1 MiB..1 GiB in bytes',
  })
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  maxBytes!: number | null

  @ApiPropertyOptional()
  @IsOptional()
  @Trim(300)
  @IsString()
  note?: string
}

export class AdminDocumentListQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ description: 'Name contains, max 100 chars' })
  @IsOptional()
  @Trim(100)
  @IsString()
  q?: string
}

class StorageOverrideDto {
  @ApiProperty() maxBytes!: number
  @ApiProperty() note!: string
}

export class UserStorageResponseDto {
  @ApiProperty({ type: StorageOverrideDto, nullable: true }) override!: StorageOverrideDto | null
  @ApiProperty() defaultBytes!: number
  @ApiProperty() used!: number

  static from(view: UserStorageView): UserStorageResponseDto {
    return {
      override: view.override
        ? { maxBytes: view.override.maxBytes, note: view.override.note ?? '' }
        : null,
      defaultBytes: view.defaultBytes,
      used: view.used,
    }
  }
}

export class AdminDocumentDto {
  @ApiProperty() id!: string
  @ApiProperty() ownerId!: string
  @ApiProperty({ nullable: true }) ownerEmail!: string | null
  @ApiProperty() name!: string
  @ApiProperty() mime!: string
  @ApiProperty() size!: number
  @ApiProperty() url!: string
  @ApiProperty({ nullable: true }) subject!: string | null
  @ApiProperty() createdAt!: string

  static from({ document, ownerEmail }: DocumentWithOwner): AdminDocumentDto {
    return {
      id: document.id,
      ownerId: document.ownerId,
      ownerEmail,
      name: document.name,
      mime: document.mime,
      size: document.size,
      url: document.url,
      subject: document.subject,
      createdAt: document.createdAt.toISOString(),
    }
  }
}

export class TopStorageUserDto {
  @ApiProperty() ownerId!: string
  @ApiProperty() email!: string
  @ApiProperty() name!: string
  @ApiProperty() totalSize!: number
  @ApiProperty() docCount!: number

  static from(user: TopUserView): TopStorageUserDto {
    return user
  }
}

export class AdminDocumentListResponseDto {
  @ApiProperty({ type: [AdminDocumentDto] }) items!: AdminDocumentDto[]
  @ApiProperty({ type: [TopStorageUserDto] }) topUsers!: TopStorageUserDto[]
  @ApiProperty() total!: number
}

export class DeleteDocumentResponseDto {
  @ApiProperty() fileRemoved!: boolean
}
