export const EXAM_ADMIN_REPOSITORY = Symbol('EXAM_ADMIN_REPOSITORY')

export const MODERATED_STATUSES = ['published', 'hidden', 'removed'] as const

export type ModeratedStatus = (typeof MODERATED_STATUSES)[number]

/** What the caller may touch: moderators only see exams listed in the community */
export interface ExamScope {
  listedOnly: boolean
}

export interface AdminExamRow {
  id: string
  ownerId: string | null
  title: string
  subject: string
  grade: string
  school: string
  createdAt: Date
  questionCount: number
  durationMinutes: number
  totalPoints: number
  preview: string
  listed: boolean
  status: string
  removedReason: string | null
  moderatedBy: string | null
  moderatedAt: Date | null
  missingKeys: number | null
  openReports: number
}

export interface AdminExamDetail extends AdminExamRow {
  doc: unknown
}

export interface ExamFilter {
  q: string
  status: string
  subject: string
}

export interface StatusChange {
  from: string
  status: ModeratedStatus
  reason: string | null
  moderatorId: string
}

export interface AdminReportRow {
  id: string
  examId: string
  examTitle: string | null
  reporterId: string | null
  reason: string
  detail: string | null
  status: string
  createdAt: Date
  resolvedBy: string | null
  resolvedAt: Date | null
}

export interface ReportTarget {
  id: string
  examId: string
  examOwnerId: string | null
}

export interface ExamAdminRepositoryPort {
  list(
    scope: ExamScope,
    filter: ExamFilter,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminExamRow[]; total: number }>
  find(scope: ExamScope, id: string): Promise<AdminExamDetail | null>
  /** false when the status is no longer `change.from` (someone else changed it first) */
  changeStatus(id: string, change: StatusChange): Promise<boolean>
  /** The deleted exam's title, null when it does not exist */
  delete(id: string): Promise<string | null>
  listReports(
    scope: ExamScope,
    status: string,
    page: number,
    perPage: number,
  ): Promise<{ rows: AdminReportRow[]; total: number }>
  findReportTarget(scope: ExamScope, reportId: bigint): Promise<ReportTarget | null>
  /** false when the report moved to another exam meanwhile */
  resolveReport(reportId: bigint, examId: string, status: string, adminId: string): Promise<boolean>
}
