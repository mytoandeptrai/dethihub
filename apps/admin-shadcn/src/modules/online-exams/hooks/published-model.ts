import { t } from '@/i18n/translate-online-exams'

import type {
  lib_attempts_Attempt as Attempt,
  lib_community_CommunityRow as CommunityRow,
} from '@online-exams-engine'
import type { components } from '@workspace/api-types'

export const publishedAttempt = (row: components['schemas']['ExamAttemptDto']): Attempt => ({
  ...row,
  exam_id: row.examId,
  user_id: row.userId as unknown as string | null,
  student_name: row.studentName,
  max_score: row.maxScore,
  duration_seconds: row.durationSeconds,
  created_at: row.createdAt,
  device_id: row.deviceId as unknown as string | null,
  class_name: row.className as unknown as string | null,
  seat_no: row.seatNo as unknown as number | null,
})

export const publishedRow = (row: components['schemas']['ExamCardDto']): CommunityRow => ({
  ...row,
  created_at: row.createdAt,
  question_count: row.questionCount,
  duration_minutes: row.durationMinutes,
  total_points: row.totalPoints,
})

export function publishedCount(value: unknown): number {
  if (value && typeof value === 'object' && 'count' in value && typeof value.count === 'number')
    return value.count
  throw new Error(t('onlineExamsCopy.m237'))
}
