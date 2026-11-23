import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type CommunityExamCommunityInput = FetchOptions<paths['/api/exams/community']['get']>
export type CommunityExamAuthorsInput = FetchOptions<paths['/api/exams/community/authors']['get']>
export type CommunityExamCommunityDocInput = FetchOptions<paths['/api/exams/community/{id}']['get']>
export type CommunityExamPlayInput = FetchOptions<paths['/api/exams/{id}/play']['get']>
export type CommunityExamGateInput = FetchOptions<paths['/api/exams/{id}/gate']['get']>
export type CommunityExamSubmitInput = FetchOptions<paths['/api/exams/{id}/attempts']['post']>
export type MyExamListInput = FetchOptions<paths['/api/me/exams']['get']>
export type MyExamPublishInput = FetchOptions<paths['/api/me/exams']['post']>
export type MyExamCountInput = FetchOptions<paths['/api/me/exams/count']['get']>
export type MyExamAttemptsOfInput = FetchOptions<paths['/api/me/exams/attempts']['get']>
export type MyExamReplaceInput = FetchOptions<paths['/api/me/exams/{id}']['put']>
export type MyExamUnpublishInput = FetchOptions<paths['/api/me/exams/{id}']['delete']>
export type MyExamSetListedInput = FetchOptions<paths['/api/me/exams/{id}/listed']['patch']>
export type ExamReportReportInput = FetchOptions<paths['/api/exams/{id}/reports']['post']>
