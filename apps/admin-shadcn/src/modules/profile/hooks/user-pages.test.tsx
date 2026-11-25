import {
  store_docs_useDocStore as useDocStore,
  store_boards_useBoards as useBoards,
} from '@profile-engine'
import {
  lib_exportDocx_examToDoc as examToDoc,
  store_app_useApp as useApp,
  store_online_useOnline as useOnline,
} from '@student-engine'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, passthrough } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { t } from '@/i18n/translate-library-profile'
import {
  useCommunityContainer,
  usePublishModalContainer,
} from '@/modules/community/hooks/use-community-container'
import { LibraryContainer } from '@/modules/library'
import {
  useDocumentsContainer,
  useDocGridContainer,
  useDocumentCardContainer,
} from '@/modules/library/hooks/use-library-container'
import {
  EditCardContainer,
  CreditCardContainer,
} from '@/modules/profile/containers/profile-container'
import { studentExam } from '@/modules/student-exams/testing/fixture'
import { server } from '@/testing/msw/server'

import { useMyFilesCardContainer, useMyUploadsContainer } from './use-my-uploads-container'
import {
  profileSchema,
  useCreditCardContainer,
  useProfileContainer,
  useIdentityCardContainer,
  squareAvatar,
} from './use-profile-container'

import type { Session } from '@supabase/supabase-js'
import type { components } from '@workspace/api-types'
import type { ChangeEvent, ReactNode } from 'react'

const auth = vi.hoisted(() => ({
  session: null as Session | null,
  delay: undefined as Promise<void> | undefined,
}))
const dialogs = vi.hoisted(() => ({
  confirm: vi.fn(async () => true),
  alert: vi.fn(async () => {}),
}))
vi.mock('@engine-dialogs', () => ({ dialog: dialogs }))
vi.mock('@/engine/components/Dialog', () => ({ dialog: dialogs }))
vi.mock('@/lib/supabase/browser', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient('https://test.supabase.co', 'unit-anon-key', {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => (auth.session ? JSON.stringify(auth.session) : null),
        setItem: (_key, value) => {
          auth.session = JSON.parse(value) as Session
        },
        removeItem: () => {
          auth.session = null
        },
      },
    },
  })
  return {
    getBrowserSupabase: () => ({
      auth: {
        getSession: async () => {
          await auth.delay
          return { data: { session: auth.session }, error: null }
        },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        updateUser: (values: Parameters<typeof client.auth.updateUser>[0]) =>
          client.auth.updateUser(values),
      },
    }),
  }
})

const api = 'http://localhost:3000/api'
const uid = '44444444-4444-4444-8444-444444444444'
const id = '55555555-5555-4555-8555-555555555555'
const user = { id: uid, email: 'teacher@example.com', name: 'Cô An' }
const doc = {
  ...examToDoc(studentExam, { withAnswers: true }),
  id: 'user-pages-local',
  title: 'Đề cộng đồng thử nghiệm',
}
const card: components['schemas']['ExamCardDto'] = {
  id,
  ownerId: uid as unknown as components['schemas']['ExamCardDto']['ownerId'],
  title: doc.title,
  subject: 'Toán',
  grade: '10',
  school: 'THPT',
  createdAt: '2026-01-01T00:00:00Z',
  questionCount: 2,
  durationMinutes: 15,
  totalPoints: 2,
  preview: 'Một cộng một',
  listed: true,
  missingKeys: null,
}
const file: components['schemas']['DocumentResponseDto'] = {
  id: 'file-one',
  name: 'Bài tập Toán.pdf',
  mime: 'application/pdf',
  size: 123,
  url: '/api/files/doc/file-one',
  subject: 'Toán',
  createdAt: '2026-01-01T00:00:00Z',
}
const usage: components['schemas']['StorageUsageResponseDto'] = {
  used: 123,
  max: 20 * 1024 * 1024,
  kinds: { files: { count: 1, bytes: 123, limit: 20 } },
}
const quota: components['schemas']['QuotaResponseDto'] = {
  unlimited: false,
  quota: { used: 0, limit: 120_000, base: 0, credits: 120_000, scope: 'month' },
  granted: 120_000,
}
let client: QueryClient
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
function signedIn() {
  auth.session = {
    access_token: 'unit-access-token',
    refresh_token: 'unit-refresh-token',
    expires_in: 3600,
    expires_at: 4_102_444_800,
    token_type: 'bearer',
    user: {
      id: uid,
      email: user.email,
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: { display_name: user.name },
    },
  }
}
function picked(files: File[]) {
  return { target: { files, value: 'test' } } as unknown as ChangeEvent<HTMLInputElement>
}
beforeEach(() => {
  vi.clearAllMocks()
  dialogs.confirm.mockResolvedValue(true)
  auth.delay = undefined
  signedIn()
  localStorage.clear()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  useDocStore.setState({ myDocs: [], myDecks: [] })
  useBoards.setState({ items: [] })
  useOnline.setState({ items: [] })
  useApp.setState({ myExams: [], activeQuizId: null })
  server.use(
    http.get(`${api}/storage/documents`, () => HttpResponse.json([file])),
    http.get(`${api}/storage/usage`, () => HttpResponse.json(usage)),
    http.get(`${api}/exams/community`, () => HttpResponse.json([])),
    http.get(`${api}/ai/quota`, () => HttpResponse.json(quota)),
    http.get(`${api}/ai/credits/events`, () => HttpResponse.json([])),
    http.get(`${api}/me`, () => HttpResponse.json({ userId: uid, role: null })),
    http.put('https://test.supabase.co/*/user', async ({ request }) => {
      const body = (await request.json()) as { data: Record<string, unknown> }
      return HttpResponse.json({
        ...auth.session!.user,
        user_metadata: { ...auth.session!.user.user_metadata, ...body.data },
      })
    }),
  )
})

