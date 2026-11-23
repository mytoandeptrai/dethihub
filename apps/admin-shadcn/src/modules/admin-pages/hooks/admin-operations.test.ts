import { clearAdminCache } from '@admin-pages-engine'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdminOperationsRequests } from '@/modules/admin-pages/hooks/use-admin-operations-requests'
import { useAnnouncementPreview } from '@/modules/admin-pages/hooks/use-announcement-preview'
import { useAnnouncementsEditorContainer } from '@/modules/admin-pages/hooks/use-announcements-editor-container'
import { useAuditPanelContainer } from '@/modules/admin-pages/hooks/use-audit-panel-container'
import { useDbStatusCardContainer } from '@/modules/admin-pages/hooks/use-db-status-card-container'
import { useProviderFormContainer } from '@/modules/admin-pages/hooks/use-health-drawer-container'
import { useOpsPanelContainer } from '@/modules/admin-pages/hooks/use-ops-panel-container'
import { usePaymentsPanelContainer } from '@/modules/admin-pages/hooks/use-payments-panel-container'
import { usePricingEditorContainer } from '@/modules/admin-pages/hooks/use-pricing-editor-container'
import { useStatsPanelContainer } from '@/modules/admin-pages/hooks/use-stats-panel-container'
import { useWelcomePointsCardContainer } from '@/modules/admin-pages/hooks/use-welcome-points-card-container'
import { createOperationsFixture } from '@/modules/admin-pages/testing/operations-fixture'
import { server } from '@/testing/msw/server'

import type { ReactNode } from 'react'

const dialogs = vi.hoisted(() => ({
  alert: vi.fn(async () => {}),
  confirm: vi.fn(async () => true),
  prompt: vi.fn(async () => 'Fixture reconciliation'),
}))
vi.mock('@engine-dialogs', () => ({ dialog: dialogs }))
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }))
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: 'fixture-token', user: { id: 'fixture-staff' } } },
      }),
    },
  }),
}))
let client: QueryClient, fixture: ReturnType<typeof createOperationsFixture>
const staff = { userId: 'fixture-staff', role: 'admin' as const }
function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client }, children)
}
beforeEach(() => {
  clearAdminCache()
  vi.clearAllMocks()
  fixture = createOperationsFixture()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  server.use(
    http.all('http://localhost:3000/api/*', async ({ request }) => {
      const raw = await request.text(),
        response = fixture.respond(request.method, request.url, raw ? JSON.parse(raw) : {})
      return response.status === 204
        ? new HttpResponse(null, { status: 204 })
        : new HttpResponse(JSON.stringify(response.json), {
            status: response.status,
            headers: { 'content-type': 'application/json' },
          })
    }),
  )
})

