import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  IMAGE_GENERATOR,
  ImageProviderNotConfiguredError,
} from '@/modules/media/application/ports/image-generator.port'
import { MediaMeterService } from '@/modules/media/application/services/media-meter.service'
import {
  imageShortfall,
  normalizeImagePrompt,
} from '@/modules/media/domain/policies/image-request.policy'
import { TOKENS_PER_POINT } from '@/shared-kernel/application/ports/ai-meter.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { Env } from '@/app/config/env.schema'
import type {
  GeneratedImage,
  ImageGeneratorPort,
  ProducedImage,
} from '@/modules/media/application/ports/image-generator.port'
import type { AiQuotaView } from '@/shared-kernel/application/ports/ai-meter.port'

export interface DrawnImage extends GeneratedImage {
  quota: AiQuotaView | null
}

@Injectable()
export class ImageGenerationService {
  readonly #logger = new Logger(ImageGenerationService.name)

  constructor(
    @Inject(IMAGE_GENERATOR) private readonly generator: ImageGeneratorPort,
    private readonly meter: MediaMeterService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Charges AI_IMAGE_POINTS only after a picture came back */
  async draw(userId: string, rawPrompt: unknown): Promise<DrawnImage> {
    const prompt = normalizeImagePrompt(rawPrompt)
    if (!prompt) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Thiếu mô tả ảnh.' })
    }
    const tokens = this.config.get('AI_IMAGE_POINTS', { infer: true }) * TOKENS_PER_POINT
    const hold = await this.meter.hold(userId, tokens, imageShortfall)

    const startedAt = Date.now()
    let image: ProducedImage
    try {
      image = await this.generator.generate(prompt)
    } catch (error) {
      await hold.release()
      if (error instanceof ImageProviderNotConfiguredError) {
        throw new ServiceUnavailableException({
          code: ErrorCode.MEDIA_UNAVAILABLE,
          message: 'Chưa cấu hình dịch vụ tạo ảnh.',
        })
      }
      this.#logger.warn(`image generation failed: ${(error as Error).message}`)
      throw new BadGatewayException({
        code: ErrorCode.MEDIA_UNAVAILABLE,
        message: 'Không tạo được ảnh, thử lại sau.',
      })
    }
    const [quota] = await Promise.all([
      hold.settle(tokens),
      this.meter.record(userId, {
        provider: 'image',
        model: image.model,
        kind: 'image',
        billed: tokens,
        ms: Date.now() - startedAt,
      }),
    ])
    return { buffer: image.buffer, mime: image.mime, quota }
  }
}