describe('community list, authors and publication', () => {
  it('bypasses HTTP caching when refreshing published cards and authors', async () => {
    const caches: RequestCache[] = []
    server.use(
      http.get(`${api}/exams/community`, ({ request }) => {
        caches.push(request.cache)
        return HttpResponse.json([card])
      }),
      http.get(`${api}/exams/community/authors`, ({ request }) => {
        caches.push(request.cache)
        return HttpResponse.json([{ id: uid, name: 'Cô An', avatar: null }])
      }),
    )
    const { result } = renderHook(useCommunityContainer, { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(caches).toEqual(['no-store', 'no-store'])
  })
  it('loads listed cards and authors, combines filters, and clears them', async () => {
    auth.session = null
    server.use(
      http.get(`${api}/exams/community`, () => HttpResponse.json([card])),
      http.get(`${api}/exams/community/authors`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('ids')).toBe(uid)
        return HttpResponse.json([{ id: uid, name: 'Cô An', avatar: null }])
      }),
    )
    const { result } = renderHook(useCommunityContainer, { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.results.find((row) => row.id === id)?.author?.name).toBe('Cô An')
    act(() => {
      result.current.setQ(doc.title)
      result.current.setSubject('Toán')
      result.current.setGrade('10')
    })
    expect(result.current.results).toHaveLength(1)
    act(() => result.current.setQ('Không tìm thấy'))
    expect(result.current.results).toHaveLength(0)
    act(() => result.current.clearFilters())
    expect(result.current.hasFilter).toBe(false)
  })
  it('retains demo cards for an empty community and surfaces Problem Details', async () => {
    const { result, rerender } = renderHook(useCommunityContainer, { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.results.length).toBeGreaterThan(0)
    server.use(
      http.get(`${api}/exams/community`, () =>
        HttpResponse.json({ detail: 'Không thể tải cộng đồng.', status: 503 }, { status: 503 }),
      ),
    )
    await act(() => client.invalidateQueries())
    rerender()
    await waitFor(() => expect(result.current.openError).toBe('Không thể tải cộng đồng.'))
  })
  it('handles malformed authors and unavailable documents without importing an exam', async () => {
    server.use(
      http.get(`${api}/exams/community`, () => HttpResponse.json([card])),
      http.get(`${api}/exams/community/authors`, () => HttpResponse.json({})),
      http.get(`${api}/exams/community/${id}`, () => HttpResponse.json({})),
    )
    const { result } = renderHook(useCommunityContainer, { wrapper })
    await waitFor(() => expect(result.current.openError).toContain('tác giả'))
    act(() => result.current.results.find((row) => row.id === id)!.onQuiz())
    await waitFor(() => expect(result.current.openError).toBe('Đề này không còn được xuất bản.'))
    expect(useApp.getState().myExams).toHaveLength(0)
  })
  it('publishes a local document with typed body and invalidates community data', async () => {
    useDocStore.setState({ myDocs: [doc] })
    let body: unknown
    server.use(
      http.post(`${api}/me/exams`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(card, { status: 201 })
      }),
    )
    const done = vi.fn()
    const close = vi.fn()
    const { result } = renderHook(
      () => usePublishModalContainer({ loggedIn: true, onClose: close, onPublished: done }),
      { wrapper },
    )
    await act(() => result.current.publishLocalDoc(doc.id))
    expect(body).toMatchObject({ doc: { id: doc.id, title: doc.title }, listed: true })
    expect(done).toHaveBeenCalledOnce()
    expect(result.current.busyId).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(close).toHaveBeenCalledOnce()
  })
  it('confirms missing answers and respects cancellation without publishing', async () => {
    const exam = structuredClone(studentExam)
    for (const section of exam.sections)
      for (const question of section.questions) delete question.answer
    const noKey = examToDoc(exam)
    useDocStore.setState({ myDocs: [noKey] })
    dialogs.confirm.mockResolvedValue(false)
    const done = vi.fn(),
      { result } = renderHook(
        () => usePublishModalContainer({ loggedIn: true, onClose: vi.fn(), onPublished: done }),
        { wrapper },
      )
    await act(() => result.current.publishLocalDoc(noKey.id))
    expect(dialogs.confirm).toHaveBeenCalledWith(
      expect.stringContaining('chưa có đáp án'),
      expect.objectContaining({ title: 'Đề còn thiếu đáp án' }),
    )
    expect(done).not.toHaveBeenCalled()
    expect(result.current.error).toContain('huỷ')
  })
  it('keeps the modal open and exposes publication errors', async () => {
    useDocStore.setState({ myDocs: [doc] })
    server.use(
      http.post(`${api}/me/exams`, () =>
        HttpResponse.json({ detail: 'Chưa thể đăng đề.', status: 422 }, { status: 422 }),
      ),
    )
    const done = vi.fn(),
      { result } = renderHook(
        () => usePublishModalContainer({ loggedIn: true, onClose: vi.fn(), onPublished: done }),
        { wrapper },
      )
    await act(() => result.current.publishLocalDoc(doc.id))
    expect(result.current.error).toBe('Chưa thể đăng đề.')
    expect(done).not.toHaveBeenCalled()
  })
})

describe('library and saved uploads', () => {
  it('bypasses HTTP caching for document and storage-usage refreshes', async () => {
    const caches: RequestCache[] = []
    server.use(
      http.get(`${api}/storage/documents`, ({ request }) => {
        caches.push(request.cache)
        return HttpResponse.json([file])
      }),
      http.get(`${api}/storage/usage`, ({ request }) => {
        caches.push(request.cache)
        return HttpResponse.json(usage)
      }),
    )
    const { result } = renderHook(useDocumentsContainer, { wrapper })
    await waitFor(() => expect(result.current.docs).toHaveLength(1))
    await waitFor(() => expect(result.current.usage?.used).toBe(123))
    expect(caches).toEqual(['no-store', 'no-store'])
  })
  it('shows the signed-out sign-in prompt and sample files without private requests', async () => {
    auth.session = null
    render(<LibraryContainer />, { wrapper })
    expect(await screen.findByText(t('libraryCopy.m452'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('libraryCopy.m107') })).toHaveAttribute(
      'href',
      '/login',
    )
  })
  it('loads documents and usage, filters the list, and uploads multipart files', async () => {
    let posted = false
    server.use(
      http.post(`${api}/storage/documents`, async ({ request }) => {
        expect(request.headers.get('content-type')).toContain('multipart/form-data')
        posted = true
        return HttpResponse.json(file, { status: 201 })
      }),
    )
    const { result } = renderHook(useDocumentsContainer, { wrapper })
    await waitFor(() => expect(result.current.docs).toHaveLength(1))
    expect(result.current.usage?.used).toBe(123)
    await act(() =>
      result.current.onPick(picked([new File(['%PDF-1.4'], file.name, { type: file.mime })])),
    )
    await waitFor(() => expect(result.current.busy).toBe(false))
    expect(posted).toBe(true)
    const grid = renderHook(
      () => useDocGridContainer({ items: result.current.docs ?? [], sample: false }),
      { wrapper },
    )
    act(() => grid.result.current.setQ('Không tồn tại'))
    expect(grid.result.current.shown).toHaveLength(0)
  })
  it.each([
    ['bad.txt', 'text/plain', 5, 'Chỉ nhận'],
    ['huge.pdf', 'application/pdf', 21 * 1024 * 1024, 'quá lớn'],
  ])('rejects invalid upload %s', async (name, mime, size, message) => {
    const { result } = renderHook(useDocumentsContainer, { wrapper })
    await waitFor(() => expect(result.current.docs).not.toBeNull())
    const invalid = new File(['x'], String(name), { type: String(mime) })
    Object.defineProperty(invalid, 'size', { value: Number(size) })
    act(() => result.current.onPick(picked([invalid])))
    await waitFor(() => expect(result.current.error).toContain(String(message)))
  })
  it('handles quota, upload and list failures without losing loaded files', async () => {
    server.use(
      http.get(`${api}/storage/usage`, () => HttpResponse.json({ ...usage, used: usage.max })),
    )
    const { result } = renderHook(useDocumentsContainer, { wrapper })
    await waitFor(() => expect(result.current.docs).toHaveLength(1))
    act(() =>
      result.current.onPick(picked([new File(['x'], 'new.pdf', { type: 'application/pdf' })])),
    )
    await waitFor(() => expect(result.current.error).toContain('dung lượng'))
    expect(result.current.docs).toHaveLength(1)
    server.use(
      http.get(`${api}/storage/documents`, () =>
        HttpResponse.json({ detail: 'Không đọc được tài liệu.', status: 503 }, { status: 503 }),
      ),
    )
    await act(() => client.invalidateQueries())
    await waitFor(() => expect(result.current.docs).toHaveLength(1))
    expect(result.current.error).toBeTruthy()
  })
  it('preserves files and surfaces rejected upload and delete mutations', async () => {
    server.use(
      http.post(`${api}/storage/documents`, () =>
        HttpResponse.json({ status: 503, detail: 'Tạm thời không thể tải lên.' }, { status: 503 }),
      ),
      http.delete(`${api}/storage/documents/${file.id}`, () =>
        HttpResponse.json({ status: 403, detail: 'Không thể xóa tệp.' }, { status: 403 }),
      ),
    )
    const { result } = renderHook(useDocumentsContainer, { wrapper })
    await waitFor(() => expect(result.current.docs).toHaveLength(1))
    act(() =>
      result.current.onPick(picked([new File(['pdf'], 'new.pdf', { type: 'application/pdf' })])),
    )
    await waitFor(() => expect(result.current.error).toBe('Tạm thời không thể tải lên.'))
    expect(result.current.busy).toBe(false)
    await act(() => result.current.remove({ ...file, created_at: file.createdAt }))
    expect(result.current.error).toBe('Không thể xóa tệp.')
    expect(result.current.docs).toHaveLength(1)
  })
  it('confirms deletion, supports cancellation, and invalidates private files', async () => {
    let removed = false
    server.use(
      http.delete(`${api}/storage/documents/${file.id}`, () => {
        removed = true
        return new HttpResponse(null, { status: 204 })
      }),
      http.get(`${api}/storage/documents`, () => HttpResponse.json(removed ? [] : [file])),
    )
    const { result } = renderHook(useDocumentsContainer, { wrapper })
    await waitFor(() => expect(result.current.docs).toHaveLength(1))
    dialogs.confirm.mockResolvedValueOnce(false)
    await act(() => result.current.remove({ ...file, created_at: file.createdAt }))
    expect(removed).toBe(false)
    await act(() => result.current.remove({ ...file, created_at: file.createdAt }))
    await waitFor(() => expect(result.current.docs).toHaveLength(0))
  })
  it('opens private files through authenticated /api/files and closes failed tabs', async () => {
    const tab = { location: { href: '' }, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:private-document'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    server.use(
      http.get(`${api}/files/doc/file-one`, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer unit-access-token')
        return new HttpResponse('tiny PDF')
      }),
    )
    const { result } = renderHook(
      () =>
        useDocumentCardContainer({ doc: { ...file, created_at: file.createdAt }, sample: false }),
      { wrapper },
    )
    act(() => result.current.open())
    await waitFor(() => expect(tab.location.href).toBe('blob:private-document'))
    server.use(
      http.get(`${api}/files/doc/file-one`, () =>
        HttpResponse.json({ status: 404, detail: 'Không tìm thấy tài liệu.' }, { status: 404 }),
      ),
    )
    act(() => result.current.open())
    await waitFor(() => expect(tab.close).toHaveBeenCalled())
    expect(dialogs.alert).toHaveBeenCalledWith(expect.stringContaining('Không tìm thấy'))
  })
  it('combines local and remote files, filters and deletes local documents', async () => {
    useDocStore.setState({ myDocs: [doc] })
    const { result } = renderHook(useMyFilesCardContainer, { wrapper })
    await waitFor(() => expect(result.current.all).toHaveLength(2))
    act(() => result.current.setFilter('exam'))
    expect(result.current.pageItems).toHaveLength(1)
    await act(() => result.current.onDelete(result.current.pageItems[0]!))
    expect(useDocStore.getState().myDocs).toHaveLength(0)
  })
  it('keeps failed upload cards dismissible and reports server failures', async () => {
    server.use(
      http.post(`${api}/storage/documents`, () =>
        HttpResponse.json({ detail: 'Tải lên thất bại.', status: 503 }, { status: 503 }),
      ),
    )
    const { result } = renderHook(useMyFilesCardContainer, { wrapper })
    await waitFor(() => expect(result.current.all).toHaveLength(1))
    await act(() =>
      result.current.onPick(picked([new File(['x'], 'failed.pdf', { type: 'application/pdf' })])),
    )
    const failed = result.current.pageItems.find((item) => typeof item.pending === 'object')!
    expect(failed.pending).toEqual({ error: 'Tải lên thất bại.' })
    await act(() => result.current.onDelete(failed))
    expect(result.current.pageItems).toHaveLength(1)
  })
})

