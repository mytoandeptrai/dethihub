import { z } from 'zod'

import type messages from '@/i18n/messages/vi'

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset'
export type AuthTranslate = (key: keyof typeof messages.auth) => string

export function authSchema(mode: AuthMode, t: AuthTranslate) {
  return z
    .object({
      name:
        mode === 'register'
          ? z.string().trim().min(1, t('nameError')).max(40, t('nameLong'))
          : z.string(),
      email:
        mode === 'reset'
          ? z.string()
          : z
              .string()
              .trim()
              .pipe(z.email(t('emailError'))),
      password:
        mode === 'register' || mode === 'reset'
          ? z.string().min(8, t('passwordShort'))
          : mode === 'login'
            ? z.string().min(1, t('passwordRequired'))
            : z.string(),
      confirm: z.string(),
      accepted: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if ((mode === 'login' || mode === 'register') && !values.accepted) {
        ctx.addIssue({ code: 'custom', path: ['accepted'], message: t('termsError') })
      }
      if ((mode === 'register' || mode === 'reset') && values.password !== values.confirm) {
        ctx.addIssue({ code: 'custom', path: ['confirm'], message: t('confirmError') })
      }
    })
}

export type AuthFormData = z.infer<ReturnType<typeof authSchema>>
export const initialAuthFormData: AuthFormData = {
  name: '',
  email: '',
  password: '',
  confirm: '',
  accepted: false,
}
