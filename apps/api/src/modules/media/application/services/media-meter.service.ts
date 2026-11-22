import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'

import { AI_METER } from '@/shared-kernel/application/ports/ai-meter.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  AiCallNote,
  AiHold,
  AiMeterPort,
} from '@/shared-kernel/application/ports/ai-meter.port'

/** Holds AI points for one media call; a refusal becomes a 429 */
@Injectable()
export class MediaMeterService {
  constructor(@Inject(AI_METER) private readonly meter: AiMeterPort) {}

  async hold(
    userId: string,
    tokens: number,
    shortfall: (needed: string, left: string) => string,
  ): Promise<AiHold> {
    const hold = await this.meter.hold(userId, tokens, shortfall)
    if (!('denied' in hold)) return hold
    throw new HttpException(
      {
        code: hold.busy ? ErrorCode.QUOTA_BUSY : ErrorCode.QUOTA_EXCEEDED,
        message: hold.message,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    )
  }

  record(userId: string, call: AiCallNote): Promise<void> {
    return this.meter.record(userId, call)
  }
}
