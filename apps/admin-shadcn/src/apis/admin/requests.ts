import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export async function adminUserList(options: Types.AdminUserListInput) {
  const { data } = await apiClient.GET('/api/admin/users', {...options,cache:'no-store'})
  return data!
}

export async function adminUserBan(options: Types.AdminUserBanInput) {
  const { data } = await apiClient.POST('/api/admin/users/{id}/ban', options)
  return data!
}

export async function adminUserUnban(options: Types.AdminUserUnbanInput) {
  const { data } = await apiClient.DELETE('/api/admin/users/{id}/ban', options)
  return data!
}

export async function adminUserClearFlag(options: Types.AdminUserClearFlagInput) {
  const { data } = await apiClient.DELETE('/api/admin/users/{id}/security-flags', options)
  return data!
}

export async function adminUserRemove(options: Types.AdminUserRemoveInput) {
  const { data } = await apiClient.DELETE('/api/admin/users/{id}', options)
  return data!
}

export async function adminUserAudit(options: Types.AdminUserAuditInput) {
  const { data } = await apiClient.GET('/api/admin/audit', options)
  return data!
}

export async function adminSettingsGetAll(options: Types.AdminSettingsGetAllInput) {
  const { data } = await apiClient.GET('/api/admin/settings', options)
  return data!
}

export async function adminSettingsSet(options: Types.AdminSettingsSetInput) {
  const { data } = await apiClient.PUT('/api/admin/settings/{key}', options)
  return data!
}

export async function aiAdminGetQuota(options: Types.AiAdminGetQuotaInput) {
  const { data } = await apiClient.GET('/api/admin/ai/users/{id}/quota', {...options,cache:'no-store'})
  return data!
}

export async function aiAdminSetQuota(options: Types.AiAdminSetQuotaInput) {
  const { data } = await apiClient.PUT('/api/admin/ai/users/{id}/quota', options)
  return data!
}

export async function aiAdminClearQuota(options: Types.AiAdminClearQuotaInput) {
  const { data } = await apiClient.DELETE('/api/admin/ai/users/{id}/quota', options)
  return data!
}

export async function aiAdminGrantCredits(options: Types.AiAdminGrantCreditsInput) {
  const { data } = await apiClient.POST('/api/admin/ai/users/{id}/credits', options)
  return data!
}

export async function aiAdminStats(options: Types.AiAdminStatsInput) {
  const { data } = await apiClient.GET('/api/admin/ai/stats', {...options,cache:'no-store'})
  return data!
}

export async function aiAdminErrors(options: Types.AiAdminErrorsInput) {
  const { data } = await apiClient.GET('/api/admin/ai/errors', options)
  return data!
}

export async function aiAdminProviders(options: Types.AiAdminProvidersInput) {
  const { data } = await apiClient.GET('/api/admin/ai/providers', options)
  return data!
}

export async function aiAdminSaveProvider(options: Types.AiAdminSaveProviderInput) {
  const { data } = await apiClient.PUT('/api/admin/ai/providers/{provider}', options)
  return data!
}

export async function aiAdminResetProvider(options: Types.AiAdminResetProviderInput) {
  const { data } = await apiClient.DELETE('/api/admin/ai/providers/{provider}', options)
  return data!
}

export async function aiAdminPing(options: Types.AiAdminPingInput) {
  const { data } = await apiClient.POST('/api/admin/ai/providers/{provider}/ping', options)
  return data!
}

export async function examAdminList(options: Types.ExamAdminListInput) {
  const { data } = await apiClient.GET('/api/admin/exams', {...options,cache:'no-store'})
  return data!
}

export async function examAdminGet(options: Types.ExamAdminGetInput) {
  const { data } = await apiClient.GET('/api/admin/exams/{id}', {...options,cache:'no-store'})
  return data!
}

export async function examAdminRemove(options: Types.ExamAdminRemoveInput) {
  const { data } = await apiClient.DELETE('/api/admin/exams/{id}', options)
  return data!
}

export async function examAdminSetStatus(options: Types.ExamAdminSetStatusInput) {
  const { data } = await apiClient.PATCH('/api/admin/exams/{id}/status', options)
  return data!
}

