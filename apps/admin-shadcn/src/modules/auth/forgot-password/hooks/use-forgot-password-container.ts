'use client'

import { useAuthFormContainer } from '@/modules/auth/shared'

export function useForgotPasswordContainer() {
  return useAuthFormContainer('forgot')
}
