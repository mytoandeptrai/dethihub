import { data_types_SUBJECTS as SUBJECTS } from '@online-exams-engine'
import { z } from 'zod'

import { t } from '@/i18n/translate'

import type { data_types_Subject as Subject } from '@online-exams-engine'

export const onlineMetaSchema = z.object({
  title: z.string().trim().min(1, t('onlineExamsCopy.m117')),
  subject: z.custom<Subject>(
    (value) => typeof value === 'string' && SUBJECTS.includes(value as Subject),
    t('onlineExamsCopy.chooseSubject'),
  ),
  grade: z.string().trim(),
  school: z.string().trim(),
  year: z.string().trim(),
  term: z.string().trim(),
  durationMinutes: z
    .number({ message: t('onlineExamsCopy.invalidDuration') })
    .positive(t('onlineExamsCopy.invalidDuration'))
    .max(1440, t('onlineExamsCopy.invalidDuration')),
})
