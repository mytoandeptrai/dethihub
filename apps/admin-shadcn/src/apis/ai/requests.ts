import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export { streamAiChat as streamChat } from '@/lib/ai-stream'

export async function aiChat(options: Types.AiChatInput) {
  const { data } = await apiClient.POST('/api/ai/chat', options)
  return data!
}

export async function aiQuota(options: Types.AiQuotaInput) {
  const { data } = await apiClient.GET('/api/ai/quota', options)
  return data!
}

export async function aiCreditEvents(options: Types.AiCreditEventsInput) {
  const { data } = await apiClient.GET('/api/ai/credits/events', options)
  return data!
}

export async function aiFeedback(options: Types.AiFeedbackInput) {
  const { data } = await apiClient.POST('/api/ai/feedback', options)
  return data!
}
