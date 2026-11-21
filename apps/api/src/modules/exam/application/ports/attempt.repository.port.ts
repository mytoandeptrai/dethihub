export const ATTEMPT_REPOSITORY = Symbol('ATTEMPT_REPOSITORY')

export interface NewAttempt {
  examId: string
  userId: string | null
  studentName: string
  score: number
  maxScore: number
  durationSeconds: number
  deviceId: string | null
  className: string | null
  seatNo: number | null
}

export interface AttemptRow {
  id: string
  examId: string
  userId: string | null
  studentName: string
  score: number
  maxScore: number
  durationSeconds: number
  createdAt: Date
  deviceId: string | null
  className: string | null
  seatNo: number | null
}

export interface AttemptRepositoryPort {
  hasAttempted(examId: string, userId: string | null, deviceId: string | null): Promise<boolean>
  insert(attempt: NewAttempt & { userId: string | null }): Promise<void>
  /** Claims the one-attempt lock and stores the attempt in one transaction */
  insertWithLock(attempt: NewAttempt & { userId: string }): Promise<'saved' | 'duplicate'>
  countByUser(examId: string, userId: string): Promise<number>
  countByGuestDevice(examId: string, deviceId: string): Promise<number>
  countGuests(examId: string): Promise<number>
  listForExams(examIds: string[], limit: number, afterId?: string): Promise<AttemptRow[]>
}
