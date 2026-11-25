import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render'

import { FeaturesPanelContainer } from './features-panel-container'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({
    auth: { getSession: async () => ({ data: { session: { access_token: 'features-test' } } }) },
  }),
}))

const enabled = { word: true, slide: true, board: true, online: true }
const endpoint = 'http://localhost:3000/api/admin/settings'

beforeEach(() => vi.clearAllMocks())

describe('admin features', () => {
  it.each([false, true])(
    'optimistically updates full settings and handles failure=%s',
    async (fails) => {
      let release!: () => void
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      let body: unknown
      let stored = { ...enabled }
      server.use(
        http.get(endpoint, () => HttpResponse.json({ features: stored })),
        http.put(`${endpoint}/features`, async ({ request }) => {
          body = await request.json()
          await gate
          if (!fails) stored = { ...enabled, word: false }
          return fails
            ? HttpResponse.json({ title: 'Failed' }, { status: 500 })
            : HttpResponse.json({ value: { ...enabled, word: false } })
        }),
      )
      renderWithProviders(<FeaturesPanelContainer me={{ role: 'admin' }} />)
      const control = await screen.findByRole('switch', { name: 'Soạn đề (Word)' })
      await userEvent.click(control)
      await waitFor(() => expect(body).toEqual({ value: { ...enabled, word: false } }))
      expect(control).not.toBeChecked()
      release()
      await waitFor(() => expect(fails ? toast.error : toast.success).toHaveBeenCalled())
      await waitFor(() => expect(control).toHaveAttribute('aria-checked', String(fails)))
    },
  )
  it('shows moderators read-only switches and access notes', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json({ features: enabled })))
    renderWithProviders(<FeaturesPanelContainer me={{ role: 'moderator' }} />)
    await screen.findByRole('switch', { name: 'Đề online' })
    for (const control of screen.getAllByRole('switch')) expect(control).toBeDisabled()
    expect(screen.getByText(/Nhân viên luôn/)).toBeInTheDocument()
    expect(screen.getByText(/Nội dung hiện có/)).toBeInTheDocument()
  })
  it.each([200, 500])(
    'renders empty or failed responses without editable switches: %s',
    async (status) => {
      server.use(http.get(endpoint, () => HttpResponse.json({}, { status })))
      renderWithProviders(<FeaturesPanelContainer me={{ role: 'admin' }} />)
      expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải')
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    },
  )
})
