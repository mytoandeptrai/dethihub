import {
  defaultMeta,
  lib_importFile_readImportFile as readImportFile,
  lib_onlineExam_newQuestion as newQuestion,
  store_online_useOnline as useOnline,
} from '@online-exams-engine'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { examsKeys } from '@/apis/exams'
import { useOnlineBuilderContainer } from '@/modules/online-exams/hooks/use-online-builder-container'
import { useOnlinePublication } from '@/modules/online-exams/hooks/use-online-publication'
import {
  usePublishedPanelContainer,
  useOnlineResultsContainer,
} from '@/modules/online-exams/hooks/use-published-data-container'
import { server } from '@/testing/msw/server'

import type { ReactNode } from 'react'

const auth = vi.hoisted(() => ({ session: null as unknown }))
const route = vi.hoisted(() => ({ id: '', push: vi.fn(), replace: vi.fn() }))
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: async () => ({ data: { session: auth.session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  }),
}))
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: route.id }),
  usePathname: () => '/online-exams',
  useRouter: () => ({ push: route.push, replace: route.replace }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}))
vi.mock('@engine-dialogs', () => ({ dialog: { confirm: vi.fn(async () => true) } }))

const remoteId = '11111111-1111-4111-8111-111111111111'
const card = {
  id: remoteId,
  ownerId: null,
  title: 'Đề thử',
  subject: 'Toán',
  grade: '10',
  school: '',
  createdAt: '2026-01-01T00:00:00Z',
  questionCount: 1,
  durationMinutes: 45,
  totalPoints: 10,
  preview: '',
  listed: false,
  missingKeys: null,
}
const attempt = {
  id: 'attempt-one',
  examId: remoteId,
  userId: null,
  studentName: 'An',
  score: 8,
  maxScore: 10,
  durationSeconds: 60,
  createdAt: '2026-01-02T00:00:00Z',
  deviceId: 'device-one',
  className: '10A1',
  seatNo: 1,
}
let client: QueryClient
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
function localExam() {
  const question = newQuestion('trac-nghiem')
  const id = useOnline.getState().create({
    meta: { ...defaultMeta(), title: 'Đề thử' },
    questions: [
      {
        ...question,
        prompt: 'Một cộng một bằng bao nhiêu?',
        options: question.options?.map((option) => ({ key: option.key, text: option.key })),
        answer: 'A',
      },
    ],
  })
  return useOnline.getState().items.find((item) => item.id === id)!
}
beforeEach(() => {
  vi.clearAllMocks()
  window.history.replaceState({}, '', '/online-exams')
  route.id = remoteId
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  useOnline.setState({ items: [] })
  auth.session = {
    access_token: 'test-token',
    expires_at: 9_999_999_999,
    user: { id: 'online-user', user_metadata: {} },
  }
})

