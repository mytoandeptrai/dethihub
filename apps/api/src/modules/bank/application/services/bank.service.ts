import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common'

import { BANK_QUESTION_REPOSITORY } from '@/modules/bank/application/ports/bank-question.repository.port'
import {
  BankValidationError,
  parseBankImages,
  parseQuestion,
} from '@/modules/bank/domain/policies/bank-question.policy'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'
import { VISION_READER } from '@/shared-kernel/application/ports/vision-reader.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  BankQuestionRepositoryPort,
  BankRow,
  BankStatus,
} from '@/modules/bank/application/ports/bank-question.repository.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type {
  VisionReaderPort,
  VisionResult,
} from '@/shared-kernel/application/ports/vision-reader.port'

const PUBLIC_CACHE_KEY = 'bank:overrides'
const PUBLIC_CACHE_TTL_SECONDS = 60

export interface PublicOverride {
  id: string
  status: BankStatus
  /** Null for hidden questions: the answer key must not leak through a hidden row */
  data: unknown
}

@Injectable()
export class BankService {
  readonly #logger = new Logger(BankService.name)

  constructor(
    @Inject(BANK_QUESTION_REPOSITORY) private readonly repository: BankQuestionRepositoryPort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    @Inject(VISION_READER) private readonly reader: VisionReaderPort,
  ) {}

  async listPublic(): Promise<PublicOverride[]> {
    const cached = await this.cache.get<PublicOverride[]>(PUBLIC_CACHE_KEY)
    if (cached) return cached
    const rows = await this.repository.list()
    const overrides = rows.map((row) => ({
      id: row.id,
      status: row.status,
      data: row.status === 'hidden' ? null : row.data,
    }))
    await this.cache.set(PUBLIC_CACHE_KEY, overrides, PUBLIC_CACHE_TTL_SECONDS)
    return overrides
  }

  listAdmin(): Promise<BankRow[]> {
    return this.repository.list()
  }

  /** `id` null = a new question, which gets a server-made `db-` id */
  async save(
    adminId: string,
    id: string | null,
    entry: Record<string, unknown>,
    status: BankStatus,
  ): Promise<{ id: string; entry: Record<string, unknown> }> {
    const isNew = id === null
    const questionId = id ?? `db-${crypto.randomUUID()}`
    let clean: Record<string, unknown>
    try {
      clean = parseQuestion(entry, questionId)
    } catch (error) {
      throw this.#invalid(error)
    }
    await this.repository.save(questionId, clean, status, adminId)
    await this.#changed()
    await this.audit.record(adminId, 'bank.save', questionId, {
      subject: clean['subject'],
      type: clean['type'],
      isNew,
    })
    return { id: questionId, entry: clean }
  }

  async hide(adminId: string, id: string, entry: Record<string, unknown> | undefined) {
    await this.repository.hide(id, entry ?? { id }, adminId)
    await this.#changed()
    await this.audit.record(adminId, 'bank.hide', id)
  }

  async unhide(adminId: string, id: string) {
    await this.repository.unhide(id, adminId)
    await this.#changed()
    await this.audit.record(adminId, 'bank.unhide', id)
  }

  async revert(adminId: string, id: string) {
    await this.repository.delete(id)
    await this.#changed()
    await this.audit.record(adminId, 'bank.revert', id)
  }

  /** Reads exam page images into question JSON; free for the admin, so no points are held */
  async readImages(adminId: string, images: unknown): Promise<VisionResult> {
    let pages: string[]
    try {
      pages = parseBankImages(images)
    } catch (error) {
      throw this.#invalid(error)
    }
    try {
      return await this.reader.read(adminId, pages, 'questions')
    } catch (error) {
      this.#logger.warn(`bank vision failed: ${(error as Error).message}`)
      throw new BadGatewayException({
        code: ErrorCode.MEDIA_UNAVAILABLE,
        message: (error as Error).message,
      })
    }
  }

  async #changed(): Promise<void> {
    await this.cache.del(PUBLIC_CACHE_KEY)
  }

  #invalid(error: unknown): unknown {
    return error instanceof BankValidationError
      ? new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: error.message })
      : error
  }
}
