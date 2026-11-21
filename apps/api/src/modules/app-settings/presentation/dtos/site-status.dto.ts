import { ApiProperty } from '@nestjs/swagger'

export class SiteMaintenanceDto {
  @ApiProperty() on!: boolean
  @ApiProperty() message!: string
  @ApiProperty({ nullable: true }) until!: string | null
}

export class SiteAnnouncementDto {
  @ApiProperty() id!: string
  @ApiProperty() title!: string
  @ApiProperty() text!: string
  @ApiProperty() image!: string
  @ApiProperty() tryPath!: string
  @ApiProperty({ nullable: true }) until!: string | null
}

export class SiteStatusResponseDto {
  @ApiProperty({ type: SiteMaintenanceDto }) maintenance!: SiteMaintenanceDto
  @ApiProperty({ type: [SiteAnnouncementDto] }) announcements!: SiteAnnouncementDto[]
}
