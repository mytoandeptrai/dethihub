import { Injectable } from '@nestjs/common'

import { QuotaService } from '@/modules/ai/application/services/quota.service'
import { quotaMessage, remainingTokens, TOKENS_PER_POINT } from '@/modules/ai/domain/quota'

import type {
  AiHold,
  AiHoldDenied,
  AiMeterPort,
} from '@/shared-kernel/application/ports/ai-meter.port'

const points = (tokens: number): string =>
  Math.max(0, tokens).toLocaleString('vi-VN', { maximumFractionDigits: 0 })

@Injectable()
export class AiMeterAdapter implements AiMeterPort {
  constructor(private readonly quotas: QuotaService) {}

  async hold(
    userId: string,
    tokens: number,
    shortfall: (neededPoints: string, leftPoints: string) => string,
  ): Promise<AiHold | AiHoldDenied> {
    const quota = await this.quotas.readQuota(userId)
    if (!quota) {
      return { quota: null, settle: () => Promise.resolve(null), release: () => Promise.resolve() }
    }

    const remaining = remainingTokens(quota)
    if (remaining < tokens) {
      const message =
        remaining >= TOKENS_PER_POINT
          ? shortfall(
              points(Math.ceil(tokens / TOKENS_PER_POINT)),
              points(Math.floor(remaining / TOKENS_PER_POINT)),
            )
          : quotaMessage(quota)
      return { denied: true, busy: false, message, quota }
    }

    const release = await this.quotas.reserve(userId, quota, tokens)
    if (!release) {
      return {
        denied: true,
        busy: true,
        message: 'Đang có nhiều yêu cầu AI chạy cùng lúc, vui lòng thử lại sau ít giây.',
        quota,
      }
    }
    return {
      quota,
      release,
      settle: async (used) => {
        try {
          return await this.quotas.addUsage(userId, used, quota)
        } finally {
          await release()
        }
      },
    }
  }
}
