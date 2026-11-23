import * as api from '@/apis/admin/requests'
import type * as Input from '@/apis/admin/types'
import { getMe } from '@/apis/me/requests'

export async function adminRequest(action: string, body: Record<string, unknown>): Promise<unknown> {
  const user = { params: { path: { id: String(body.userId) } } }
  const exam = { params: { path: { id: String(body.examId) } } }
  const id = { params: { path: { id: String(body.id) } } }
  const provider = { params: { path: { provider: String(body.provider) } } }
  const order = { params: { path: { orderCode: Number(body.orderCode) } } }
  const query = { params: { query: body } }
  const ok = { ok: true }
  const page = <T extends { items: unknown[]; total: number }>(result: T, key: string) => ({ ...result, [key]: result.items, page: Number(body.page ?? 1), perPage: Number(body.perPage ?? 20) })
  switch (action) {
    case 'me': {
      const me = await getMe()
      if (me.role !== 'admin' && me.role !== 'moderator') throw new Error('Bạn không có quyền truy cập.')
      return me
    }
    case 'users.list': {
      const result = await api.adminUserList(query as Input.AdminUserListInput)
      return page({ ...result, items: result.items.map((row) => ({ ...row, name: row.displayName, avatar: row.avatarUrl, flag: row.strikes ? { strikes: row.strikes, lastAt: row.lockedUntil, lastAction: row.lastAction, lastIp: null } : null })) }, 'users')
    }
    case 'users.ban': await api.adminUserBan({ ...user, body: { hours: body.hours, reason: body.reason } as Input.AdminUserBanInput['body'] }); return ok
    case 'users.unban': await api.adminUserUnban(user); return ok
    case 'security.clear': await api.adminUserClearFlag(user); return ok
    case 'users.delete': await api.adminUserRemove({ ...user, body: { confirmEmail: String(body.confirmEmail) } }); return { ...ok, filesRemoved: 0 }
    case 'quota.get': return api.aiAdminGetQuota(user)
    case 'quota.set': await api.aiAdminSetQuota({ ...user, body: { monthlyTokens: body.monthlyTokens, note: body.note } as Input.AiAdminSetQuotaInput['body'] }); return ok
    case 'quota.clear': await api.aiAdminClearQuota(user); return ok
    case 'credits.grant': return { ...ok, ...await api.aiAdminGrantCredits({ ...user, body: { tokens: Number(body.tokens), note: body.note as string | undefined } }) }
    case 'storage.get': return api.storageAdminGetUser(user)
    case 'storage.set': await api.storageAdminSetUser({ ...user, body: { maxBytes: body.maxBytes, note: body.note } as Input.StorageAdminSetUserInput['body'] }); return ok
    case 'audit.list': return page(await api.adminUserAudit(query as Input.AdminUserAuditInput), 'items')
    case 'settings.get': return api.adminSettingsGetAll({})
    case 'settings.set': return { ...ok, ...await api.adminSettingsSet({ params: { path: { key: String(body.key) as Input.AdminSettingsSetInput['params']['path']['key'] } }, body: { value: body.value } as Input.AdminSettingsSetInput['body'] }) }
    case 'ai.stats': return api.aiAdminStats(query as Input.AiAdminStatsInput)
    case 'ai.errors': return api.aiAdminErrors(query as Input.AiAdminErrorsInput)
    case 'health.targets': return { ...await api.adminOpsTargets({}), ...await api.aiAdminProviders({}) }
    case 'ai.saveProvider': return api.aiAdminSaveProvider({ ...provider, body: { model: body.model, endpoint: body.endpoint, apiKey: body.apiKey } as Input.AiAdminSaveProviderInput['body'] })
    case 'ai.resetProvider': await api.aiAdminResetProvider(provider); return api.aiAdminProviders({})
    case 'health': {
      const target = body.target as string | undefined
      const services = !target || target === 'supabase' || target === 'r2' ? await api.adminOpsHealth({ params: { query: { target: target as 'supabase' | 'r2' | undefined } } }) : {}
      const providers = !target ? (await api.aiAdminProviders({})).providers.map((item) => item.provider) : target === 'supabase' || target === 'r2' ? [] : [target]
      return { ...services, providers: await Promise.all(providers.map((name) => api.aiAdminPing({ params: { path: { provider: name } } }))), checkedAt: new Date().toISOString() }
    }
    case 'db.metrics': return api.adminOpsDbMetrics({})
    case 'content.exams.list': return page(await api.examAdminList(query as Input.ExamAdminListInput), 'exams')
    case 'content.exams.get': return { exam: await api.examAdminGet(exam) }
    case 'content.exams.setStatus': await api.examAdminSetStatus({ ...exam, body: { status: body.status, reason: body.reason } as Input.ExamAdminSetStatusInput['body'] }); return ok
    case 'content.exams.delete': await api.examAdminRemove(exam); return ok
    case 'content.reports.list': return page(await api.examAdminListReports(query as Input.ExamAdminListReportsInput), 'reports')
    case 'content.reports.resolve': await api.examAdminResolveReport({ params: { path: { id: Number(body.reportId) } }, body: { status: body.status } as Input.ExamAdminResolveReportInput['body'] }); return ok
    case 'content.docs.list': return page(await api.storageAdminListDocuments(query as Input.StorageAdminListDocumentsInput), 'docs')
    case 'content.docs.delete': { const result = await api.storageAdminDeleteDocument({ params: { path: { id: String(body.docId) } } }); return { ...ok, r2Removed: result.fileRemoved } }
    case 'content.feedback.list': return page(await api.adminFeedbackList(query as Input.AdminFeedbackListInput), 'feedback')
    case 'content.feedback.markRead': await api.adminFeedbackMarkRead({ params: { path: { id: Number(body.feedbackId) } }, body: { read: Boolean(body.read) } }); return ok
    case 'payments.list': {
      const result = await api.paymentAdminList(query as Input.PaymentAdminListInput)
      const { day, week, month, all, prevDay, prevWeek, prevMonth, months } = result.revenue
      const revenue = {
        day: day.vnd, week: week.vnd, month: month.vnd, all: all.vnd,
        counts: { day: day.count, week: week.count, month: month.count, all: all.count },
        paidCount: all.count,
        prev: { day: prevDay, week: prevWeek, month: prevMonth },
        months,
      }
      return page({ ...result, revenue }, 'items')
    }
    case 'payments.sync': return api.paymentAdminSync(order)
    case 'payments.credit': await api.paymentAdminCredit({ ...order, body: { note: String(body.note ?? '') } }); return ok
    case 'stats.overview': return api.adminOpsOverview(query as Input.AdminOpsOverviewInput)
    case 'stats.online': return api.adminOpsOnline({})
    case 'bank.overrides.list': return { overrides: (await api.adminBankOverrides({})).map((row) => ({ ...row, updated_at: row.updatedAt, updated_by: row.updatedBy })) }
    case 'bank.save': {
      const entry = body.entry as Record<string, unknown>
      const payload = { entry, status: body.status } as Input.AdminBankCreateInput['body']
      const result = entry.id ? await api.adminBankUpdate({ params: { path: { id: String(entry.id) } }, body: payload }) : await api.adminBankCreate({ body: payload })
      return { ...ok, ...result }
    }
    case 'bank.hide': await api.adminBankHide({ ...id, body: { entry: body.entry } as Input.AdminBankHideInput['body'] }); return ok
    case 'bank.unhide': await api.adminBankUnhide(id); return ok
    case 'bank.revert': await api.adminBankRevert(id); return ok
    default: throw new Error('Unsupported admin action: ' + action)
  }
}
