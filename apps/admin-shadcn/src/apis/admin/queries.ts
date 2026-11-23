import { queryOptions } from '@tanstack/react-query'

import { adminKeys } from './keys'
import * as requests from './requests'
import type * as Types from './types'

export const adminUserListQuery = (options: Types.AdminUserListInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminUserList', options.params], queryFn: () => requests.adminUserList(options) })

export const adminUserAuditQuery = (options: Types.AdminUserAuditInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminUserAudit', options.params], queryFn: () => requests.adminUserAudit(options) })

export const adminSettingsGetAllQuery = (options: Types.AdminSettingsGetAllInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminSettingsGetAll', options.params], queryFn: () => requests.adminSettingsGetAll(options) })

export const aiAdminGetQuotaQuery = (options: Types.AiAdminGetQuotaInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'aiAdminGetQuota', options.params], queryFn: () => requests.aiAdminGetQuota(options) })

export const aiAdminStatsQuery = (options: Types.AiAdminStatsInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'aiAdminStats', options.params], queryFn: () => requests.aiAdminStats(options) })

export const aiAdminErrorsQuery = (options: Types.AiAdminErrorsInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'aiAdminErrors', options.params], queryFn: () => requests.aiAdminErrors(options) })

export const aiAdminProvidersQuery = (options: Types.AiAdminProvidersInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'aiAdminProviders', options.params], queryFn: () => requests.aiAdminProviders(options) })

export const examAdminListQuery = (options: Types.ExamAdminListInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'examAdminList', options.params], queryFn: () => requests.examAdminList(options) })

export const examAdminGetQuery = (options: Types.ExamAdminGetInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'examAdminGet', options.params], queryFn: () => requests.examAdminGet(options) })

export const examAdminListReportsQuery = (options: Types.ExamAdminListReportsInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'examAdminListReports', options.params], queryFn: () => requests.examAdminListReports(options) })

export const storageAdminGetUserQuery = (options: Types.StorageAdminGetUserInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'storageAdminGetUser', options.params], queryFn: () => requests.storageAdminGetUser(options) })

export const storageAdminListDocumentsQuery = (options: Types.StorageAdminListDocumentsInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'storageAdminListDocuments', options.params], queryFn: () => requests.storageAdminListDocuments(options) })

export const paymentAdminListQuery = (options: Types.PaymentAdminListInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'paymentAdminList', options.params], queryFn: () => requests.paymentAdminList(options) })

export const adminFeedbackListQuery = (options: Types.AdminFeedbackListInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminFeedbackList', options.params], queryFn: () => requests.adminFeedbackList(options) })

export const adminBankOverridesQuery = (options: Types.AdminBankOverridesInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminBankOverrides', options.params], queryFn: () => requests.adminBankOverrides(options) })

export const adminOpsOverviewQuery = (options: Types.AdminOpsOverviewInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminOpsOverview', options.params], queryFn: () => requests.adminOpsOverview(options) })

export const adminOpsOnlineQuery = (options: Types.AdminOpsOnlineInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminOpsOnline', options.params], queryFn: () => requests.adminOpsOnline(options) })

export const adminOpsHealthQuery = (options: Types.AdminOpsHealthInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminOpsHealth', options.params], queryFn: () => requests.adminOpsHealth(options) })

export const adminOpsTargetsQuery = (options: Types.AdminOpsTargetsInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminOpsTargets', options.params], queryFn: () => requests.adminOpsTargets(options) })

export const adminOpsDbMetricsQuery = (options: Types.AdminOpsDbMetricsInput) =>
  queryOptions({ queryKey: [...adminKeys.all, 'adminOpsDbMetrics', options.params], queryFn: () => requests.adminOpsDbMetrics(options) })
