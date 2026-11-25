import { cache } from 'react'

import { fetchPublicJson } from '@/apis/public-server'

import type { components } from '@workspace/api-types'

export const getPublicPricing = cache(() =>
  fetchPublicJson<components['schemas']['PricingResponseDto']>('/api/billing/pricing'),
)
export const getPublicCollection = cache(async () => {
  const exams = await fetchPublicJson<components['schemas']['ExamCardDto'][]>(
    '/api/exams/community?limit=100',
  )
  return Array.isArray(exams)
    ? exams.filter((exam) => exam?.listed && typeof exam.id === 'string')
    : []
})
