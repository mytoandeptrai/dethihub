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

export class SiteFeaturesDto {
  @ApiProperty() word!: boolean
  @ApiProperty() slide!: boolean
  @ApiProperty() board!: boolean
  @ApiProperty() online!: boolean
}

export class SiteStatusResponseDto {
  @ApiProperty({ type: SiteFeaturesDto }) features!: SiteFeaturesDto
  @ApiProperty({ type: SiteMaintenanceDto }) maintenance!: SiteMaintenanceDto
  @ApiProperty({ type: [SiteAnnouncementDto] }) announcements!: SiteAnnouncementDto[]
}
