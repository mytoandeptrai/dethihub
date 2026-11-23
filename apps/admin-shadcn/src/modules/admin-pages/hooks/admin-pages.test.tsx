import { clearAdminCache } from '@admin-pages-engine'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdminContainer } from '@/modules/admin-pages/hooks/use-admin-container'
import { useAdminRequests } from '@/modules/admin-pages/hooks/use-admin-requests'
import {
  useContentPanelContainer,
  useDocsTabContainer,
  useExamsTabContainer,
  useFeedbackTabContainer,
  useReportsTabContainer,
} from '@/modules/admin-pages/hooks/use-content-panel-container'
import { useUsersPanelContainer } from '@/modules/admin-pages/hooks/use-users-panel-container'
import { createAdminFixture } from '@/modules/admin-pages/testing/admin-fixture'
import demo from '@/modules/admin-pages/testing/demo.json'
import { server } from '@/testing/msw/server'

import type { ReactNode } from 'react'

const dialogs = vi.hoisted(() => ({
  alert: vi.fn(async () => {}),
  confirm: vi.fn(async () => true),
  prompt: vi.fn(async () => 'Fixture reason'),
}))
vi.mock('@engine-dialogs', () => ({ dialog: dialogs }))
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }))
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: {
          session: {
            access_token: 'admin-fixture-token',
            user: { id: '00000000-0000-4000-8000-000000000000' },
          },
        },
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  }),
}))

