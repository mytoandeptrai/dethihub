import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

import { Trim } from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'
import { AdminPageQueryDto } from '@/shared-kernel/infrastructure/dtos/admin-page-query.dto'

import type { AuditRow } from '@/modules/access-control/application/ports/admin-user.repository.port'
import type { AdminUserView } from '@/modules/access-control/application/services/admin-user.service'

export class AdminUserListQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ description: 'Matches email or display name within the page, max 100 chars' })
  @IsOptional()
  @Trim(100)
  @IsString()
  q?: string
}

export class AdminAuditQueryDto extends AdminPageQueryDto {}

export class BanUserDto {
  @ApiPropertyOptional({ description: 'Ban length in hours; omitted = permanent' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(876_000)
  hours?: number

  @ApiPropertyOptional()
  @IsOptional()
  @Trim(200)
  @IsString()
  reason?: string
}

export class DeleteUserDto {
  @ApiProperty({ description: 'Must match the account email (case-insensitive)' })
  @Trim(200)
  @IsString()
  confirmEmail!: string
}

export class AdminUserResponseDto {
  @ApiProperty() id!: string
  @ApiProperty({ nullable: true }) email!: string | null
  @ApiProperty({ nullable: true }) displayName!: string | null
  @ApiProperty({ nullable: true }) avatarUrl!: string | null
  @ApiProperty() createdAt!: string
  @ApiProperty({ nullable: true }) lastSignInAt!: string | null
  @ApiProperty({ nullable: true }) bannedUntil!: string | null
  @ApiProperty() docs!: number
  @ApiProperty() decks!: number
  @ApiProperty() tokensThisMonth!: number
  @ApiProperty({ nullable: true }) role!: string | null
  @ApiProperty({ nullable: true }) strikes!: number | null
  @ApiProperty({ nullable: true }) lockedUntil!: string | null
  @ApiProperty({ nullable: true }) lastAction!: string | null
  @ApiProperty() online!: boolean

  static from({ user, activity }: AdminUserView): AdminUserResponseDto {
    return {
      ...user,
      docs: activity?.docs ?? 0,
      decks: activity?.decks ?? 0,
      tokensThisMonth: activity?.tokensThisMonth ?? 0,
      role: activity?.role ?? null,
      strikes: activity?.strikes ?? null,
      lockedUntil: activity?.lockedUntil?.toISOString() ?? null,
      lastAction: activity?.lastAction ?? null,
      online: activity?.online ?? false,
    }
  }
}

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto] }) items!: AdminUserResponseDto[]
  @ApiProperty() total!: number
}

export class AuditRowResponseDto {
  @ApiProperty() id!: string
  @ApiProperty({ nullable: true }) adminId!: string | null
  @ApiProperty() action!: string
  @ApiProperty({ nullable: true }) target!: string | null
  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true }) detail!: unknown
  @ApiProperty() createdAt!: string

  static from(row: AuditRow): AuditRowResponseDto {
    return { ...row, createdAt: row.createdAt.toISOString() }
  }
}

export class AuditListResponseDto {
  @ApiProperty({ type: [AuditRowResponseDto] }) items!: AuditRowResponseDto[]
  @ApiProperty() total!: number
}
