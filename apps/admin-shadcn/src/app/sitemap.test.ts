import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { site } from '@/config/site'
import { server } from '@/testing/msw/server'

import sitemap from './sitemap'

const endpoint = 'http://localhost:3000/api/exams/community'

describe('sitemap', () => {
  it('includes static public pages and listed exam dates without authentication', async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        expect(new URL(request.url).searchParams.get('limit')).toBe('100')
        expect(request.headers.has('Authorization')).toBe(false)
        return HttpResponse.json([
          { id: 'exam-1', listed: true, createdAt: '2025-01-02T00:00:00Z' },
          { id: 'hidden', listed: false, createdAt: '2025-01-02T00:00:00Z' },
        ])
      }),
    )
    const entries = await sitemap()
    expect(entries).toHaveLength(6)
    expect(entries.map((entry) => entry.url)).toEqual([
      site.url,
      `${site.url}/pricing`,
      `${site.url}/community`,
      `${site.url}/terms`,
      `${site.url}/privacy`,
      `${site.url}/exams/exam-1`,
    ])
    expect(entries[5]?.lastModified).toEqual(new Date('2025-01-02T00:00:00Z'))
  })
  it('returns stable static entries when the API is empty', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json([])))
    expect(await sitemap()).toHaveLength(5)
    expect(await sitemap()).toEqual(await sitemap())
  })
  it.each(['http', 'network', 'malformed'] as const)(
    'returns static entries on %s failure',
    async (failure) => {
      server.use(
        http.get(endpoint, () =>
          failure === 'http'
            ? new HttpResponse(null, { status: 503 })
            : failure === 'network'
              ? HttpResponse.error()
              : HttpResponse.text('invalid json'),
        ),
      )
      expect(await sitemap()).toHaveLength(5)
    },
  )
})
