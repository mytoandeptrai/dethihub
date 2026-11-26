import { act, renderHook, waitFor } from '@testing-library/react'
import { emptyDoc, stopSync, store_docs_useDocStore as useDocStore } from '@workspace-engine'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkspaceSync } from '@/modules/shell/hooks/use-global-container'
import { server } from '@/testing/msw/server'

const auth = vi.hoisted(() => ({ session: null as unknown }))
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: async () => ({ data: { session: auth.session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  }),
}))

const doc = emptyDoc({ id: 'sync-doc', title: 'Đề đồng bộ' })
beforeEach(() => {
  stopSync()
  useDocStore.setState({ myDocs: [], myDecks: [] })
  auth.session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: 9_999_999_999,
    user: { id: 'workspace-user', email: 'test@example.com', user_metadata: {} },
  }
})
afterEach(() => stopSync())

describe('authenticated workspace lifecycle', () => {
  it('bootstraps a cold session, pulls documents and pushes local edits through the API', async () => {
    const writes: unknown[] = []
    server.use(
      http.get('http://localhost:3000/api/workspace/items', ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('kind') === 'doc'
            ? [{ id: doc.id, data: doc }]
            : [],
        ),
      ),
      http.put('http://localhost:3000/api/workspace/items/:kind/:id', async ({ request }) => {
        writes.push(await request.json())
        return HttpResponse.json({ ok: true })
      }),
    )
    const hook = renderHook(() => useWorkspaceSync('workspace-user'))
    await waitFor(() => expect(useDocStore.getState().myDocs[0]?.title).toBe(doc.title))
    act(() => useDocStore.getState().renameDoc(doc.id, 'Đề đã đổi tên'))
    await waitFor(
      () =>
        expect(writes).toContainEqual(
          expect.objectContaining({ data: expect.objectContaining({ title: 'Đề đã đổi tên' }) }),
        ),
      { timeout: 4000 },
    )
    hook.unmount()
  })

  it('accepts empty workspaces and does not start anonymously', async () => {
    const reads: string[] = []
    server.use(
      http.get('http://localhost:3000/api/workspace/items', ({ request }) => {
        reads.push(request.url)
        return HttpResponse.json([])
      }),
    )
    const anonymous = renderHook(() => useWorkspaceSync())
    expect(reads).toEqual([])
    anonymous.unmount()
    renderHook(() => useWorkspaceSync('workspace-user'))
    await waitFor(() => expect(reads).toHaveLength(5))
    expect(useDocStore.getState().myDocs).toEqual([])
  })

  it('preserves local work when the API fails', async () => {
    useDocStore.setState({ myDocs: [doc] })
    const reads: string[] = []
    server.use(
      http.get('http://localhost:3000/api/workspace/items', ({ request }) => {
        reads.push(request.url)
        return HttpResponse.json({ detail: 'Tạm ngừng', status: 503 }, { status: 503 })
      }),
    )
    renderHook(() => useWorkspaceSync('workspace-user'))
    await waitFor(() => expect(reads).toHaveLength(5))
    expect(useDocStore.getState().myDocs).toEqual([doc])
  })
})
