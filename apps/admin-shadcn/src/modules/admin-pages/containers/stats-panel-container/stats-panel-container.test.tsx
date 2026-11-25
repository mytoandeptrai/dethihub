import { clearAdminCache } from '@admin-pages-engine'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createOperationsFixture } from '@/modules/admin-pages/testing/operations-fixture'
import { server } from '@/testing/msw/server'
import { renderWithProviders } from '@/testing/render'

import { StatsPanelContainer } from './stats-panel-container'

import type { components } from '@workspace/api-types'

type StatsOverviewResponseDto = components['schemas']['StatsOverviewResponseDto']
type OnlineResponseDto = components['schemas']['OnlineResponseDto']
type ProblemDetailsDto = components['schemas']['ProblemDetailsDto']

vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }))
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: 'stats-fixture', user: { id: 'fixture-staff' } } },
      }),
    },
  }),
}))

beforeEach(() => {
  clearAdminCache()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  )
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} })
})

describe('stats panel loading boundaries', () => {
  it.each(['data', 'empty', 'error'])(
    'keeps the date picker mounted and focused on refetch after initial %s',
    async (initial) => {
      const fixture = createOperationsFixture()
      let release!: () => void
      let held = false
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      server.use(
        http.get(
          'http://localhost:3000/api/admin/stats/overview',
          async ({
            request,
          }): Promise<HttpResponse<StatsOverviewResponseDto | ProblemDetailsDto>> => {
            const days = new URL(request.url).searchParams.get('days') === '30' ? 30 : 7
            if (days === 30) {
              held = true
              await gate
            } else if (initial === 'error')
              return HttpResponse.json<ProblemDetailsDto>(
                { type: 'about:blank', title: 'Stats unavailable', status: 500 },
                { status: 500 },
              )
            else if (initial === 'empty')
              return HttpResponse.json<StatsOverviewResponseDto>({
                ...fixture.data.stats[7],
                chartDays: [],
              })
            return HttpResponse.json<StatsOverviewResponseDto>(fixture.data.stats[days])
          },
        ),
        http.get('http://localhost:3000/api/admin/stats/online', () =>
          HttpResponse.json<OnlineResponseDto>({
            onlineCount: fixture.data.online.onlineCount,
            users: fixture.data.online.users.map(({ userId, email, lastSeen }) => ({
              userId,
              email,
              lastSeen,
              name: email,
              avatar: '',
            })),
          }),
        ),
      )
      const { unmount } = renderWithProviders(
        <StatsPanelContainer me={{ userId: 'fixture-staff', role: 'admin' }} />,
      )
      expect(screen.getByRole('status', { name: 'Đang tải' })).toBeInTheDocument()
      const picker = await screen.findByRole('radio', { name: '30 ngày' })
      await userEvent.click(picker)
      try {
        await waitFor(() => expect(held).toBe(true))
        expect(picker).toBeInTheDocument()
        expect(picker).toHaveFocus()
        expect(screen.getAllByRole('status', { name: 'Đang tải' }).length).toBeGreaterThan(0)
        act(() => release())
        await waitFor(() =>
          expect(screen.queryByRole('status', { name: 'Đang tải' })).not.toBeInTheDocument(),
        )
        expect(picker).toHaveFocus()
        expect(screen.getByRole('radio', { name: '30 ngày' })).toBe(picker)
      } finally {
        release()
        unmount()
      }
    },
  )
})
