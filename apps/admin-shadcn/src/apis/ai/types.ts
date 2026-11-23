import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type AiChatInput = FetchOptions<paths['/api/ai/chat']['post']>
export type AiQuotaInput = FetchOptions<paths['/api/ai/quota']['get']>
export type AiCreditEventsInput = FetchOptions<paths['/api/ai/credits/events']['get']>
export type AiFeedbackInput = FetchOptions<paths['/api/ai/feedback']['post']>