describe('online publication mutations', () => {
  it('keeps anonymous publishing local and requests sign-in before any private mutation', async () => {
    auth.session = null
    const item = localExam()
    const writes = vi.fn()
    server.use(
      http.post('http://localhost:3000/api/me/exams', () => {
        writes()
        return HttpResponse.json(card)
      }),
    )
    const hook = renderHook(useOnlinePublication, { wrapper })
    await act(async () => {
      await expect(hook.result.current.publish(item, false)).rejects.toThrow('Bạn cần đăng nhập')
    })
    expect(writes).not.toHaveBeenCalled()
    expect(useOnline.getState().items[0]?.publishedId).toBeUndefined()
  })
  it('publishes unlisted, replaces the same server exam and invalidates exam queries', async () => {
    const item = localExam()
    const writes: { method: string; body: unknown }[] = []
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    server.use(
      http.post('http://localhost:3000/api/me/exams', async ({ request }) => {
        writes.push({ method: request.method, body: await request.json() })
        return HttpResponse.json(card)
      }),
      http.put('http://localhost:3000/api/me/exams/:id', async ({ request, params }) => {
        expect(params.id).toBe(remoteId)
        writes.push({ method: request.method, body: await request.json() })
        return HttpResponse.json({ ...card, listed: true })
      }),
    )
    const hook = renderHook(useOnlinePublication, { wrapper })
    await act(async () => {
      await hook.result.current.publish(item, false)
    })
    const published = useOnline.getState().items[0]!
    expect(published).toMatchObject({ publishedId: remoteId, publishedListed: false })
    await act(async () => {
      await hook.result.current.publish(published, true)
    })
    expect(writes).toMatchObject([
      {
        method: 'POST',
        body: { listed: false, doc: { title: 'Đề thử', blocks: expect.any(Array) } },
      },
      { method: 'PUT', body: { listed: true } },
    ])
    expect(useOnline.getState().items[0]).toMatchObject({
      publishedId: remoteId,
      publishedListed: true,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: examsKeys.all })
  })

  it('changes visibility without replacing the exam or losing its link', async () => {
    const item = { ...localExam(), publishedId: remoteId, publishedListed: false }
    useOnline.getState().update(item.id, item)
    const bodies: unknown[] = []
    server.use(
      http.patch('http://localhost:3000/api/me/exams/:id/listed', async ({ request }) => {
        bodies.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const hook = renderHook(useOnlinePublication, { wrapper })
    await act(async () => {
      await hook.result.current.changeListed(item, true)
    })
    await act(async () => {
      await hook.result.current.changeListed(item, false)
    })
    expect(bodies).toEqual([{ listed: true }, { listed: false }])
    expect(useOnline.getState().items[0]).toMatchObject({
      publishedId: remoteId,
      publishedListed: false,
    })
  })

  it('preserves a local draft and surfaces Problem Details when publishing fails', async () => {
    const item = localExam()
    server.use(
      http.post('http://localhost:3000/api/me/exams', () =>
        HttpResponse.json({ status: 422, detail: 'Đề chưa đủ dữ liệu.' }, { status: 422 }),
      ),
    )
    const hook = renderHook(useOnlinePublication, { wrapper })
    await act(async () => {
      await expect(hook.result.current.publish(item, false)).rejects.toThrow('Đề chưa đủ dữ liệu.')
    })
    expect(useOnline.getState().items[0]?.publishedId).toBeUndefined()
  })
})

describe('published exams and results', () => {
  it('does not request forbidden attempts when the current user does not own the result exam', async () => {
    route.id = 'missing-exam'
    const attempts = vi.fn()
    server.use(
      http.get('http://localhost:3000/api/me/exams', ({ request }) => {
        expect(request.cache).toBe('no-store')
        return HttpResponse.json([])
      }),
      http.get('http://localhost:3000/api/me/exams/attempts', () => {
        attempts()
        return HttpResponse.json({ status: 403 }, { status: 403 })
      }),
    )
    const hook = renderHook(useOnlineResultsContainer, { wrapper })
    await waitFor(() => expect(hook.result.current.row).toBeNull())
    expect(attempts).not.toHaveBeenCalled()
    expect(hook.result.current.error).toBeUndefined()
  })
  it('does not read private data while signed out', async () => {
    auth.session = null
    const reads = vi.fn()
    server.use(
      http.get('http://localhost:3000/api/me/exams', () => {
        reads()
        return HttpResponse.json([])
      }),
    )
    const hook = renderHook(usePublishedPanelContainer, { wrapper })
    await waitFor(() => expect(hook.result.current.viewState).toBe(0))
    expect(reads).not.toHaveBeenCalled()
  })

  it('handles an empty published collection without requesting attempts', async () => {
    const attempts = vi.fn()
    server.use(
      http.get('http://localhost:3000/api/me/exams/count', () => HttpResponse.json({ count: 0 })),
      http.get('http://localhost:3000/api/me/exams', () => HttpResponse.json([])),
      http.get('http://localhost:3000/api/me/exams/attempts', () => {
        attempts()
        return HttpResponse.json({ items: [], nextCursor: null })
      }),
    )
    const hook = renderHook(usePublishedPanelContainer, { wrapper })
    await waitFor(() =>
      expect(hook.result.current).toMatchObject({ viewState: 2, rows: [], pages: 1 }),
    )
    expect(attempts).not.toHaveBeenCalled()
  })

  it('follows attempt cursors, refreshes visibility and unpublishes without deleting local questions', async () => {
    const item = localExam()
    useOnline.getState().update(item.id, { publishedId: remoteId, publishedListed: false })
    let row: typeof card | null = card
    const forbiddenAttempts = vi.fn()
    const cursors: (string | null)[] = []
    server.use(
      http.get('http://localhost:3000/api/me/exams/count', ({ request }) => {
        expect(request.cache).toBe('no-store')
        return HttpResponse.json({ count: row ? 1 : 0 })
      }),
      http.get('http://localhost:3000/api/me/exams', () => HttpResponse.json(row ? [row] : [])),
      http.get('http://localhost:3000/api/me/exams/attempts', ({ request }) => {
        expect(request.cache).toBe('no-store')
        if (!row) {
          forbiddenAttempts()
          return HttpResponse.json(
            { status: 403, detail: 'Đề không còn thuộc tài khoản.' },
            { status: 403 },
          )
        }
        const cursor = new URL(request.url).searchParams.get('cursor')
        cursors.push(cursor)
        return HttpResponse.json({
          items: [{ ...attempt, id: cursor ? 'attempt-two' : attempt.id }],
          nextCursor: cursor ? null : 'next-page',
        })
      }),
      http.patch('http://localhost:3000/api/me/exams/:id/listed', async ({ request }) => {
        row = { ...card, listed: ((await request.json()) as { listed: boolean }).listed }
        return new HttpResponse(null, { status: 204 })
      }),
      http.delete('http://localhost:3000/api/me/exams/:id', () => {
        row = null
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const hook = renderHook(usePublishedPanelContainer, { wrapper })
    await waitFor(() => {
      const state = hook.result.current
      expect(state.viewState === 2 && state.stats.get(remoteId)?.attempts).toBe(2)
    })
    expect(cursors).toEqual([null, 'next-page'])
    const state = hook.result.current
    if (state.viewState !== 2) throw new Error('Published panel did not load')
    await act(() => state.toggleListed(state.rows[0]!))
    await waitFor(() =>
      expect(hook.result.current.viewState === 2 && hook.result.current.rows[0]?.listed).toBe(true),
    )
    expect(useOnline.getState().items[0]?.publishedListed).toBe(true)
    await act(() => state.remove(state.rows[0]!))
    await waitFor(() => expect(hook.result.current).toMatchObject({ viewState: 2, rows: [] }))
    expect(forbiddenAttempts).not.toHaveBeenCalled()
    expect(client.getQueryData([...examsKeys.all, 'ownerExam', remoteId])).toBeNull()
    expect(useOnline.getState().items[0]).toMatchObject({
      publishedId: undefined,
      questions: item.questions,
    })
  })

  it('surfaces result-loading errors rather than showing an empty result as success', async () => {
    server.use(
      http.get('http://localhost:3000/api/me/exams', () =>
        HttpResponse.json({ status: 503, detail: 'Không tải được kết quả.' }, { status: 503 }),
      ),
      http.get('http://localhost:3000/api/me/exams/attempts', () =>
        HttpResponse.json({ items: [], nextCursor: null }),
      ),
    )
    const hook = renderHook(useOnlineResultsContainer, { wrapper })
    await waitFor(() => expect(hook.result.current.error).toBe('Không tải được kết quả.'))
  })

  it('finds a result exam beyond the first owner-list page and accepts no attempts', async () => {
    const offsets: string[] = []
    server.use(
      http.get('http://localhost:3000/api/me/exams', ({ request }) => {
        const offset = new URL(request.url).searchParams.get('offset') ?? ''
        offsets.push(offset)
        return HttpResponse.json(
          offset === '0'
            ? Array.from({ length: 100 }, (_, i) => ({ ...card, id: `other-${i}` }))
            : [card],
        )
      }),
      http.get('http://localhost:3000/api/me/exams/attempts', () =>
        HttpResponse.json({ items: [], nextCursor: null }),
      ),
    )
    const hook = renderHook(useOnlineResultsContainer, { wrapper })
    await waitFor(() => expect(hook.result.current.row?.id).toBe(remoteId))
    await waitFor(() => expect(hook.result.current.stats?.attempts).toBe(0))
    expect(offsets).toEqual(['0', '100'])
    expect(hook.result.current.students).toEqual([])
  })
})

describe('local online builder validation', () => {
  it('loads a missing local draft from an uncached workspace read before declaring it missing', async () => {
    const item = localExam()
    useOnline.setState({ items: [] })
    route.id = item.id
    server.use(
      http.get('http://localhost:3000/api/workspace/items', ({ request }) => {
        expect(request.cache).toBe('no-store')
        return HttpResponse.json([{ id: item.id, data: item }])
      }),
    )
    const hook = renderHook(useOnlineBuilderContainer, { wrapper })
    await waitFor(() => expect(hook.result.current.viewState).toBe(1))
    expect(useOnline.getState().items[0]?.id).toBe(item.id)
  })
  it('reads text attachments locally while anonymous and rejects empty or oversized files', async () => {
    auth.session = null
    const file = new File(['Câu 1. Một cộng một?'], 'nguon.txt', { type: 'text/plain' })
    Object.defineProperty(file, 'text', { value: async () => 'Câu 1. Một cộng một?' })
    await expect(readImportFile(file)).resolves.toMatchObject({
      title: 'nguon',
      text: 'Câu 1. Một cộng một?',
    })
    const empty = new File([], 'rong.md')
    Object.defineProperty(empty, 'text', { value: async () => '   ' })
    await expect(readImportFile(empty)).rejects.toThrow('không có nội dung')
    Object.defineProperty(file, 'size', { value: 13 * 1024 * 1024 })
    await expect(readImportFile(file)).rejects.toThrow('Tệp quá lớn')
  })
  it('validates metadata and empty questions before marking a draft done', async () => {
    const item = localExam()
    route.id = item.id
    const hook = renderHook(useOnlineBuilderContainer, { wrapper })
    await waitFor(() => expect(hook.result.current.viewState).toBe(1))
    await act(async () => {
      const state = hook.result.current
      if (state.viewState === 1) state.setMeta({ title: ' ' })
    })
    act(() => {
      const state = hook.result.current
      if (state.viewState === 1) state.finish()
    })
    expect(useOnline.getState().items[0]?.status).toBe('draft')
    expect(hook.result.current.viewState === 1 && hook.result.current.error).toBeTruthy()
    await act(async () => {
      const state = hook.result.current
      if (state.viewState === 1) state.setMeta({ title: 'Đề hoàn chỉnh' })
    })
    act(() => {
      const state = hook.result.current
      if (state.viewState === 1) state.finish()
    })
    expect(useOnline.getState().items[0]?.status).toBe('done')
    act(() => {
      const state = hook.result.current
      if (state.viewState === 1) state.setQuestions([])
    })
    act(() => {
      const state = hook.result.current
      if (state.viewState === 1) state.finish()
    })
    expect(hook.result.current.viewState === 1 && hook.result.current.error).toBeTruthy()
  })
})
