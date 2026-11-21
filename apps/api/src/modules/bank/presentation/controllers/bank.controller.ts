import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { BankService } from '@/modules/bank/application/services/bank.service'
import { PublicOverrideDto } from '@/modules/bank/presentation/dtos/bank.dto'
import { Public } from '@/shared-kernel/infrastructure/decorators/public.decorator'

@ApiTags('bank')
@Controller('bank')
export class BankController {
  constructor(private readonly bank: BankService) {}

  @Get('overrides')
  @Public()
  @ApiOperation({ summary: 'Question bank overrides; hidden questions carry no data' })
  @ApiResponse({ status: 200, type: [PublicOverrideDto] })
  async overrides(): Promise<PublicOverrideDto[]> {
    return (await this.bank.listPublic()).map((o) => PublicOverrideDto.from(o))
  }
}
