import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common'

import { MediaMeterService } from '@/modules/media/application/services/media-meter.service'
import {
  parseVisionImages,
  VISION_RESERVE_TOKENS,
  visionShortfall,
} from '@/modules/media/domain/policies/vision-input.policy'
import { VISION_READER } from '@/shared-kernel/application/ports/vision-reader.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AiQuotaView } from '@/shared-kernel/application/ports/ai-meter.port'
import type { VisionReaderPort } from '@/shared-kernel/application/ports/vision-reader.port'

@Injectable()
export class SourceVisionService {
  readonly #logger = new Logger(SourceVisionService.name)

  constructor(
    @Inject(VISION_READER) private readonly reader: VisionReaderPort,
    private readonly meter: MediaMeterService,
  ) {}

  /** Holds a high estimate, then charges the tokens the reader really used */
  async readPages(
    userId: string,
    images: unknown,
  ): Promise<{ text: string; quota: AiQuotaView | null }> {
    const input = parseVisionImages(images)
    if ('error' in input) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: input.error })
    }
    const hold = await this.meter.hold(userId, VISION_RESERVE_TOKENS, visionShortfall)
    try {
      const result = await this.reader.read(userId, input.pages, 'text')
      return { text: result.content, quota: await hold.settle(result.tokens) }
    } catch (error) {
      await hold.release()
      this.#logger.warn(`vision read failed: ${(error as Error).message}`)
      throw new BadGatewayException({
        code: ErrorCode.MEDIA_UNAVAILABLE,
        message: 'Không đọc được ảnh. Vui lòng thử lại sau.',
      })
    }
  }
}