export async function examAdminListReports(options: Types.ExamAdminListReportsInput) {
  const { data } = await apiClient.GET('/api/admin/reports', {...options,cache:'no-store'})
  return data!
}

export async function examAdminResolveReport(options: Types.ExamAdminResolveReportInput) {
  const { data } = await apiClient.PATCH('/api/admin/reports/{id}', options)
  return data!
}

export async function storageAdminGetUser(options: Types.StorageAdminGetUserInput) {
  const { data } = await apiClient.GET('/api/admin/storage/users/{id}', {...options,cache:'no-store'})
  return data!
}

export async function storageAdminSetUser(options: Types.StorageAdminSetUserInput) {
  const { data } = await apiClient.PUT('/api/admin/storage/users/{id}', options)
  return data!
}

export async function storageAdminListDocuments(options: Types.StorageAdminListDocumentsInput) {
  const { data } = await apiClient.GET('/api/admin/documents', {...options,cache:'no-store'})
  return data!
}

export async function storageAdminDeleteDocument(options: Types.StorageAdminDeleteDocumentInput) {
  const { data } = await apiClient.DELETE('/api/admin/documents/{id}', options)
  return data!
}

export async function paymentAdminList(options: Types.PaymentAdminListInput) {
  const { data } = await apiClient.GET('/api/admin/payments', options)
  return data!
}

export async function paymentAdminSync(options: Types.PaymentAdminSyncInput) {
  const { data } = await apiClient.POST('/api/admin/payments/{orderCode}/sync', options)
  return data!
}

export async function paymentAdminCredit(options: Types.PaymentAdminCreditInput) {
  const { data } = await apiClient.POST('/api/admin/payments/{orderCode}/credit', options)
  return data!
}

export async function adminFeedbackList(options: Types.AdminFeedbackListInput) {
  const { data } = await apiClient.GET('/api/admin/feedback', {...options,cache:'no-store'})
  return data!
}

export async function adminFeedbackMarkRead(options: Types.AdminFeedbackMarkReadInput) {
  const { data } = await apiClient.PATCH('/api/admin/feedback/{id}/read', options)
  return data!
}

export async function adminBankOverrides(options: Types.AdminBankOverridesInput) {
  const { data } = await apiClient.GET('/api/admin/bank/overrides', {...options,cache:'no-store'})
  return data!
}

export async function adminBankCreate(options: Types.AdminBankCreateInput) {
  const { data } = await apiClient.POST('/api/admin/bank/questions', options)
  return data!
}

export async function adminBankUpdate(options: Types.AdminBankUpdateInput) {
  const { data } = await apiClient.PUT('/api/admin/bank/questions/{id}', options)
  return data!
}

export async function adminBankRevert(options: Types.AdminBankRevertInput) {
  const { data } = await apiClient.DELETE('/api/admin/bank/questions/{id}', options)
  return data!
}

export async function adminBankHide(options: Types.AdminBankHideInput) {
  const { data } = await apiClient.POST('/api/admin/bank/questions/{id}/hide', options)
  return data!
}

export async function adminBankUnhide(options: Types.AdminBankUnhideInput) {
  const { data } = await apiClient.POST('/api/admin/bank/questions/{id}/unhide', options)
  return data!
}

export async function adminBankVision(options: Types.AdminBankVisionInput) {
  const { data } = await apiClient.POST('/api/admin/bank/vision', options)
  return data!
}

export async function adminOpsOverview(options: Types.AdminOpsOverviewInput) {
  const { data } = await apiClient.GET('/api/admin/stats/overview', options)
  return data!
}

export async function adminOpsOnline(options: Types.AdminOpsOnlineInput) {
  const { data } = await apiClient.GET('/api/admin/stats/online', options)
  return data!
}

export async function adminOpsHealth(options: Types.AdminOpsHealthInput) {
  const { data } = await apiClient.GET('/api/admin/health', options)
  return data!
}

export async function adminOpsTargets(options: Types.AdminOpsTargetsInput) {
  const { data } = await apiClient.GET('/api/admin/health/targets', options)
  return data!
}

export async function adminOpsDbMetrics(options: Types.AdminOpsDbMetricsInput) {
  const { data } = await apiClient.GET('/api/admin/db/metrics', options)
  return data!
}
