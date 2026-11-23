'use client'

import { useMutation } from '@tanstack/react-query'

import { presenceKeys } from './keys'
import { submitPresence } from './requests'

export function usePresence() {
  return useMutation({ mutationKey: presenceKeys.all, mutationFn: submitPresence })
}