describe('profile editing and credit history', () => {
  it('does not redirect protected pages until authentication initialization finishes', async () => {
    let resolve!: () => void
    auth.delay = new Promise<void>((done) => {
      resolve = done
    })
    const profile = renderHook(useProfileContainer, { wrapper }),
      uploads = renderHook(useMyUploadsContainer, { wrapper })
    expect(profile.result.current.viewState).toBe(2)
    expect(uploads.result.current.viewState).toBe(2)
    await act(async () => {
      resolve()
      await auth.delay
    })
    await waitFor(() => expect(profile.result.current.viewState).toBe(1))
    expect(uploads.result.current.viewState).toBe(1)
  })
  it('validates empty and overlong names and does not mutate unchanged information', async () => {
    expect(profileSchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(profileSchema.safeParse({ name: 'a'.repeat(41) }).success).toBe(false)
    expect(profileSchema.safeParse({ name: 'a'.repeat(41) }).error?.issues[0]?.message).toBe(
      t('profileCopy.nameTooLong'),
    )
    const actor = userEvent.setup()
    render(<EditCardContainer user={user} />, { wrapper })
    await actor.click(screen.getByRole('button', { name: t('profileCopy.m37') }))
    expect(await screen.findByText(t('profileCopy.m9'))).toBeInTheDocument()
    await actor.clear(screen.getByLabelText(t('profileCopy.m34')))
    await actor.click(screen.getByRole('button', { name: t('profileCopy.m37') }))
    expect(await screen.findByText(t('profileCopy.m8'))).toBeInTheDocument()
  })
  it('saves trimmed display names through the Supabase SDK and handles errors', async () => {
    let body: unknown
    server.use(
      http.put('https://test.supabase.co/*/user', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          ...auth.session!.user,
          user_metadata: { display_name: 'Tên mới' },
        })
      }),
    )
    const actor = userEvent.setup()
    render(<EditCardContainer user={user} />, { wrapper })
    const input = screen.getByLabelText(t('profileCopy.m34'))
    await actor.clear(input)
    await actor.type(input, '  Tên mới  ')
    await actor.click(screen.getByRole('button', { name: t('profileCopy.m37') }))
    expect(await screen.findByText(t('profileCopy.m10'))).toBeInTheDocument()
    expect(body).toMatchObject({ data: { display_name: 'Tên mới' } })
    server.use(
      http.put('https://test.supabase.co/*/user', () =>
        HttpResponse.json(
          { message: 'Không lưu được hồ sơ.', code: 'unexpected_failure' },
          { status: 422 },
        ),
      ),
    )
    await actor.clear(input)
    await actor.type(input, 'Tên khác')
    await actor.click(screen.getByRole('button', { name: t('profileCopy.m37') }))
    expect(await screen.findByText('Không lưu được hồ sơ.')).toBeInTheDocument()
  })
  it('rejects non-images before cropping and reports unreadable image errors', async () => {
    const { result } = renderHook(() => useIdentityCardContainer({ user }), { wrapper })
    act(() =>
      result.current.changeAvatar(
        picked([new File(['x'], 'not-image.txt', { type: 'text/plain' })]),
      ),
    )
    expect(result.current.error).toBe(t('profileCopy.m6'))
    const image = new EventTarget()
    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      queueMicrotask(() => image.dispatchEvent(new Event('error')))
      return image as HTMLImageElement
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:bad-image'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    await expect(squareAvatar(new File(['x'], 'bad.png', { type: 'image/png' }))).rejects.toThrow(
      t('profileCopy.m5'),
    )
    vi.mocked(Image).mockRestore()
  })
  it('crops avatars to 256 pixels and uploads the result before updating metadata', async () => {
    const image = Object.assign(new EventTarget(), { naturalWidth: 600, naturalHeight: 400 })
    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      queueMicrotask(() => image.dispatchEvent(new Event('load')))
      return image as HTMLImageElement
    })
    const drawImage = vi.fn()
    const context = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    const data = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/jpeg;base64,Zml4dHVyZQ==')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:avatar'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    server.use(
      http.get(/image\/jpeg;base64/, () => passthrough()),
      http.post(`${api}/storage/images`, () =>
        HttpResponse.json({ url: '/api/files/images/avatar.jpg' }, { status: 201 }),
      ),
    )
    const { result } = renderHook(() => useIdentityCardContainer({ user }), { wrapper })
    act(() =>
      result.current.changeAvatar(
        picked([new File(['image'], 'avatar.png', { type: 'image/png' })]),
      ),
    )
    await waitFor(() =>
      expect(auth.session?.user.user_metadata.avatar_url).toBe('/api/files/images/avatar.jpg'),
    )
    expect(drawImage).toHaveBeenCalledWith(image, 100, 0, 400, 400, 0, 0, 256, 256)
    expect(data).toHaveBeenCalledWith('image/jpeg', 0.88)
    expect(result.current.error).toBeNull()
    vi.mocked(Image).mockRestore()
    context.mockRestore()
    data.mockRestore()
  })
  it.each([false, true])('handles quota errors with cached balance: %s', async (cached) => {
    if (cached) localStorage.setItem(`dethinhbien-quota:${uid}`, JSON.stringify(quota.quota))
    server.use(
      http.get(`${api}/ai/quota`, () =>
        HttpResponse.json({ status: 503, detail: 'Quota unavailable' }, { status: 503 }),
      ),
    )
    const { result } = renderHook(useCreditCardContainer, { wrapper })
    await waitFor(() => expect(result.current.q).toEqual(cached ? quota.quota : 'error'))
  })
  it('loads the AI balance before the credit history and renders an empty history', async () => {
    render(<CreditCardContainer />, { wrapper })
    expect(await screen.findByText(t('profileCopy.m41'))).toBeInTheDocument()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
  })
  it('renders credit event labels, token-to-points conversion and failed history', async () => {
    const event: components['schemas']['CreditEventResponseDto'] = {
      id: 1,
      kind: 'welcome',
      tokens: 120_000,
      createdAt: '2026-01-01T00:00:00Z',
    }
    server.use(http.get(`${api}/ai/credits/events`, () => HttpResponse.json([event])))
    render(<CreditCardContainer />, { wrapper })
    expect(await screen.findByText(t('profileCopy.m1'))).toBeInTheDocument()
    expect(screen.getByText('+120 điểm')).toBeInTheDocument()
    server.use(
      http.get(`${api}/ai/credits/events`, () =>
        HttpResponse.json({ detail: 'Lịch sử tạm thời không có.', status: 503 }, { status: 503 }),
      ),
    )
    await act(() => client.invalidateQueries())
    expect(await screen.findByText(t('profileCopy.m40'))).toBeInTheDocument()
  })
  it.each([
    { unlimited: true, quota: null, copy: 'm14' },
    { unlimited: false, quota: null, copy: 'm15' },
  ])('renders quota mode $copy', async (mode) => {
    server.use(http.get(`${api}/ai/quota`, () => HttpResponse.json({ ...mode, granted: 120_000 })))
    render(<CreditCardContainer />, { wrapper })
    expect(
      await screen.findByText(t(mode.copy === 'm14' ? 'profileCopy.m14' : 'profileCopy.m15')),
    ).toBeInTheDocument()
  })
})
