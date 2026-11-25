// @vitest-environment node
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { streamChat } from '@/apis/ai/requests'
import { extractFile } from '@/apis/media/requests'
import { uploadDocumentFile, uploadImageFile } from '@/apis/storage/requests'
import { removeWorkspaceItems, workspaceItemSave } from '@/apis/workspace/requests'
import { adminRequest } from '@/engine/compat/admin'
import { emptyDoc } from '@/engine/data/docTypes'
import { listAttempts } from '@/engine/lib/attempts'
import {
  listCommunityDocs,
  listCommunityAuthors,
  countMyPublished,
  getCommunityDoc,
} from '@/engine/lib/community'
import { listDocuments } from '@/engine/lib/documents'
import { startSync } from '@/engine/lib/sync'
import { server } from '@/testing/msw/server'

const state = vi.hoisted(() => ({ signedIn: true }))
const session = {
  access_token: 'engine-token',
  refresh_token: 'refresh',
  expires_at: 9999999999,
  user: { id: 'owner', email: 'teacher@example.com' },
}

vi.mock('@/engine/lib/auth', async (original) => ({
  ...(await original<typeof import('@/engine/lib/auth')>()),
  getSession: () => (state.signedIn ? session : null),
  currentSession: async () => (state.signedIn ? session : null),
}))
vi.mock('@/lib/api-client', async (original) => {
  const actual = await original<typeof import('@/lib/api-client')>()
  const { createAuthenticatedFetch } = await import('@/lib/authenticated-fetch')
  const auth = { getToken: async () => 'engine-token', refreshToken: async () => null }
  return {
    ...actual,
    apiClient: actual.createApiClient(auth),
    authenticatedFetch: createAuthenticatedFetch(auth),
  }
})

const api = 'http://localhost:3000'
beforeEach(() => {
  state.signedIn = true
})

