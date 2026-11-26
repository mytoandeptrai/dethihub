import demo from '@/modules/admin-pages/testing/demo.json'

import type {
  lib_adminApi_UserQuota as UserQuota,
  lib_adminApi_UserStorage as UserStorage,
  lib_adminBankApi_BankQuestionRow as BankRow,
} from '@admin-pages-engine'

function paginate(items: unknown[], url: URL, extra = {}) {
  const page = Number(url.searchParams.get('page') ?? 1)
  const perPage = Number(url.searchParams.get('perPage') ?? 20)
  return {
    items: items.slice((page - 1) * perPage, page * perPage),
    total: items.length,
    ...extra,
  }
}
function ok(json: unknown, status = 200) {
  return { status, json }
}
export function createAdminFixture() {
  const data = structuredClone(demo)
  const quotas = new Map<string, UserQuota>(Object.entries(data.quotas))
  let storage: UserStorage = structuredClone(data.storage)
  let overrides = structuredClone(demo.overrides) as BankRow[]
  const requests: { method: string; path: string; body: Record<string, unknown> }[] = []
  let role: string | null = 'admin'
  return {
    data,
    requests,
    setRole(value: string | null) {
      role = value
    },
    respond(method: string, rawUrl: string, body: Record<string, unknown> = {}) {
      const url = new URL(rawUrl, 'http://localhost:3000')
      const path = url.pathname
      requests.push({ method, path, body })
      if (method === 'OPTIONS') return ok(null, 204)
      if (path === '/api/me') return ok({ ...data.me, role })
      if (path === '/api/site/status')
        return ok({ maintenance: { on: false, message: '' }, announcements: [] })
      if (path === '/api/presence') return ok(null, 204)
      if (path === '/api/ai/quota')
        return ok({
          unlimited: false,
          granted: 0,
          quota: { scope: 'month', used: 0, limit: 120_000, base: 120_000, credits: 0 },
        })
      if (path.startsWith('/api/workspace/items'))
        return ok(method === 'GET' ? [] : null, method === 'GET' ? 200 : 204)
      if (path.startsWith('/api/admin/') && !role)
        return ok({ statusCode: 403, message: 'Forbidden' }, 403)
      const q = (url.searchParams.get('q') ?? '').toLowerCase()
      if (path === '/api/admin/users' && method === 'GET')
        return ok(
          paginate(
            data.users
              .filter((user) => (user.name + ' ' + user.email).toLowerCase().includes(q))
              .map((user) =>
                Object.assign({}, user, {
                  displayName: user.name,
                  avatarUrl: user.avatar,
                  strikes: user.flag?.strikes ?? 0,
                  lockedUntil: user.flag?.lastAt ?? null,
                  lastAction: user.flag?.lastAction ?? null,
                }),
              ),
            url,
          ),
        )
      const userAction = path.match(/^\/api\/admin\/users\/([^/]+)(?:\/(ban|security-flags))?$/)
      if (userAction) {
        const user = data.users.find((candidate) => candidate.id === userAction[1])
        if (!user) return ok({ message: 'Not found' }, 404)
        if (userAction[2] === 'ban')
          user.bannedUntil = method === 'DELETE' ? null : '2126-01-01T00:00:00Z'
        else if (userAction[2] === 'security-flags') user.flag = null
        else if (method === 'DELETE') {
          if (body.confirmEmail !== user.email) return ok({ message: 'Email mismatch' }, 400)
          data.users.splice(data.users.indexOf(user), 1)
        }
        return ok(null, 204)
      }
      if (path === '/api/admin/ai/stats') return ok(data.stats)
      const quota = path.match(/^\/api\/admin\/ai\/users\/([^/]+)\/(quota|credits)$/)
      if (quota) {
        const value = quotas.get(quota[1] ?? '')
        if (!value) return ok({ message: 'Not found' }, 404)
        if (quota[2] === 'credits') {
          value.credits += Number(body.tokens)
          return ok({ balance: value.credits })
        }
        if (method === 'PUT')
          value.override = {
            monthlyTokens: body.monthlyTokens === null ? null : Number(body.monthlyTokens),
            note: String(body.note ?? ''),
          }
        if (method === 'DELETE') value.override = null
        return ok(value)
      }
      if (path.startsWith('/api/admin/storage/users/')) {
        if (method === 'PUT')
          storage = {
            ...storage,
            override:
              body.maxBytes === null
                ? null
                : { maxBytes: Number(body.maxBytes), note: String(body.note ?? '') },
          }
        return ok(storage)
      }
      if (path === '/api/admin/exams' && method === 'GET')
        return ok(
          paginate(
            data.exams.filter(
              (exam) =>
                (exam.title + ' ' + exam.school).toLowerCase().includes(q) &&
                (!url.searchParams.get('status') ||
                  exam.status === url.searchParams.get('status')) &&
                (!url.searchParams.get('subject') ||
                  exam.subject === url.searchParams.get('subject')),
            ),
            url,
          ),
        )
      const exam = path.match(/^\/api\/admin\/exams\/([^/]+)(?:\/status)?$/)
      if (exam) {
        const row = data.exams.find((candidate) => candidate.id === exam[1])
        if (!row) return ok({ message: 'Not found' }, 404)
        if (method === 'GET') return ok(data.details[row.id as keyof typeof data.details])
        if (method === 'DELETE') data.exams.splice(data.exams.indexOf(row), 1)
        if (method === 'PATCH') row.status = String(body.status)
        return ok(null, 204)
      }
      if (path === '/api/admin/reports')
        return ok(
          paginate(
            data.reports.filter(
              (row) =>
                !url.searchParams.get('status') || row.status === url.searchParams.get('status'),
            ),
            url,
          ),
        )
      if (path.startsWith('/api/admin/reports/')) {
        const row = data.reports.find(
          (candidate) => String(candidate.id) === path.split('/').at(-1),
        )
        if (row) row.status = String(body.status)
        return ok(null, 204)
      }
      if (path === '/api/admin/documents')
        return ok(
          paginate(
            data.documents.docs.filter((row) =>
              (row.name + ' ' + row.ownerEmail).toLowerCase().includes(q),
            ),
            url,
            { topUsers: data.documents.topUsers },
          ),
        )
      if (path.startsWith('/api/admin/documents/')) {
        data.documents.docs = data.documents.docs.filter((row) => row.id !== path.split('/').at(-1))
        return ok({ fileRemoved: true })
      }
      if (path === '/api/admin/feedback')
        return ok(
          paginate(
            data.feedback.filter(
              (row) =>
                !url.searchParams.has('read') ||
                row.read === (url.searchParams.get('read') === 'true'),
            ),
            url,
          ),
        )
      if (path.startsWith('/api/admin/feedback/')) {
        const row = data.feedback.find(
          (candidate) => String(candidate.id) === path.split('/').at(-2),
        )
        if (row) row.read = Boolean(body.read)
        return ok(null, 204)
      }
      if (path === '/api/admin/bank/overrides')
        return ok(
          overrides.map((row) => ({
            ...row,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
          })),
        )
      if (path === '/api/bank/overrides') return ok(overrides)
      if (path.startsWith('/api/admin/bank/questions')) {
        const id = path.split('/')[5] ?? 'fixture-bank-created'
        const old = overrides.find((row) => row.id === id)
        if (method === 'DELETE') overrides = overrides.filter((row) => row.id !== id)
        else {
          const entry = { ...(body.entry ?? old?.data), id } as BankRow['data']
          const row: BankRow = {
            id,
            data: entry,
            status: path.endsWith('/hide') || body.status === 'hidden' ? 'hidden' : 'published',
            updated_at: '2026-11-10T09:00:00Z',
            updated_by: data.me.userId,
          }
          overrides = [...overrides.filter((candidate) => candidate.id !== id), row]
          return ok({ ok: true, entry })
        }
        return ok(null, 204)
      }
      return ok({ message: 'Unhandled fixture endpoint: ' + method + ' ' + path }, 501)
    },
  }
}
