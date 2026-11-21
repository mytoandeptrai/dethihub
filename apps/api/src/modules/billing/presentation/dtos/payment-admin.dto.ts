import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

import { Trim } from '@/shared-kernel/infrastructure/decorators/input-transform.decorator'
import { AdminPageQueryDto } from '@/shared-kernel/infrastructure/dtos/admin-page-query.dto'

import type {
  RevenueView,
  PaymentView,
} from '@/modules/billing/application/services/payment-admin.service'

export class PaymentListQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'pending', 'paid', 'closed', 'attention'] })
  @IsOptional()
  @Trim(20)
  @IsString()
  filter?: string

  @ApiPropertyOptional({ description: 'Exact order code' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  orderCode?: number
}

export class CreditOrderDto {
  @ApiProperty({ description: 'Why the order is credited by hand (e.g. the bank transaction id)' })
  @Trim(100)
  @IsString()
  note!: string
}

export class AdminPaymentDto {
  @ApiProperty() orderCode!: number
  @ApiProperty() userId!: string
  @ApiProperty({ nullable: true }) email!: string | null
  @ApiProperty() vnd!: number
  @ApiProperty() points!: number
  @ApiProperty() bonusPoints!: number
  @ApiProperty({ enum: ['pending', 'paid', 'cancelled', 'expired', 'failed'] }) status!: string
  @ApiProperty({ nullable: true }) reference!: string | null
  @ApiProperty() createdAt!: string
  @ApiProperty({ nullable: true }) paidAt!: string | null
  @ApiProperty() attention!: boolean

  static from({ payment, email, attention }: PaymentView): AdminPaymentDto {
    return {
      orderCode: payment.orderCode,
      userId: payment.userId,
      email,
      vnd: payment.vnd,
      points: payment.points,
      bonusPoints: payment.bonusPoints,
      status: payment.status,
      reference: payment.reference,
      createdAt: payment.createdAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      attention,
    }
  }
}

export class RevenueSlotDto {
  @ApiProperty() vnd!: number
  @ApiProperty() count!: number
}

export class MonthlyRevenueDto extends RevenueSlotDto {
  @ApiProperty({ example: '2026-11' }) month!: string
}

export class RevenueDto {
  @ApiProperty({ type: RevenueSlotDto }) day!: RevenueSlotDto
  @ApiProperty({ type: RevenueSlotDto }) prevDay!: RevenueSlotDto
  @ApiProperty({ type: RevenueSlotDto }) week!: RevenueSlotDto
  @ApiProperty({ type: RevenueSlotDto }) prevWeek!: RevenueSlotDto
  @ApiProperty({ type: RevenueSlotDto }) month!: RevenueSlotDto
  @ApiProperty({ type: RevenueSlotDto }) prevMonth!: RevenueSlotDto
  @ApiProperty({ type: RevenueSlotDto }) all!: RevenueSlotDto
  @ApiProperty({ type: [MonthlyRevenueDto] }) months!: MonthlyRevenueDto[]

  static from(view: RevenueView): RevenueDto {
    return view
  }
}

export class PaymentListResponseDto {
  @ApiProperty({ type: [AdminPaymentDto] }) items!: AdminPaymentDto[]
  @ApiProperty() total!: number
  @ApiProperty() configured!: boolean
  @ApiProperty({ type: RevenueDto }) revenue!: RevenueDto
}

export class SyncPaymentResponseDto {
  @ApiProperty({
    nullable: true,
    description: 'Status PayOS reported; null when it could not answer',
  })
  payos!: string | null

  @ApiProperty() status!: string
}
