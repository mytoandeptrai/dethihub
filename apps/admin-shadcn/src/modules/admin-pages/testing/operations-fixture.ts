import { createAdminFixture } from '@/modules/admin-pages/testing/admin-fixture'
import demo from '@/modules/admin-pages/testing/operations-demo.json'

import type { lib_adminApi_AppSettings as AppSettings } from '@admin-pages-engine'
const ok = (json: unknown, status = 200) => ({ json, status })

export function createOperationsFixture() {
  const base = createAdminFixture(),
    data = { ...structuredClone(demo), settings: structuredClone(demo.settings) as AppSettings }
  let role: string | null = 'admin'
  const requests: { method: string; path: string; body: Record<string, unknown> }[] = []
  return {
    data,
    requests,
    setRole(value: string | null) {
      role = value
      base.setRole(value)
    },
    respond(method: string, rawUrl: string, body: Record<string, unknown> = {}) {
      const url = new URL(rawUrl, 'http://localhost:3000')
      const path = url.pathname
      requests.push({ method, path, body })
      if (method === 'OPTIONS') return ok(null, 204)
      if (path.startsWith('/api/admin/') && role !== 'admin')
        return ok({ status: 403, title: 'Forbidden', detail: 'Fixture access denied' }, 403)
      if (path === '/api/admin/stats/overview')
        return ok(
          data.stats[String(url.searchParams.get('days') ?? '7') as keyof typeof data.stats],
        )
      if (path === '/api/admin/stats/online') return ok(data.online)
      if (path === '/api/admin/settings') return ok(data.settings)
      if (path.startsWith('/api/admin/settings/') && method === 'PUT') {
        const key = decodeURIComponent(path.split('/').at(-1)!)
        const field = key === 'ai_welcome' ? 'aiWelcome' : key
        Object.assign(data.settings, { [field]: body.value })
        return ok({ value: body.value })
      }
      if (path === '/api/admin/ai/stats')
        return ok(url.searchParams.get('days') === '30' ? data.ai30 : data.ai)
      if (path === '/api/admin/ai/errors') return ok(data.errors)
      if (path === '/api/admin/ai/providers') return ok({ providers: data.targets.providers })
      if (path === '/api/admin/health/targets') return ok({ services: data.targets.services })
      if (path === '/api/admin/health') return ok(data.health)
      if (path === '/api/admin/db/metrics') return ok(data.db)
      const provider = path.match(/^\/api\/admin\/ai\/providers\/([^/]+)(\/ping)?$/)
      if (provider) {
        const selected = data.targets.providers.find((item) => item.provider === provider[1])
        if (!selected) return ok({ status: 404, title: 'Not found' }, 404)
        if (provider[2])
          return ok({
            ...data.health.providers.find((item) => item.provider === provider[1]),
            provider: provider[1],
          })
        if (method === 'PUT')
          Object.assign(selected, {
            model: body.model,
            endpoint: body.endpoint,
            custom: true,
            ...(body.apiKey ? { keyMask: 'fixture-••••' } : {}),
          })
        if (method === 'DELETE')
          Object.assign(
            selected,
            demo.targets.providers.find((item) => item.provider === provider[1]),
          )
        return method === 'DELETE' ? ok(null, 204) : ok({ providers: data.targets.providers })
      }
      if (path === '/api/admin/audit') {
        const page = Number(url.searchParams.get('page') ?? 1),
          perPage = Number(url.searchParams.get('perPage') ?? 20)
        return ok({
          items: data.audit.items.slice((page - 1) * perPage, page * perPage),
          total: data.audit.items.length,
        })
      }
      if (path === '/api/admin/payments') {
        const code = Number(url.searchParams.get('orderCode')),
          filter = url.searchParams.get('filter') ?? 'all'
        const items = data.payments.items.filter(
          (item) =>
            (!code || item.orderCode === code) &&
            (filter === 'all' ||
              (filter === 'attention'
                ? item.attention
                : filter === 'closed'
                  ? ['expired', 'cancelled', 'failed'].includes(item.status)
                  : item.status === filter)),
        )
        const page = Number(url.searchParams.get('page') ?? 1),
          perPage = Number(url.searchParams.get('perPage') ?? 20)
        return ok({
          ...data.payments,
          items: items.slice((page - 1) * perPage, page * perPage),
          total: items.length,
        })
      }
      const payment = path.match(/^\/api\/admin\/payments\/(\d+)\/(sync|credit)$/)
      if (payment) {
        const selected = data.payments.items.find((item) => item.orderCode === Number(payment[1]))
        if (!selected) return ok({ status: 404, title: 'Not found' }, 404)
        if (payment[2] === 'sync') return ok({ payos: 'PENDING', status: selected.status })
        if (typeof body.note !== 'string' || !body.note.trim())
          return ok({ status: 400, title: 'Invalid note' }, 400)
        Object.assign(selected, {
          status: 'paid',
          attention: false,
          reference: 'TAY ' + body.note,
          paidAt: new Date(data.now).toISOString(),
        })
        return ok(null, 204)
      }
      return base.respond(method, rawUrl, body)
    },
  }
}
