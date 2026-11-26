import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { getPublicCollection, getPublicPricing } from '@/modules/public-pages/public-page-data'
import { server } from '@/testing/msw/server'

vi.mock('server-only', () => ({}))

describe('public structured-data reads', () => {
  it('fetches anonymous pricing and only listed community exams', async () => {
    server.use(
      http.get('http://localhost:3000/api/billing/pricing', ({ request }) => {
        expect(request.headers.has('authorization')).toBe(false)
        return HttpResponse.json({ packs: [{ vnd: 50_000, bonus: 10 }] })
      }),
      http.get('http://localhost:3000/api/exams/community', () =>
        HttpResponse.json([
          { id: 'listed', listed: true },
          { id: 'private', listed: false },
        ]),
      ),
    )
    expect(await getPublicPricing()).toMatchObject({ packs: [{ vnd: 50_000 }] })
    expect(await getPublicCollection()).toEqual([{ id: 'listed', listed: true }])
  })
  it('falls back on errors and malformed collections', async () => {
    server.use(
      http.get('http://localhost:3000/api/billing/pricing', () => HttpResponse.error()),
      http.get('http://localhost:3000/api/exams/community', () =>
        HttpResponse.json({ invalid: true }),
      ),
    )
    expect(await getPublicPricing()).toBeNull()
    expect(await getPublicCollection()).toEqual([])
  })
})
