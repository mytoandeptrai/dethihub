import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { PaymentOrderService } from '@/modules/billing/application/services/payment-order.service'
import { PaymentSettlementService } from '@/modules/billing/application/services/payment-settlement.service'
import { PricingService } from '@/modules/billing/application/services/pricing.service'
import {
  CreateOrderDto,
  CreatedOrderResponseDto,
  FirstBonusResponseDto,
  OrderResponseDto,
  PricingResponseDto,
  WebhookAckResponseDto,
} from '@/modules/billing/presentation/dtos/billing.dto'
import { CheckMaintenance } from '@/shared-kernel/infrastructure/decorators/check-maintenance.decorator'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { Public } from '@/shared-kernel/infrastructure/decorators/public.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(
    private readonly pricing: PricingService,
    private readonly orders: PaymentOrderService,
    private readonly settlement: PaymentSettlementService,
  ) {}

  @Public()
  @Get('pricing')
  @ApiOperation({ summary: 'Price list for top-ups' })
  @ApiResponse({ status: 200, type: PricingResponseDto })
  async getPricing(): Promise<PricingResponseDto> {
    return PricingResponseDto.from(await this.pricing.get())
  }

  @Post('orders')
  @RateLimit('pay')
  @CheckMaintenance()
  @ApiOperation({ summary: 'Create a top-up order and its payment link' })
  @ApiResponse({ status: 201, type: CreatedOrderResponseDto })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateOrderDto,
  ): Promise<CreatedOrderResponseDto> {
    return this.orders.create(user.id, body.vnd)
  }

  @Get('orders/:orderCode')
  @RateLimit('pay')
  @ApiOperation({ summary: 'Status of your order; a waiting order is checked with PayOS' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderCode', ParseIntPipe) orderCode: number,
  ): Promise<OrderResponseDto> {
    return this.orders.get(user.id, orderCode)
  }

  @Post('orders/:orderCode/cancel')
  @HttpCode(200)
  @RateLimit('pay')
  @ApiOperation({ summary: 'Close your payment window' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  cancelOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderCode', ParseIntPipe) orderCode: number,
  ): Promise<OrderResponseDto> {
    return this.orders.cancel(user.id, orderCode)
  }

  @Get('first-bonus')
  @RateLimit('pay')
  @ApiOperation({ summary: 'Packs whose first-purchase bonus you already earned' })
  @ApiResponse({ status: 200, type: FirstBonusResponseDto })
  async firstBonus(@CurrentUser() user: AuthenticatedUser): Promise<FirstBonusResponseDto> {
    return { bonused: await this.orders.bonusedPacks(user.id) }
  }

  @Public()
  @Post('payos/webhook')
  @HttpCode(200)
  @RateLimit('payos-webhook')
  @ApiBody({ description: 'PayOS payment notification', schema: { type: 'object' } })
  @ApiOperation({ summary: 'PayOS payment notification (signed)' })
  @ApiResponse({ status: 200, type: WebhookAckResponseDto })
  async payosWebhook(@Body() body: Record<string, unknown>): Promise<WebhookAckResponseDto> {
    await this.settlement.handleWebhook(body)
    return { ok: true }
  }
}
