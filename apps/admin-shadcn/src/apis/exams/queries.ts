import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { examsKeys } from './keys'
import * as requests from './requests'

import type * as Types from './types'
import type { components } from '@workspace/api-types'

export const communityExamCommunityQuery = (options: Types.CommunityExamCommunityInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'communityExamCommunity', options.params],
    queryFn: () => requests.communityExamCommunity(options),
  })

export const communityExamAuthorsQuery = (options: Types.CommunityExamAuthorsInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'communityExamAuthors', options.params],
    queryFn: () => requests.communityExamAuthors(options),
  })

export const communityExamCommunityDocQuery = (options: Types.CommunityExamCommunityDocInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'communityExamCommunityDoc', options.params],
    queryFn: () => requests.communityExamCommunityDoc(options),
  })

export const communityExamPlayQuery = (options: Types.CommunityExamPlayInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'communityExamPlay', options.params],
    queryFn: () => requests.communityExamPlay(options),
  })

export const communityExamGateQuery = (options: Types.CommunityExamGateInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'communityExamGate', options.params],
    queryFn: () => requests.communityExamGate(options),
  })

export const myExamListQuery = (options: Types.MyExamListInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'myExamList', options.params],
    queryFn: () => requests.myExamList(options),
  })

export const myExamCountQuery = (options: Types.MyExamCountInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'myExamCount', options.params],
    queryFn: () => requests.myExamCount(options),
  })

export const myExamAttemptsOfQuery = (options: Types.MyExamAttemptsOfInput) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'myExamAttemptsOf', options.params],
    queryFn: () => requests.myExamAttemptsOf(options),
  })

export const myExamSaveMutation = () =>
  mutationOptions({
    mutationFn: ({
      id,
      body,
    }: {
      id?: string
      body: NonNullable<Types.MyExamPublishInput['body']>
    }) =>
      id
        ? requests.myExamReplace({ params: { path: { id } }, body })
        : requests.myExamPublish({ body }),
  })

export const studentPlayQuery = (id: string, deviceId: string) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'studentPlay', id, deviceId],
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const [play, gate] = await Promise.all([
        requests.communityExamPlay({ params: { path: { id } } }),
        requests.communityExamGate({ params: { path: { id }, query: { deviceId } } }),
      ])
      return { ...play, gate }
    },
  })

export const studentAttemptMutation = () =>
  mutationOptions({ mutationFn: requests.communityExamSubmit })
export const examReportMutation = () => mutationOptions({ mutationFn: requests.examReportReport })

export const myExamSetListedMutation = () =>
  mutationOptions({ mutationFn: requests.myExamSetListed })
export const myExamUnpublishMutation = () =>
  mutationOptions({ mutationFn: requests.myExamUnpublish })

export const myExamByIdQuery = (id: string) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'ownerExam', id],
    queryFn: async () => {
      for (let offset = 0; ; offset += 100) {
        const rows = await requests.myExamList({ params: { query: { limit: 100, offset } } })
        const row = rows.find((item) => item.id === id)
        if (row) return row
        if (rows.length < 100) return null
      }
    },
  })

export const allMyExamAttemptsQuery = (examIds: string[]) =>
  queryOptions({
    queryKey: [...examsKeys.all, 'allAttempts', examIds],
    queryFn: async () => {
      const rows: components['schemas']['ExamAttemptDto'][] = []
      let cursor: string | undefined
      do {
        const page = await requests.myExamAttemptsOf({
          params: { query: { examIds, cursor, limit: 1000 } },
          querySerializer: { array: { style: 'form', explode: false } },
        })
        rows.push(...page.items)
        cursor = typeof page.nextCursor === 'string' ? page.nextCursor : undefined
      } while (cursor)
      return rows
    },
  })
