export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY')

export interface NewReport {
  examId: string
  reporterId: string
  reason: string
  detail: string | null
}

export interface ReportRepositoryPort {
  /** One open report per reporter and exam, and a daily cap, checked under a per-reporter lock */
  create(report: NewReport, dailyLimit: number): Promise<'created' | 'duplicate' | 'limit'>
  hasOpen(examId: string): Promise<boolean>
}
