import { ApiProperty } from '@nestjs/swagger'

import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string

  @ApiProperty({ enum: ['moderator', 'admin'], nullable: true })
  role!: PlatformRole | null

  static from(userId: string, role: PlatformRole | null): MeResponseDto {
    return Object.assign(new MeResponseDto(), { userId, role })
  }
}
