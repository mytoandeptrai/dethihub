import { BadGatewayException, BadRequestException, Inject, Injectable } from '@nestjs/common'
import { fileTypeFromBuffer } from 'file-type'

import { ImageGenerationService } from '@/modules/media/application/services/image-generation.service'
import {
  figureKey,
  figurePrompt,
  figureSlug,
  figureUrl,
} from '@/modules/media/domain/policies/figure-slug.policy'
import { OBJECT_STORAGE } from '@/shared-kernel/application/ports/object-storage.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { DrawnImage } from '@/modules/media/application/services/image-generation.service'
import type { AiQuotaView } from '@/shared-kernel/application/ports/ai-meter.port'
import type { ObjectStoragePort } from '@/shared-kernel/application/ports/object-storage.port'

export interface FigureResult {
  url: string
  cached: boolean
  quota?: AiQuotaView | null
}

@Injectable()
export class FigureService {
  /** One drawing per slug at a time; a second caller waits for the first */
  readonly #drawing = new Map<string, Promise<FigureResult>>()

  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    private readonly images: ImageGenerationService,
  ) {}

  async getOrDraw(userId: string, name: unknown): Promise<FigureResult> {
    const slug = figureSlug(name)
    if (!slug) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Tên đồ vật (tiếng Anh) không hợp lệ.',
      })
    }
    if (await this.#exists(slug)) return { url: figureUrl(slug), cached: true }

    const running = this.#drawing.get(slug)
    if (running) return { ...(await running), cached: true, quota: undefined }

    const job = this.#draw(userId, slug).finally(() => this.#drawing.delete(slug))
    this.#drawing.set(slug, job)
    return job
  }

  async #exists(slug: string): Promise<boolean> {
    try {
      return await this.storage.exists(figureKey(slug))
    } catch {
      this.#storeFailed()
    }
  }

  async #draw(userId: string, slug: string): Promise<FigureResult> {
    const drawn: DrawnImage = await this.images.draw(userId, figurePrompt(slug))
    if ((await fileTypeFromBuffer(drawn.buffer))?.mime !== 'image/png') {
      throw new BadGatewayException({
        code: ErrorCode.MEDIA_UNAVAILABLE,
        message: 'Không tạo được ảnh, thử lại sau.',
      })
    }
    try {
      await this.storage.put(figureKey(slug), drawn.buffer, 'image/png')
    } catch {
      this.#storeFailed()
    }
    return { url: figureUrl(slug), cached: false, quota: drawn.quota }
  }

  #storeFailed(): never {
    throw new BadGatewayException({
      code: ErrorCode.STORAGE_UNAVAILABLE,
      message: 'Kho hình đang lỗi, thử lại sau.',
    })
  }
}
