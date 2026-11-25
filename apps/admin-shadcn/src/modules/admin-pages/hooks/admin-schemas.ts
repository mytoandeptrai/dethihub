import { z } from 'zod'

import { t as translate } from '@/i18n/translate-admin-pages'
export const bankSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, translate('adminPagesCopy.m312'))
    .max(5000, translate('adminPagesCopy.m313')),
  grades: z.array(z.string()).min(1, translate('adminPagesCopy.m314')),
  points: z
    .number({ error: translate('adminPagesCopy.m315') })
    .positive(translate('adminPagesCopy.m315')),
})
export const creditSchema = z.object({
  points: z
    .number({ error: translate('adminPagesCopy.creditAmount') })
    .int(translate('adminPagesCopy.creditAmount'))
    .min(1, translate('adminPagesCopy.creditAmount'))
    .max(100_000, translate('adminPagesCopy.creditAmount')),
  note: z.string(),
})
export const quotaSchema = z.object({
  limit: z
    .number({ error: translate('adminPagesCopy.m22') })
    .min(0, translate('adminPagesCopy.m22'))
    .nullable(),
})
export const storageSchema = z.object({
  mb: z
    .number({ error: translate('adminPagesCopy.m54') })
    .min(1, translate('adminPagesCopy.m54'))
    .max(1024, translate('adminPagesCopy.m54')),
})