describe('engine NestJS adapters', () => {
  it('adapts community cards and empty results', async () => {
    const card = {
      id: 'exam',
      ownerId: 'owner',
      title: 'Đề kiểm tra',
      subject: 'Toán',
      grade: 'Lớp 9',
      school: '',
      createdAt: '2026-01-01',
      questionCount: 3,
      durationMinutes: 45,
      totalPoints: 10,
      missingKeys: 1,
      preview: '',
      listed: true,
    }
    server.use(http.get(api + '/api/exams/community', () => HttpResponse.json([card])))
    expect(await listCommunityDocs()).toMatchObject([
      {
        owner_id: 'owner',
        created_at: card.createdAt,
        question_count: 3,
        duration_minutes: 45,
        total_points: 10,
        missing_keys: 1,
      },
    ])
    server.use(http.get(api + '/api/exams/community', () => HttpResponse.json([])))
    await expect(listCommunityDocs()).resolves.toEqual([])
  })

  it('uses comma-separated unique author ids and preserves the Map signature', async () => {
    server.use(
      http.get(api + '/api/exams/community/authors', ({ request }) => {
        expect(new URL(request.url).searchParams.getAll('ids')).toEqual(['one,two'])
        return HttpResponse.json([{ id: 'one', name: 'Cô An', avatar: null }])
      }),
    )
    expect(await listCommunityAuthors(['one', 'one', 'two'])).toEqual(
      new Map([['one', { name: 'Cô An', avatar: undefined }]]),
    )
    await expect(listCommunityAuthors([])).resolves.toEqual(new Map())
  })

  it('reads the untyped count wrapper and raw document, including an empty document', async () => {
    const doc = emptyDoc({ id: 'exam', blocks: [] })
    server.use(
      http.get(api + '/api/me/exams/count', () => HttpResponse.json({ count: 4 })),
      http.get(api + '/api/exams/community/exam', () => HttpResponse.json(doc)),
    )
    await expect(countMyPublished()).resolves.toBe(4)
    await expect(getCommunityDoc('exam')).resolves.toEqual(doc)
    server.use(http.get(api + '/api/me/exams/count', () => HttpResponse.json({})))
    await expect(countMyPublished()).rejects.toThrow('Dữ liệu số đề không hợp lệ.')
  })

  it('surfaces Problem Details detail verbatim', async () => {
    server.use(
      http.get(api + '/api/exams/community', () =>
        HttpResponse.json(
          {
            title: 'Unavailable',
            status: 503,
            code: 'BUSY',
            detail: 'Máy chủ đang bận. Thử lại sau.',
          },
          { status: 503 },
        ),
      ),
    )
    await expect(listCommunityDocs()).rejects.toThrow('Máy chủ đang bận. Thử lại sau.')
  })

  it('skips signed-out workspace and private lists without network requests', async () => {
    state.signedIn = false
    const requested = vi.fn()
    server.use(
      http.all(api + '/*', () => {
        requested()
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const stop = await startSync()
    stop()
    await expect(countMyPublished()).resolves.toBe(0)
    await expect(listDocuments()).resolves.toEqual([])
    await expect(listAttempts(['exam'])).resolves.toEqual([])
    expect(requested).not.toHaveBeenCalled()
  })

  it('paginates attempts using cursors and adapts camelCase rows', async () => {
    const cursors: (string | null)[] = []
    server.use(
      http.get(api + '/api/me/exams/attempts', ({ request }) => {
        const query = new URL(request.url).searchParams
        expect(query.getAll('examIds')).toEqual(['a,b'])
        cursors.push(query.get('cursor'))
        return HttpResponse.json(
          query.has('cursor')
            ? { items: [], nextCursor: null }
            : {
                items: [
                  {
                    id: 'attempt',
                    examId: 'a',
                    userId: null,
                    studentName: 'An',
                    score: 8,
                    maxScore: 10,
                    correct: 8,
                    total: 10,
                    durationSeconds: 120,
                    answers: {},
                    createdAt: '2026-01-01',
                    deviceId: 'device',
                    className: '9A',
                    seatNo: 2,
                  },
                ],
                nextCursor: 'next',
              },
        )
      }),
    )
    expect(await listAttempts(['a', 'b'])).toMatchObject([
      {
        exam_id: 'a',
        student_name: 'An',
        max_score: 10,
        duration_seconds: 120,
        class_name: '9A',
        seat_no: 2,
      },
    ])
    expect(cursors).toEqual([null, 'next'])
  })

  it('adapts admin users and 204 mutations without the legacy action dispatcher', async () => {
    server.use(
      http.get(api + '/api/admin/users', () =>
        HttpResponse.json({
          total: 1,
          items: [
            {
              id: 'owner',
              displayName: 'Cô An',
              avatarUrl: '/avatar',
              strikes: 2,
              lockedUntil: '2026-01-01',
              lastAction: 'denied',
            },
          ],
        }),
      ),
      http.post(api + '/api/admin/users/owner/ban', async ({ request }) => {
        expect(await request.json()).toEqual({ hours: 24, reason: 'test' })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    expect(await adminRequest('users.list', { page: 2, perPage: 10 })).toMatchObject({
      total: 1,
      page: 2,
      perPage: 10,
      users: [{ name: 'Cô An', avatar: '/avatar', flag: { strikes: 2, lastAt: '2026-01-01' } }],
    })
    await expect(
      adminRequest('users.ban', { userId: 'owner', hours: 24, reason: 'test' }),
    ).resolves.toEqual({ ok: true })
  })

  it('reshapes the payment revenue into the totals, counts and prev the panel reads', async () => {
    const slot = (vnd: number, count: number) => ({ vnd, count })
    server.use(
      http.get(api + '/api/admin/payments', () =>
        HttpResponse.json({
          items: [],
          total: 0,
          configured: true,
          revenue: {
            day: slot(10, 1),
            prevDay: slot(5, 2),
            week: slot(20, 3),
            prevWeek: slot(15, 4),
            month: slot(30, 5),
            prevMonth: slot(25, 6),
            all: slot(40, 7),
            months: [{ month: '2026-11', vnd: 30, count: 5 }],
          },
        }),
      ),
    )
    expect(await adminRequest('payments.list', {})).toMatchObject({
      items: [],
      page: 1,
      revenue: {
        day: 10,
        week: 20,
        month: 30,
        all: 40,
        counts: { day: 1, week: 3, month: 5, all: 7 },
        prev: { day: slot(5, 2), week: slot(15, 4), month: slot(25, 6) },
        months: [{ month: '2026-11', vnd: 30, count: 5 }],
      },
    })
  })
})

describe('workspace request contracts', () => {
  it('saves a wrapped data body with Bearer authentication and accepts 204', async () => {
    server.use(
      http.put(api + '/api/workspace/items/doc/item', async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer engine-token')
        expect(await request.json()).toEqual({ data: { title: 'Đề' } })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(
      workspaceItemSave({
        params: { path: { kind: 'doc', id: 'item' } },
        body: { data: { title: 'Đề' } },
      }),
    ).resolves.toBeUndefined()
  })

  it('chunks deletes into at most 200 comma-separated ids and skips empty input', async () => {
    const chunks: string[][] = []
    server.use(
      http.delete(api + '/api/workspace/items/doc', ({ request }) => {
        const values = new URL(request.url).searchParams.getAll('ids')
        expect(values).toHaveLength(1)
        chunks.push(values[0]!.split(','))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const ids = Array.from({ length: 401 }, (_, i) => 'item-' + i)
    await removeWorkspaceItems('doc', ids)
    expect(chunks.map((chunk) => chunk.length)).toEqual([200, 200, 1])
    expect(chunks.flat()).toEqual(ids)
    await removeWorkspaceItems('doc', [])
    expect(chunks).toHaveLength(3)
  })

  it('stops deleting after a failed chunk and preserves the server detail', async () => {
    let requests = 0
    server.use(
      http.delete(api + '/api/workspace/items/doc', () => {
        requests++
        return HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'Mục đã thay đổi.' },
          { status: 409 },
        )
      }),
    )
    await expect(
      removeWorkspaceItems(
        'doc',
        Array.from({ length: 201 }, (_, i) => String(i)),
      ),
    ).rejects.toThrow('Mục đã thay đổi.')
    expect(requests).toBe(1)
  })
})

describe('multipart uploads and AI streaming', () => {
  it.each(['images', 'documents', 'extract'] as const)(
    'sends %s as multipart {file}, not a data URL',
    async (kind) => {
      const path = kind === 'extract' ? '/api/media/extract' : '/api/storage/' + kind
      server.use(
        http.post(api + path, async ({ request }) => {
          expect(request.headers.get('Content-Type')).toContain('multipart/form-data; boundary=')
          const form = await request.formData()
          const file = form.get('file') as File
          expect(file.name).toBe('lesson.txt')
          expect(await file.text()).toBe('lesson')
          expect(form.has('dataUrl')).toBe(false)
          expect(form.get('subject')).toBe(kind === 'documents' ? 'Toán' : null)
          expect(form.get('marks')).toBe(kind === 'extract' ? 'true' : null)
          return HttpResponse.json({ url: '/api/files/image' }, { status: 201 })
        }),
      )
      const file = new File(['lesson'], 'lesson.txt', { type: 'text/plain' })
      if (kind === 'images') await uploadImageFile(file)
      else if (kind === 'documents') await uploadDocumentFile(file, 'Toán')
      else await extractFile(file, true)
    },
  )

  it('uses the shared SSE parser with the required task, Bearer and retry receipt', async () => {
    server.use(
      http.post(api + '/api/ai/chat', async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer engine-token')
        expect(request.headers.get('X-Ai-Retry-Of')).toBe('receipt')
        expect(await request.json()).toMatchObject({ task: 'sua-cau', stream: true })
        return new HttpResponse(
          'data: {"type":"delta","c":"Xin"}\n\ndata: {"type":"done","content":"Xin chào"}\n\ndata: [DONE]\n\n',
          { headers: { 'Content-Type': 'text/event-stream' } },
        )
      }),
    )
    const events = await Array.fromAsync(
      streamChat(
        { task: 'sua-cau', messages: [{ role: 'user', content: 'Sửa câu' }] },
        undefined,
        'receipt',
      ),
    )
    expect(events.map((event) => JSON.parse(event.data).type)).toEqual(['delta', 'done'])
  })

  it('supports the JSON response used by non-streaming providers', async () => {
    server.use(
      http.post(api + '/api/ai/chat', () => HttpResponse.json({ content: 'Xong', model: 'model' })),
    )
    const events = await Array.fromAsync(
      streamChat({ task: 'sua-cau', messages: [{ role: 'user', content: 'Sửa câu' }] }),
    )
    expect(events.map((event) => JSON.parse(event.data))).toEqual([
      { type: 'done', content: 'Xong', model: 'model' },
    ])
  })
})
