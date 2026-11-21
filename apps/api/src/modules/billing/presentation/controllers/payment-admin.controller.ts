import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { PAYMENT_FILTERS } from '@/modules/billing/application/ports/payment-admin.repository.port'
import { PaymentAdminService } from '@/modules/billing/application/services/payment-admin.service'
import {
  AdminPaymentDto,
  CreditOrderDto,
  PaymentListQueryDto,
  PaymentListResponseDto,
  RevenueDto,
  SyncPaymentResponseDto,
} from '@/modules/billing/presentation/dtos/payment-admin.dto'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { PlatformRoles } from '@/shared-kernel/infrastructure/decorators/platform-roles.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'

import type { PaymentFilter } from '@/modules/billing/application/ports/payment-admin.repository.port'
import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 50

@ApiTags('admin-payments')
@ApiBearerAuth()
@PlatformRoles('admin')
@RateLimit('admin')
@Controller('admin/payments')
export class PaymentAdminController {
  constructor(private readonly admin: PaymentAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Top-up orders with revenue totals' })
  @ApiResponse({ status: 200, type: PaymentListResponseDto })
  async list(@Query() query: PaymentListQueryDto): Promise<PaymentListResponseDto> {
    const filter = PAYMENT_FILTERS.includes(query.filter as PaymentFilter)
      ? (query.filter as PaymentFilter)
      : 'all'
    const [{ items, total }, revenue] = await Promise.all([
      this.admin.list(
        filter,
        query.orderCode ?? null,
        query.page ?? 1,
        Math.min(query.perPage ?? DEFAULT_PER_PAGE, MAX_PER_PAGE),
      ),
      this.admin.revenue(),
    ])
    return {
      items: items.map((item) => AdminPaymentDto.from(item)),
      total,
      configured: this.admin.configured,
      revenue: RevenueDto.from(revenue),
    }
  }

  @Post(':orderCode/sync')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ask PayOS about an unsettled order and act on the answer' })
  @ApiResponse({ status: 200, type: SyncPaymentResponseDto })
  sync(@Param('orderCode', ParseIntPipe) orderCode: number): Promise<SyncPaymentResponseDto> {
    return this.admin.sync(orderCode)
  }

  @Post(':orderCode/credit')
  @HttpCode(204)
  @ApiOperation({ summary: 'Credit an order by hand (a note is required)' })
  async credit(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderCode', ParseIntPipe) orderCode: number,
    @Body() body: CreditOrderDto,
  ): Promise<void> {
    await this.admin.credit(admin.id, orderCode, body.note)
  }
}
