'use client'

import { useAuthFormContainer } from '@/modules/auth/shared'

export function useLoginContainer() {
  return useAuthFormContainer('login')
}
