export const ExamStatus = {
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  REMOVED: 'removed',
} as const

export type ExamStatus = (typeof ExamStatus)[keyof typeof ExamStatus]
