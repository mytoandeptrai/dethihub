import { t } from '@/i18n/translate'

import type { components } from '@workspace/api-types'

type ProblemDetails = components['schemas']['ProblemDetailsDto']
export type FieldError = NonNullable<ProblemDetails['errors']>[number]

export class ApiClientError extends Error {
  readonly status: number
  readonly code?: string
  readonly detail: string
  readonly userMessage: string
  readonly errors: FieldError[]
  readonly refundedTokens?: number

  constructor(raw: Pick<ProblemDetails, 'title' | 'status'> & Partial<ProblemDetails>) {
    super(raw.detail ?? raw.title)
    this.name = 'ApiClientError'
    this.status = raw.status
    this.code = raw.code
    this.detail = raw.detail ?? raw.title
    this.userMessage = this.detail
    this.errors = raw.errors ?? []
    if ('refundedTokens' in raw && typeof raw.refundedTokens === 'number' && raw.refundedTokens > 0) this.refundedTokens = raw.refundedTokens
  }
}

export async function responseError(response: Response): Promise<ApiClientError> {
  const raw: unknown = await response
    .clone()
    .json()
    .catch(() => null)
  const problem = raw && typeof raw === 'object' ? (raw as Partial<ProblemDetails>) : {}
  return new ApiClientError({
    ...problem,
    status: response.status,
    title: typeof problem.title === 'string' ? problem.title : t('common.requestError'),
    detail: typeof problem.detail === 'string' ? problem.detail : undefined,
  })
}