let fixture: ReturnType<typeof createAdminFixture>
let client: QueryClient
const staff = { ...demo.me, role: 'admin' as const }
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
beforeEach(() => {
  clearAdminCache()
  vi.clearAllMocks()
  fixture = createAdminFixture()
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

describe('scoped admin typed API fixtures', () => {
  it('loads staff from /api/me without changing their account', async () => {
    const { result } = renderHook(() => useAdminContainer('users'), { wrapper })
    await waitFor(() => expect(result.current.me?.role).toBe('admin'))
    expect(fixture.requests.every((request) => request.method === 'GET')).toBe(true)
  })
  it('returns no protected model for a non-staff response', async () => {
    fixture.setRole(null)
    const { result } = renderHook(() => useAdminContainer('users'), { wrapper })
    await waitFor(() => expect(client.getQueryState(['me'])?.status).toBe('success'))
    expect(result.current.me).toBeNull()
    expect(fixture.requests.map((request) => request.path)).toEqual(['/api/me'])
  })
  it('maps paginated users and searches, including an empty response', async () => {
    const { result } = renderHook(() => useUsersPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.total).toBe(57)
    expect(result.current.users).toHaveLength(20)
    expect(result.current.users[1]?.name).toBe('Giáo viên 1')
    act(() => result.current.setPage(2))
    await waitFor(() => expect(result.current.users[0]?.email).toBe('giaovien20@example.com'))
    act(() => result.current.setSearch('does-not-exist'))
    await waitFor(() => expect(result.current.total).toBe(0))
    expect(result.current.users).toEqual([])
    expect(result.current.page).toBe(1)
  })
  it('refreshes a selected user from an uncached read without repeated requests', async () => {
    const { result } = renderHook(() => useUsersPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.users.length).toBe(20))
    act(() => result.current.setSelectedUser(result.current.users[1]!))
    fixture.data.users[1]!.name = 'Updated fixture name'
    clearAdminCache()
    await act(() => result.current.loadUsers())
    expect(result.current.selectedUser?.email).toBe('giaovien1@example.com')
    expect(result.current.selectedUser?.name).toBe('Updated fixture name')
    expect(fixture.requests.filter((request) => request.path === '/api/admin/users')).toHaveLength(
      2,
    )
  })
  it('propagates a real forbidden response without falling back to demo data', async () => {
    fixture.setRole(null)
    const { result } = renderHook(() => useAdminRequests(), { wrapper })
    await expect(result.current.listUsers()).rejects.toMatchObject({ status: 403 })
  })
  it('loads quotas, saves a limit, clears it and grants credits', async () => {
    const { result } = renderHook(() => useAdminRequests(), { wrapper }),
      id = staff.userId
    expect((await result.current.getQuota(id)).override).toBeNull()
    await act(() => result.current.setQuota(id, 42_000, 'Fixture quota'))
    expect((await result.current.getQuota(id)).override).toEqual({
      monthlyTokens: 42_000,
      note: 'Fixture quota',
    })
    await act(() => result.current.clearQuota(id))
    expect((await result.current.getQuota(id)).override).toBeNull()
    const before = (await result.current.getQuota(id)).credits
    await act(() => result.current.grantCredits(id, 1000, 'Fixture credits'))
    expect((await result.current.getQuota(id)).credits).toBe(before + 1000)
  })
  it('saves and resets a storage override', async () => {
    const { result } = renderHook(() => useAdminRequests(), { wrapper }),
      id = staff.userId
    await act(() => result.current.setStorage(id, 1_048_576, 'Fixture storage'))
    expect((await result.current.getStorage(id)).override?.maxBytes).toBe(1_048_576)
    await act(() => result.current.setStorage(id, null, ''))
    expect((await result.current.getStorage(id)).override).toBeNull()
  })
  it('bans, unbans, clears a flag and deletes only fixture users', async () => {
    const { result } = renderHook(() => useAdminRequests(), { wrapper }),
      user = demo.users[7]!
    await act(() => result.current.banUser(user.id, { hours: 24, reason: 'Fixture reason' }))
    await act(() => result.current.unbanUser(user.id))
    await act(() => result.current.clearSecurityFlag(user.id))
    const updated = (await result.current.listUsers({ q: user.email })).users[0]
    expect(updated?.bannedUntil).toBeNull()
    expect(updated?.flag).toBeNull()
    await act(() => result.current.deleteUser(user.id, user.email))
    expect((await result.current.listUsers({ q: user.email })).total).toBe(0)
  })
  it('rejects deletion with an incorrect confirmation email', async () => {
    const { result } = renderHook(() => useAdminRequests(), { wrapper })
    await expect(
      result.current.deleteUser(demo.users[7]!.id, 'wrong@example.com'),
    ).rejects.toMatchObject({ status: 400 })
    expect(fixture.data.users).toHaveLength(57)
  })
  it('loads and filters exams and reads their preview document', async () => {
    const { result } = renderHook(() => useExamsTabContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.exams).toHaveLength(8)
    const { result: api } = renderHook(() => useAdminRequests(), { wrapper })
    expect((await api.current.getContentExam(demo.exams[0]!.id)).exam.doc.blocks).toHaveLength(2)
    act(() => result.current.setStatusFilter('hidden'))
    await waitFor(() =>
      expect(result.current.exams.every((exam) => exam.status === 'hidden')).toBe(true),
    )
  })
  it('updates exam status and deletes the fixture exam', async () => {
    const { result } = renderHook(() => useAdminRequests(), { wrapper }),
      id = demo.exams[0]!.id
    await act(() => result.current.setContentExamStatus(id, 'hidden', 'Fixture reason'))
    expect(
      (await result.current.listContentExams({ status: 'hidden' })).exams.some(
        (exam) => exam.id === id,
      ),
    ).toBe(true)
    await act(() => result.current.deleteContentExam(id))
    expect((await result.current.listContentExams()).exams.some((exam) => exam.id === id)).toBe(
      false,
    )
  })
  it('lists open reports and resolves one', async () => {
    const { result } = renderHook(() => useReportsTabContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.reports.length).toBeGreaterThan(0))
    const id = result.current.reports[0]!.id
    await act(() => result.current.handleResolve(id, 'resolved'))
    await waitFor(() =>
      expect(result.current.reports.some((report) => report.id === id)).toBe(false),
    )
  })
  it('loads storage totals and deletes only the fixture document', async () => {
    const { result } = renderHook(() => useDocsTabContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.docs).toHaveLength(6))
    expect(result.current.topUsers.length).toBeGreaterThan(0)
    await act(() => result.current.handleDelete(result.current.docs[0]!))
    await waitFor(() => expect(result.current.docs).toHaveLength(5))
  })
  it('loads unread feedback and toggles it read', async () => {
    const { result } = renderHook(() => useFeedbackTabContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.feedback).toHaveLength(5))
    const { result: api } = renderHook(() => useAdminRequests(), { wrapper }),
      id = result.current.feedback[0]!.id
    await act(() => api.current.markContentFeedbackRead(id, true))
    expect(
      (await api.current.listContentFeedback({ read: true })).feedback.some(
        (item) => item.id === id,
      ),
    ).toBe(true)
  })
  it('restricts moderator content tabs', () => {
    const { result } = renderHook(
      () => useContentPanelContainer({ me: { ...staff, role: 'moderator' } }),
      { wrapper },
    )
    expect(result.current.tabOptions.map((tab) => tab.key)).toEqual(['exams', 'reports'])
    act(() => result.current.setTab('docs'))
    expect(result.current.tab).toBe('exams')
  })
  it('represents empty content lists without inventing rows', async () => {
    fixture.data.exams = []
    fixture.data.reports = []
    fixture.data.documents.docs = []
    fixture.data.feedback = []
    const { result } = renderHook(() => useAdminRequests(), { wrapper })
    expect((await result.current.listContentExams()).exams).toEqual([])
    expect((await result.current.listContentReports()).reports).toEqual([])
    expect((await result.current.listContentDocs()).docs).toEqual([])
    expect((await result.current.listContentFeedback()).feedback).toEqual([])
  })
  it('surfaces failed user reads in the source error dialog', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(
      http.get('http://localhost:3000/api/admin/users', () =>
        HttpResponse.json(
          { status: 503, title: 'Service unavailable', detail: 'Fixture unavailable' },
          { status: 503 },
        ),
      ),
    )
    const { result } = renderHook(() => useUsersPanelContainer({ me: staff }), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.users).toEqual([])
    expect(dialogs.alert).toHaveBeenCalledWith(
      expect.stringContaining('Fixture unavailable'),
      expect.anything(),
    )
    expect(logged).toHaveBeenCalledOnce()
    logged.mockRestore()
  })
  it('saves, hides, restores and reverts a bank override', async () => {
    const { result } = renderHook(() => useAdminRequests(), { wrapper })
    const entry = (await result.current.listBankOverrides())[0]!.data
    await act(() =>
      result.current.saveBankQuestion({ ...entry, prompt: 'Fixture question' }, 'published'),
    )
    expect(
      (await result.current.listBankOverrides()).find((row) => row.id === entry.id)?.data.prompt,
    ).toBe('Fixture question')
    await act(() => result.current.hideBankQuestion(entry.id, entry))
    expect(
      (await result.current.listBankOverrides()).find((row) => row.id === entry.id)?.status,
    ).toBe('hidden')
    await act(() => result.current.unhideBankQuestion(entry.id))
    expect(
      (await result.current.listBankOverrides()).find((row) => row.id === entry.id)?.status,
    ).toBe('published')
    await act(() => result.current.revertBankQuestion(entry.id))
    expect((await result.current.listBankOverrides()).some((row) => row.id === entry.id)).toBe(
      false,
    )
  })
  it.each([
    '/api/admin/users',
    '/api/admin/exams',
    '/api/admin/reports',
    '/api/admin/documents',
    '/api/admin/feedback',
    '/api/admin/bank/overrides',
  ])('forbids %s in the fixture without changing data', (path) => {
    fixture.setRole(null)
    expect(fixture.respond('GET', path).status).toBe(403)
    expect(fixture.data.users).toHaveLength(57)
  })
})
