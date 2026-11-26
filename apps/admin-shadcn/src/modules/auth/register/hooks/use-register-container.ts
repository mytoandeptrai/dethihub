'use client'

import { useAuthFormContainer } from '@/modules/auth/shared'

export function useRegisterContainer() {
  return useAuthFormContainer('register')
}
