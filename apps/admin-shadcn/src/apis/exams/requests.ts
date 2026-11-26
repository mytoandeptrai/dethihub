import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export async function communityExamCommunity(options: Types.CommunityExamCommunityInput) {
  const { data } = await apiClient.GET('/api/exams/community', { ...options, cache: 'no-store' })
  return data!
}

export async function communityExamAuthors(options: Types.CommunityExamAuthorsInput) {
  const { data } = await apiClient.GET('/api/exams/community/authors', {
    ...options,
    cache: 'no-store',
  })
  return data!
}

export async function communityExamCommunityDoc(options: Types.CommunityExamCommunityDocInput) {
  const { data } = await apiClient.GET('/api/exams/community/{id}', {
    ...options,
    cache: 'no-store',
  })
  return data as unknown as Record<string, unknown>
}

export async function communityExamPlay(options: Types.CommunityExamPlayInput) {
  const { data } = await apiClient.GET('/api/exams/{id}/play', { ...options, cache: 'no-store' })
  return data!
}

export async function communityExamGate(options: Types.CommunityExamGateInput) {
  const { data } = await apiClient.GET('/api/exams/{id}/gate', { ...options, cache: 'no-store' })
  return data!
}

export async function communityExamSubmit(options: Types.CommunityExamSubmitInput) {
  const { data } = await apiClient.POST('/api/exams/{id}/attempts', options)
  return data!
}

export async function myExamList(options: Types.MyExamListInput) {
  const { data } = await apiClient.GET('/api/me/exams', { ...options, cache: 'no-store' })
  return data!
}

export async function myExamPublish(options: Types.MyExamPublishInput) {
  const { data } = await apiClient.POST('/api/me/exams', options)
  return data!
}

export async function myExamCount(options: Types.MyExamCountInput) {
  const { data } = await apiClient.GET('/api/me/exams/count', { ...options, cache: 'no-store' })
  return data!
}

export async function myExamAttemptsOf(options: Types.MyExamAttemptsOfInput) {
  const { data } = await apiClient.GET('/api/me/exams/attempts', { ...options, cache: 'no-store' })
  return data!
}

export async function myExamReplace(options: Types.MyExamReplaceInput) {
  const { data } = await apiClient.PUT('/api/me/exams/{id}', options)
  return data!
}

export async function myExamUnpublish(options: Types.MyExamUnpublishInput) {
  const { data } = await apiClient.DELETE('/api/me/exams/{id}', options)
  return data!
}

export async function myExamSetListed(options: Types.MyExamSetListedInput) {
  const { data } = await apiClient.PATCH('/api/me/exams/{id}/listed', options)
  return data!
}

export async function examReportReport(options: Types.ExamReportReportInput) {
  const { data } = await apiClient.POST('/api/exams/{id}/reports', options)
  return data!
}
