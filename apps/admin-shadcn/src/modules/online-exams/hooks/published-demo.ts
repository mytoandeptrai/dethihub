import { t } from '@/i18n/translate-online-exams'

import type {
  lib_attempts_Attempt as Attempt,
  lib_community_CommunityRow as CommunityRow,
} from '@online-exams-engine'

export const PAGE = 12

export const DEMO_ROW: CommunityRow = {
  id: 'demo',
  title: t('onlineExamsCopy.m218'),
  subject: t('onlineExamsCopy.m219'),
  grade: t('onlineExamsCopy.m220'),
  school: t('onlineExamsCopy.m221'),
  created_at: '2026-10-20T08:00:00Z',
  question_count: 20,
  duration_minutes: 15,
  total_points: 10,
  preview: '',
  listed: true,
}

export function demoAttempts(): Attempt[] {
  const names = [
    t('onlineExamsCopy.m222'),
    t('onlineExamsCopy.m223'),
    t('onlineExamsCopy.m224'),
    t('onlineExamsCopy.m225'),
    t('onlineExamsCopy.m226'),
    t('onlineExamsCopy.m227'),
    t('onlineExamsCopy.m228'),
    t('onlineExamsCopy.m229'),
    t('onlineExamsCopy.m230'),
    t('onlineExamsCopy.m231'),
    t('onlineExamsCopy.m232'),
    t('onlineExamsCopy.m233'),
    t('onlineExamsCopy.m234'),
    t('onlineExamsCopy.m235'),
    t('onlineExamsCopy.m236'),
  ]
  const scores = [9.5, 8.75, 8, 7.5, 7.25, 6.5, 6, 5.75, 5, 4.5, 9, 3.75, 8.5, 6.75, 4]
  return names.flatMap((name, i) =>
    Array.from({ length: (i % 3) + 1 }, (_, k) => ({
      id: `${i}-${k}`,
      exam_id: 'demo',
      user_id: null,
      device_id: `demo-device-${i}`,
      class_name: i < 8 ? '10A1' : '10A2',
      seat_no: i + 1,
      student_name: name,
      score: Math.max(0, (scores[i] ?? 0) - k * 0.75),
      max_score: 10,
      duration_seconds: 420 + ((i * 53 + k * 31) % 480),
      created_at: new Date(Date.UTC(2026, 9, 21 + (i % 9), 8 + k)).toISOString(),
    })),
  )
}