describe('remaining admin panels with isolated source fixtures', () => {
  it('loads stats and online users, changes date range and opens modal', async () => {
    const { result } = renderHook(() => useStatsPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await waitFor(() => expect(result.current.onlineUsers).toHaveLength(4))
    expect(result.current.chartDays).toHaveLength(7)
    act(() => result.current.setDays('30'))
    await waitFor(() => expect(result.current.chartDays).toHaveLength(30))
    act(() => result.current.handleOpenOnlineModal())
    expect(result.current.showOnlineModal).toBe(true)
  })
  it('handles empty stats and online lists', async () => {
    fixture.data.stats[7].chartDays = []
    fixture.data.online.users = []
    fixture.data.online.onlineCount = 0
    const { result } = renderHook(() => useStatsPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.chartDays).toEqual([])
    expect(result.current.onlineUsers).toEqual([])
    expect(result.current.newUsersInPeriod).toBe(0)
  })
  it('keeps denied stats concealed without stuck loading', async () => {
    fixture.setRole(null)
    const { result } = renderHook(() => useStatsPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats).toBeNull()
    expect(result.current.onlineUsers).toEqual([])
  })
  it('loads payment filters and applies order search only on refresh', async () => {
    const { result } = renderHook(usePaymentsPanelContainer, { wrapper })
    await waitFor(() => expect(result.current.items).toHaveLength(5))
    act(() => result.current.setCode('100006'))
    expect(result.current.items).toHaveLength(5)
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(result.current.items[0]?.orderCode).toBe(100_006)
    act(() => result.current.setFilter('paid'))
    await waitFor(() => expect(result.current.items).toHaveLength(0))
  })
  it('syncs pending order and credits only with a reconciliation note', async () => {
    const { result } = renderHook(usePaymentsPanelContainer, { wrapper })
    await waitFor(() => expect(result.current.items).toHaveLength(5))
    const pending = result.current.items.find((row) => row.status === 'pending')!
    await act(() => result.current.sync(pending))
    expect(dialogs.alert).toHaveBeenCalled()
    await act(() => result.current.credit(pending))
    await waitFor(() =>
      expect(
        fixture.data.payments.items.find((row) => row.orderCode === pending.orderCode)?.status,
      ).toBe('paid'),
    )
    expect(fixture.requests.find((row) => row.path.endsWith('/credit'))?.body.note).toBe(
      'Fixture reconciliation',
    )
  })
  it('does not credit an order after a blank/cancelled note', async () => {
    dialogs.prompt.mockResolvedValueOnce('')
    const { result } = renderHook(usePaymentsPanelContainer, { wrapper })
    await waitFor(() => expect(result.current.items).toHaveLength(5))
    await act(() => result.current.credit(result.current.items[1]!))
    expect(fixture.requests.some((row) => row.path.endsWith('/credit'))).toBe(false)
  })
  it('surfaces payment errors and stops loading', async () => {
    fixture.setRole(null)
    const { result } = renderHook(usePaymentsPanelContainer, { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(dialogs.alert).toHaveBeenCalled()
    expect(result.current.items).toEqual([])
  })
  it('loads operations settings, charts, errors and health targets', async () => {
    const { result } = renderHook(() => useOpsPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loadingStats).toBe(false))
    await waitFor(() => expect(result.current.healthRows.length).toBeGreaterThan(0))
    await waitFor(() => expect(result.current.loadingSettings).toBe(false))
    expect(result.current.totalCalls).toBeGreaterThan(0)
    await act(() => result.current.handleRunHealth())
    expect(Object.keys(result.current.healthResults).length).toBeGreaterThan(0)
  })
  it('handles empty AI stats and error lists', async () => {
    fixture.data.ai.rows = []
    fixture.data.errors.items = []
    const { result } = renderHook(() => useOpsPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loadingStats).toBe(false))
    expect(result.current.totalCalls).toBe(0)
    expect(result.current.modelStats).toEqual([])
    expect(result.current.aiErrors).toEqual([])
  })
  it('saves maintenance settings after confirming activation', async () => {
    const { result } = renderHook(() => useOpsPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loadingSettings).toBe(false))
    await act(() => result.current.handleToggleMaintenance(true))
    act(() => result.current.setMaintMessage('Fixture maintenance'))
    await act(() => result.current.handleSaveMaintenance())
    expect(fixture.data.settings.maintenance.on).toBe(true)
    expect(fixture.data.settings.maintenance.message).toBe('Fixture maintenance')
  })
  it('edits, saves and resets provider; password remains blank', async () => {
    const onSaved = vi.fn(),
      provider = fixture.data.targets.providers[0]!
    const { result } = renderHook(
      () => useProviderFormContainer({ provider, onCancel: vi.fn(), onSaved }),
      { wrapper },
    )
    expect(result.current.apiKey).toBe('')
    expect(result.current.dirty).toBe(false)
    act(() => result.current.setModel('fixture-model'))
    await act(() => result.current.save())
    expect(fixture.data.targets.providers[0]?.model).toBe('fixture-model')
    expect(onSaved).toHaveBeenCalled()
    await act(() => result.current.reset())
    expect(dialogs.confirm).toHaveBeenCalled()
  })
  it('requires a fresh key after changing provider endpoint', () => {
    const { result } = renderHook(
      () =>
        useProviderFormContainer({
          provider: fixture.data.targets.providers[0]!,
          onCancel: vi.fn(),
          onSaved: vi.fn(),
        }),
      { wrapper },
    )
    act(() => result.current.setEndpoint('https://fixture.invalid/v1'))
    expect(result.current.needKey).toBe(true)
    act(() => result.current.setApiKey('fixture-value'))
    expect(result.current.needKey).toBe(false)
  })
  it('rejects overlong provider configuration before sending a mutation', async () => {
    const { result } = renderHook(
      () =>
        useProviderFormContainer({
          provider: fixture.data.targets.providers[0]!,
          onCancel: vi.fn(),
          onSaved: vi.fn(),
        }),
      { wrapper },
    )
    act(() => result.current.setModel('x'.repeat(101)))
    await act(() => result.current.save())
    expect(dialogs.alert).toHaveBeenCalled()
    expect(fixture.requests.some((request) => request.method === 'PUT')).toBe(false)
  })
  it('loads DB metrics and refreshes through typed adapter', async () => {
    const { result } = renderHook(useDbStatusCardContainer, { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.st?.name).toBe('Primary Database')
    fixture.data.db.cpu = 37
    act(() => result.current.load(true))
    await waitFor(() => expect(result.current.st?.cpu).toBe(37))
  })
  it('reports DB errors', async () => {
    fixture.setRole(null)
    const { result } = renderHook(useDbStatusCardContainer, { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.err).toBeTruthy()
    expect(result.current.st).toBeNull()
  })
  it('loads, pages and handles an empty audit', async () => {
    const { result } = renderHook(useAuditPanelContainer, { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(3)
    fixture.data.audit.items = []
    clearAdminCache()
    act(() => result.current.setReloadTick((current) => current + 1))
    await waitFor(() => expect(result.current.items).toEqual([]))
  })
  it('saves pricing through settings API', async () => {
    const onNotice = vi.fn()
    const { result } = renderHook(
      () => usePricingEditorContainer({ initial: fixture.data.settings.pricing, onNotice }),
      { wrapper },
    )
    act(() => result.current.setRate('30'))
    await act(() => result.current.save())
    expect(fixture.data.settings.pricing?.pointsPer1000).toBe(30)
    expect(onNotice).toHaveBeenCalled()
  })
  it('validates and saves welcome points without real credits', async () => {
    const { result } = renderHook(
      () => useWelcomePointsCardContainer({ initial: 5, onNotice: vi.fn() }),
      { wrapper },
    )
    act(() => result.current.setValue('10001'))
    await act(() => result.current.save())
    expect(dialogs.alert).toHaveBeenCalled()
    act(() => result.current.setValue('25'))
    await act(() => result.current.save())
    expect(fixture.data.settings.aiWelcome?.points).toBe(25)
  })
  it('reorders, edits and saves announcements', async () => {
    const initial = [
      { id: 'a', on: true, title: 'First', text: '', image: '', tryPath: '', until: null },
      { id: 'b', on: true, title: 'Second', text: '', image: '', tryPath: '', until: null },
    ]
    const { result } = renderHook(
      () => useAnnouncementsEditorContainer({ initial, onNotice: vi.fn() }),
      { wrapper },
    )
    act(() => result.current.move(0, 1))
    expect(result.current.items[0]?.id).toBe('b')
    act(() => result.current.patch('b', { title: 'Edited fixture' }))
    await act(() => result.current.save())
    expect(fixture.data.settings.announcements.items[0]?.title).toBe('Edited fixture')
  })
  it('clamps announcement preview navigation and excludes disabled/expired items', () => {
    const items = [
      { id: 'a', on: true, title: 'First', text: '', image: '', tryPath: '', until: null },
      { id: 'b', on: false, title: 'Hidden', text: '', image: '', tryPath: '', until: null },
    ]
    const { result } = renderHook(() => useAnnouncementPreview(items))
    act(() => result.current.go(2))
    expect(result.current.index).toBe(0)
    expect(result.current.shown).toHaveLength(1)
  })
  it.each([403, 503])('propagates fixture %i from typed request gateway', async (status) => {
    server.use(
      http.get('http://localhost:3000/api/admin/payments', () =>
        HttpResponse.json(
          { status, title: 'Fixture error', detail: 'Fixture unavailable' },
          { status },
        ),
      ),
    )
    const { result } = renderHook(useAdminOperationsRequests, { wrapper })
    await expect(result.current.listPayments()).rejects.toThrow('Fixture unavailable')
  })
})
