import { queryOptions } from '@tanstack/react-query'

import { examsKeys } from './keys'
import * as requests from './requests'
import type * as Types from './types'

export const communityExamCommunityQuery = (options: Types.CommunityExamCommunityInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'communityExamCommunity', options.params], queryFn: () => requests.communityExamCommunity(options) })

export const communityExamAuthorsQuery = (options: Types.CommunityExamAuthorsInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'communityExamAuthors', options.params], queryFn: () => requests.communityExamAuthors(options) })

export const communityExamCommunityDocQuery = (options: Types.CommunityExamCommunityDocInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'communityExamCommunityDoc', options.params], queryFn: () => requests.communityExamCommunityDoc(options) })

export const communityExamPlayQuery = (options: Types.CommunityExamPlayInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'communityExamPlay', options.params], queryFn: () => requests.communityExamPlay(options) })

export const communityExamGateQuery = (options: Types.CommunityExamGateInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'communityExamGate', options.params], queryFn: () => requests.communityExamGate(options) })

export const myExamListQuery = (options: Types.MyExamListInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'myExamList', options.params], queryFn: () => requests.myExamList(options) })

export const myExamCountQuery = (options: Types.MyExamCountInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'myExamCount', options.params], queryFn: () => requests.myExamCount(options) })

export const myExamAttemptsOfQuery = (options: Types.MyExamAttemptsOfInput) =>
  queryOptions({ queryKey: [...examsKeys.all, 'myExamAttemptsOf', options.params], queryFn: () => requests.myExamAttemptsOf(options) })
