export const AI_FEEDBACK_KINDS = ['up', 'down', 'undo', 'resend', 'complaint'] as const
export const AI_FEEDBACK_MODES = ['exam', 'slide', 'board'] as const

export interface AiFeedbackInput {
  userId: string
  kind: (typeof AI_FEEDBACK_KINDS)[number]
  mode: (typeof AI_FEEDBACK_MODES)[number]
  request: string
  reply: string
  context: string
  note: string
}

export interface FeedbackRepository {
  save(feedback: AiFeedbackInput): Promise<void>
}

export const FEEDBACK_REPOSITORY = Symbol('FEEDBACK_REPOSITORY')
