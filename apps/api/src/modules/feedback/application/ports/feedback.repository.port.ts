export const FEEDBACK_REPOSITORY = Symbol('FEEDBACK_REPOSITORY')

export interface FeedbackRecord {
  id: string
  userId: string | null
  email: string | null
  message: string
  page: string | null
  createdAt: Date
  read: boolean
}

export interface NewFeedback {
  /** Null for guests */
  userId: string | null
  email: string | null
  message: string
  page: string | null
}

export type SubmitOutcome = 'ok' | 'busy' | 'user-limit' | 'guest-limit'

export interface FeedbackRepositoryPort {
  /** Counts the last hour and inserts in one transaction, so parallel sends cannot pass the limit; `busy` = another send of the same sender is in flight */
  insertWithinLimit(
    feedback: NewFeedback,
    userPerHour: number,
    guestPerHour: number,
  ): Promise<SubmitOutcome>
  list(
    page: number,
    perPage: number,
    read: boolean | undefined,
  ): Promise<{ rows: FeedbackRecord[]; total: number }>
  /** Unknown ids are ignored */
  setRead(id: bigint, read: boolean): Promise<void>
}
