import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Max, Min } from 'class-validator'

import type { PricingConfig } from '@workspace/core'

export class CreateOrderDto {
  @ApiProperty({ description: 'Amount in VND; the allowed range comes from the price list' })
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  vnd!: number
}

export class PricingPackDto {
  @ApiProperty() vnd!: number
  @ApiProperty() bonus!: number
}

export class PricingResponseDto {
  @ApiProperty() pointsPer1000!: number
  @ApiProperty() minVnd!: number
  @ApiProperty() maxVnd!: number
  @ApiProperty({ type: [PricingPackDto] }) packs!: PricingPackDto[]
  @ApiProperty() defaultVnd!: number

  static from(config: PricingConfig): PricingResponseDto {
    const dto = new PricingResponseDto()
    dto.pointsPer1000 = config.pointsPer1000
    dto.minVnd = config.minVnd
    dto.maxVnd = config.maxVnd
    dto.packs = config.packs.map(({ vnd, bonus }) => ({ vnd, bonus }))
    dto.defaultVnd = config.defaultVnd
    return dto
  }
}

export class CreatedOrderResponseDto {
  @ApiProperty() orderCode!: number
  @ApiProperty() checkoutUrl!: string
  @ApiProperty() points!: number
  @ApiProperty() vnd!: number
  @ApiProperty({ description: 'VietQR string to draw the QR code from' }) qrCode!: string
  @ApiProperty() bin!: string
  @ApiProperty() accountNumber!: string
  @ApiProperty() accountName!: string
  @ApiProperty({ description: 'Transfer content the payer must use exactly' }) description!: string
  @ApiProperty({ description: 'Unix seconds when the payment link expires' }) expiresAt!: number
}

export class OrderResponseDto {
  @ApiProperty() orderCode!: number
  @ApiProperty({ enum: ['pending', 'paid', 'cancelled', 'expired', 'failed'] }) status!: string
  @ApiProperty() vnd!: number
  @ApiProperty() points!: number
}

export class FirstBonusResponseDto {
  @ApiProperty({ type: [Number], description: 'Packs (VND) whose first-purchase bonus was earned' })
  bonused!: number[]
}

export class WebhookAckResponseDto {
  @ApiProperty() ok!: boolean
}
