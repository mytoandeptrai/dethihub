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

export interface FeedbackRepositoryPort {
  list(
    page: number,
    perPage: number,
    read: boolean | undefined,
  ): Promise<{ rows: FeedbackRecord[]; total: number }>
  /** Unknown ids are ignored */
  setRead(id: bigint, read: boolean): Promise<void>
}
