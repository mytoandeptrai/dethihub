import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  EXAM_ADMIN_REPOSITORY,
  MODERATED_STATUSES,
} from '@/modules/exam/application/ports/exam-admin.repository.port'
import { examRowCacheKey } from '@/modules/exam/application/services/exam-query.service'
import { ADMIN_AUDIT } from '@/shared-kernel/application/ports/admin-audit.port'
import { CACHE_PORT } from '@/shared-kernel/application/ports/cache.port'
import { USER_PROFILE_LOOKUP } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  AdminExamDetail,
  AdminExamRow,
  AdminReportRow,
  ExamAdminRepositoryPort,
  ExamFilter,
  ExamScope,
  ModeratedStatus,
} from '@/modules/exam/application/ports/exam-admin.repository.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'
import type { CachePort } from '@/shared-kernel/application/ports/cache.port'
import type { UserProfileLookupPort } from '@/shared-kernel/application/ports/user-profile-lookup.port'
import type { PlatformRole } from '@/shared-kernel/domain/value-objects/platform-role.vo'

const NOT_FOUND = 'Không tìm thấy đề thi.'
const REPORT_STATUSES = new Set(['resolved', 'dismissed'])

export interface Caller {
  id: string
  role: PlatformRole
}

export interface ExamWithOwner {
  exam: AdminExamRow
  ownerEmail: string | null
}

export interface ReportWithReporter {
  report: AdminReportRow
  reporterEmail: string | null
}

const scopeOf = (caller: Caller): ExamScope => ({ listedOnly: caller.role !== 'admin' })

const bad = (message: string) => new BadRequestException({ code: ErrorCode.BAD_REQUEST, message })
const forbidden = (message: string) =>
  new ForbiddenException({ code: ErrorCode.FORBIDDEN, message })

@Injectable()
export class ExamAdminService {
  constructor(
    @Inject(EXAM_ADMIN_REPOSITORY) private readonly repository: ExamAdminRepositoryPort,
    @Inject(ADMIN_AUDIT) private readonly audit: AdminAuditPort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    @Inject(USER_PROFILE_LOOKUP) private readonly users: UserProfileLookupPort,
  ) {}

  async list(
    caller: Caller,
    filter: ExamFilter,
    page: number,
    perPage: number,
  ): Promise<{ items: ExamWithOwner[]; total: number }> {
    const { rows, total } = await this.repository.list(scopeOf(caller), filter, page, perPage)
    const contacts = await this.users
      .getContacts(rows.flatMap((row) => (row.ownerId ? [row.ownerId] : [])))
      .catch(() => new Map())
    const items = rows.map((exam) => ({
      exam,
      ownerEmail: (exam.ownerId && contacts.get(exam.ownerId)?.email) || null,
    }))
    return { items, total }
  }

  async get(caller: Caller, id: string): Promise<AdminExamDetail> {
    const exam = await this.repository.find(scopeOf(caller), id)
    if (!exam) throw new NotFoundException({ code: ErrorCode.EXAM_NOT_FOUND, message: NOT_FOUND })
    return exam
  }

  async setStatus(caller: Caller, id: string, status: string, rawReason: string): Promise<void> {
    if (!MODERATED_STATUSES.includes(status as ModeratedStatus)) {
      throw bad('Trạng thái đề không hợp lệ.')
    }
    const reason = rawReason.trim().slice(0, 500)
    if (status === 'removed' && !reason) throw bad('Cần có lý do khi gỡ đề thi.')

    const current = await this.get(caller, id)
    if (caller.role !== 'admin') {
      // Moderators may not review their own exams, and a removed exam is for admins only
      if (current.ownerId && current.ownerId === caller.id) {
        throw forbidden('Không kiểm duyệt đề của chính bạn.')
      }
      if (current.status === 'removed') {
        throw forbidden('Đề đã bị gỡ, chỉ admin được khôi phục hoặc sửa.')
      }
    }

    const changed = await this.repository.changeStatus(id, {
      from: current.status,
      status: status as ModeratedStatus,
      reason: status === 'removed' ? reason : null,
      moderatorId: caller.id,
    })
    if (!changed) {
      throw new ConflictException({
        code: ErrorCode.STATE_CONFLICT,
        message: 'Trạng thái đề vừa thay đổi, tải lại rồi thử lại.',
      })
    }
    await this.cache.del(examRowCacheKey(id))
    // The columns on the exam row get overwritten, so the previous decision lives on in the audit trail
    await this.audit.record(caller.id, 'content.exams.setStatus', id, {
      status,
      reason: status === 'removed' ? reason : undefined,
      from: current.status,
      prevReason: current.removedReason ?? undefined,
      prevModeratedBy: current.moderatedBy ?? undefined,
    })
  }

  async delete(adminId: string, id: string): Promise<void> {
    const title = await this.repository.delete(id)
    if (title === null) {
      throw new NotFoundException({ code: ErrorCode.EXAM_NOT_FOUND, message: NOT_FOUND })
    }
    await this.cache.del(examRowCacheKey(id))
    await this.audit.record(adminId, 'content.exams.delete', id, { title })
  }

  async listReports(
    caller: Caller,
    status: string,
    page: number,
    perPage: number,
  ): Promise<{ items: ReportWithReporter[]; total: number }> {
    const { rows, total } = await this.repository.listReports(
      scopeOf(caller),
      status,
      page,
      perPage,
    )
    const contacts = await this.users
      .getContacts(rows.flatMap((row) => (row.reporterId ? [row.reporterId] : [])))
      .catch(() => new Map())
    const items = rows.map((report) => ({
      report,
      reporterEmail: (report.reporterId && contacts.get(report.reporterId)?.email) || null,
    }))
    return { items, total }
  }

  async resolveReport(caller: Caller, reportId: bigint, status: string): Promise<void> {
    if (!REPORT_STATUSES.has(status)) throw bad('Trạng thái xử lý không hợp lệ.')
    const target = await this.repository.findReportTarget(scopeOf(caller), reportId)
    if (!target)
      throw new NotFoundException({
        code: ErrorCode.EXAM_NOT_FOUND,
        message: 'Không tìm thấy báo cáo.',
      })
    if (caller.role !== 'admin' && target.examOwnerId === caller.id) {
      throw forbidden('Không xử lý báo cáo đề của chính bạn.')
    }
    // The exam id is pinned into the write: a report moved to another exam meanwhile updates nothing
    const changed = await this.repository.resolveReport(reportId, target.examId, status, caller.id)
    if (!changed) {
      throw new ConflictException({
        code: ErrorCode.STATE_CONFLICT,
        message: 'Báo cáo vừa thay đổi, tải lại rồi thử lại.',
      })
    }
    await this.audit.record(caller.id, 'content.reports.resolve', target.id, {
      status,
      examId: target.examId,
    })
  }
}
