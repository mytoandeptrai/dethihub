'use client'

import { useAuthFormContainer } from '@/modules/auth/shared'

export function useResetPasswordContainer() {
  return useAuthFormContainer('reset')
}
