import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'

import { EXAM_REPOSITORY } from '@/modules/exam/application/ports/exam.repository.port'
import { REPORT_REPOSITORY } from '@/modules/exam/application/ports/report.repository.port'
import {
  examNotFound,
  examRowCacheKey,
} from '@/modules/exam/application/services/exam-query.service'
import { PublishedExam } from '@/modules/exam/domain/aggregates/published-exam.aggregate'
import { ExamRuleError } from '@/modules/exam/domain/errors/exam-rule.error'
import { isDocTooLarge, isOwnerAtLimit } from '@/modules/exam/domain/policies/publish-limits.policy'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  ExamCard,
  ExamRepositoryPort,
} from '@/modules/exam/application/ports/exam.repository.port'
import type { ReportRepositoryPort } from '@/modules/exam/application/ports/report.repository.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type { ExamDoc } from '@workspace/core'

function ruleToHttp(error: ExamRuleError): Error {
  switch (error.violation) {
    case 'not-owner':
      return new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Bạn không có quyền với đề này.',
      })
    case 'removed':
      return new ConflictException({
        code: ErrorCode.EXAM_UNDER_REVIEW,
        message: 'Đề này đã bị gỡ.',
      })
    case 'under-review':
      return new ConflictException({
        code: ErrorCode.EXAM_UNDER_REVIEW,
        message: 'Đề đang được kiểm duyệt nên chưa gỡ được.',
      })
    case 'edit-under-review':
      return new ConflictException({
        code: ErrorCode.EXAM_UNDER_REVIEW,
        message: 'Đề đang được kiểm duyệt, chưa sửa được. Thử lại sau khi có kết quả.',
      })
  }
}

const invalidDoc = () =>
  new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Nội dung đề không hợp lệ.' })

function assertDoc(doc: ExamDoc): void {
  if (typeof doc.id !== 'string' || typeof doc.title !== 'string' || !Array.isArray(doc.blocks)) {
    throw invalidDoc()
  }
  if (isDocTooLarge(doc)) {
    throw new PayloadTooLargeException({
      code: ErrorCode.EXAM_TOO_LARGE,
      message: 'Đề quá lớn (tối đa 2 MB).',
    })
  }
}

@Injectable()
export class ExamPublishService {
  constructor(
    @Inject(EXAM_REPOSITORY) private readonly exams: ExamRepositoryPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  list(ownerId: string, limit: number, offset: number): Promise<ExamCard[]> {
    return this.exams.listByOwner(ownerId, limit, offset)
  }

  count(ownerId: string): Promise<number> {
    return this.exams.countByOwner(ownerId)
  }

  async publish(ownerId: string, doc: ExamDoc, listed: boolean): Promise<PublishedExam> {
    const exam = this.#create(ownerId, doc, listed)
    if (isOwnerAtLimit(await this.exams.countByOwner(ownerId))) {
      throw new ConflictException({
        code: ErrorCode.EXAM_LIMIT,
        message: 'Đã đạt số đề tối đa.',
      })
    }
    await this.exams.save(exam)
    return exam
  }

  /** Keeps the id (so the student link and earlier attempts survive); a missing or removed exam is published anew */
  async replace(
    ownerId: string,
    id: string,
    doc: ExamDoc,
    listed: boolean,
  ): Promise<PublishedExam> {
    assertDoc(doc)
    const existing = await this.exams.findById(id)
    if (!existing || (existing.ownerId === ownerId && existing.isRemoved())) {
      return this.publish(ownerId, doc, listed)
    }
    try {
      existing.replaceContent(ownerId, doc, listed, await this.reports.hasOpen(id))
    } catch (error) {
      throw error instanceof ExamRuleError ? ruleToHttp(error) : error
    }
    await this.exams.save(existing)
    await this.cache.del(examRowCacheKey(id))
    return existing
  }

  async setListed(ownerId: string, id: string, listed: boolean): Promise<void> {
    const exam = await this.#find(id)
    try {
      exam.setListed(ownerId, listed, await this.reports.hasOpen(id))
    } catch (error) {
      throw error instanceof ExamRuleError ? ruleToHttp(error) : error
    }
    await this.exams.save(exam)
    await this.cache.del(examRowCacheKey(id))
  }

  async unpublish(ownerId: string, id: string): Promise<void> {
    const exam = await this.#find(id)
    try {
      exam.assertCanUnpublish(ownerId, await this.reports.hasOpen(id))
    } catch (error) {
      throw error instanceof ExamRuleError ? ruleToHttp(error) : error
    }
    await this.exams.delete(id)
    await this.cache.del(examRowCacheKey(id))
  }

  #create(ownerId: string, doc: ExamDoc, listed: boolean): PublishedExam {
    assertDoc(doc)
    try {
      return PublishedExam.publish(ownerId, doc, listed)
    } catch {
      throw invalidDoc()
    }
  }

  async #find(id: string): Promise<PublishedExam> {
    const exam = await this.exams.findById(id)
    if (!exam) throw examNotFound('Không tìm thấy đề.')
    return exam
  }
}
