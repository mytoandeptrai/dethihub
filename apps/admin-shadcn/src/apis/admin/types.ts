import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type AdminUserListInput = FetchOptions<paths['/api/admin/users']['get']>
export type AdminUserBanInput = FetchOptions<paths['/api/admin/users/{id}/ban']['post']>
export type AdminUserUnbanInput = FetchOptions<paths['/api/admin/users/{id}/ban']['delete']>
export type AdminUserClearFlagInput = FetchOptions<
  paths['/api/admin/users/{id}/security-flags']['delete']
>
export type AdminUserRemoveInput = FetchOptions<paths['/api/admin/users/{id}']['delete']>
export type AdminUserAuditInput = FetchOptions<paths['/api/admin/audit']['get']>
export type AdminSettingsGetAllInput = FetchOptions<paths['/api/admin/settings']['get']>
export type AdminSettingsSetInput = FetchOptions<paths['/api/admin/settings/{key}']['put']>
export type AiAdminGetQuotaInput = FetchOptions<paths['/api/admin/ai/users/{id}/quota']['get']>
export type AiAdminSetQuotaInput = FetchOptions<paths['/api/admin/ai/users/{id}/quota']['put']>
export type AiAdminClearQuotaInput = FetchOptions<paths['/api/admin/ai/users/{id}/quota']['delete']>
export type AiAdminGrantCreditsInput = FetchOptions<
  paths['/api/admin/ai/users/{id}/credits']['post']
>
export type AiAdminStatsInput = FetchOptions<paths['/api/admin/ai/stats']['get']>
export type AiAdminErrorsInput = FetchOptions<paths['/api/admin/ai/errors']['get']>
export type AiAdminProvidersInput = FetchOptions<paths['/api/admin/ai/providers']['get']>
export type AiAdminSaveProviderInput = FetchOptions<
  paths['/api/admin/ai/providers/{provider}']['put']
>
export type AiAdminResetProviderInput = FetchOptions<
  paths['/api/admin/ai/providers/{provider}']['delete']
>
export type AiAdminPingInput = FetchOptions<
  paths['/api/admin/ai/providers/{provider}/ping']['post']
>
export type ExamAdminListInput = FetchOptions<paths['/api/admin/exams']['get']>
export type ExamAdminGetInput = FetchOptions<paths['/api/admin/exams/{id}']['get']>
export type ExamAdminRemoveInput = FetchOptions<paths['/api/admin/exams/{id}']['delete']>
export type ExamAdminSetStatusInput = FetchOptions<paths['/api/admin/exams/{id}/status']['patch']>
export type ExamAdminListReportsInput = FetchOptions<paths['/api/admin/reports']['get']>
export type ExamAdminResolveReportInput = FetchOptions<paths['/api/admin/reports/{id}']['patch']>
export type StorageAdminGetUserInput = FetchOptions<paths['/api/admin/storage/users/{id}']['get']>
export type StorageAdminSetUserInput = FetchOptions<paths['/api/admin/storage/users/{id}']['put']>
export type StorageAdminListDocumentsInput = FetchOptions<paths['/api/admin/documents']['get']>
export type StorageAdminDeleteDocumentInput = FetchOptions<
  paths['/api/admin/documents/{id}']['delete']
>
export type PaymentAdminListInput = FetchOptions<paths['/api/admin/payments']['get']>
export type PaymentAdminSyncInput = FetchOptions<
  paths['/api/admin/payments/{orderCode}/sync']['post']
>
export type PaymentAdminCreditInput = FetchOptions<
  paths['/api/admin/payments/{orderCode}/credit']['post']
>
export type AdminFeedbackListInput = FetchOptions<paths['/api/admin/feedback']['get']>
export type AdminFeedbackMarkReadInput = FetchOptions<
  paths['/api/admin/feedback/{id}/read']['patch']
>
export type AdminBankOverridesInput = FetchOptions<paths['/api/admin/bank/overrides']['get']>
export type AdminBankCreateInput = FetchOptions<paths['/api/admin/bank/questions']['post']>
export type AdminBankUpdateInput = FetchOptions<paths['/api/admin/bank/questions/{id}']['put']>
export type AdminBankRevertInput = FetchOptions<paths['/api/admin/bank/questions/{id}']['delete']>
export type AdminBankHideInput = FetchOptions<paths['/api/admin/bank/questions/{id}/hide']['post']>
export type AdminBankUnhideInput = FetchOptions<
  paths['/api/admin/bank/questions/{id}/unhide']['post']
>
export type AdminBankVisionInput = FetchOptions<paths['/api/admin/bank/vision']['post']>
export type AdminOpsOverviewInput = FetchOptions<paths['/api/admin/stats/overview']['get']>
export type AdminOpsOnlineInput = FetchOptions<paths['/api/admin/stats/online']['get']>
export type AdminOpsHealthInput = FetchOptions<paths['/api/admin/health']['get']>
export type AdminOpsTargetsInput = FetchOptions<paths['/api/admin/health/targets']['get']>
export type AdminOpsDbMetricsInput = FetchOptions<paths['/api/admin/db/metrics']['get']>
