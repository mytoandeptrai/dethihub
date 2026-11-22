import { ApiProperty } from '@nestjs/swagger'
import { IsObject } from 'class-validator'

export class SetSettingDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  value!: Record<string, unknown>
}

export class SettingsResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true }) maintenance!: unknown
  @ApiProperty({ type: 'object', additionalProperties: true }) announcements!: unknown
  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true }) pricing!: unknown
  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true }) aiWelcome!: unknown
}

export class SettingValueResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true }) value!: Record<string, unknown>
}
