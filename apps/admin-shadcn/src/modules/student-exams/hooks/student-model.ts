import { z } from 'zod'

import { t } from '@/i18n/translate-student'

import type { data_docTypes_ExamDoc as ExamDoc } from '@student-engine'

export function decodeStudentDoc(value: unknown): ExamDoc {
  if (!value || typeof value !== 'object' || !('blocks' in value) || !Array.isArray(value.blocks))
    throw new Error(t('studentCopy.invalidDocument'))
  return value as ExamDoc
}

export const studentSchema = (roster: string[]) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t('studentCopy.m280'))
      .max(60)
      .refine((value) => roster.length === 0 || roster.includes(value), t('studentCopy.m293')),
    className: z.string().trim().min(1, t('studentCopy.m281')).max(30),
    seat: z
      .string()
      .refine(
        (value) =>
          !value || (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 999),
        t('studentCopy.m282'),
      ),
  })
