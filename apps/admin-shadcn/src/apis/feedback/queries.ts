'use client'

import { useMutation } from '@tanstack/react-query'

import { feedbackKeys } from './keys'
import { submitFeedback } from './requests'

export function useFeedback() {
  return useMutation({ mutationKey: feedbackKeys.all, mutationFn: submitFeedback })
}
