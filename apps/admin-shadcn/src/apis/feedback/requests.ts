import { apiClient } from '@/lib/api-client'

import type { FeedbackInput } from './types'

export async function submitFeedback(body: FeedbackInput) {
  const { data } = await apiClient.POST('/api/feedback', { body })
  return data
}
