import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { createApiClient } from '@/lib/api-client'
import { ApiClientError } from '@/lib/api-error'
import { server } from '@/testing/msw/server'

const origin = 'http://localhost:3000'

describe('authenticated API client', () => {
  it('refreshes concurrent 401s once and replays POST bodies with the new token', async () => {
    let token = 'expired'
    const refreshToken = vi.fn(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 20)
      })
      token = 'fresh'
      return token
    })
    const onUnauthorized = vi.fn()
    const bodies: unknown[] = []
    server.use(
      http.post(origin + '/api/feedback', async ({ request }) => {
        bodies.push(await request.json())
        return request.headers.get('Authorization') === 'Bearer fresh'
          ? new HttpResponse(null, { status: 204 })
          : HttpResponse.json({ title: 'Unauthorized', status: 401 }, { status: 401 })
      }),
    )
    const client = createApiClient({ getToken: async () => token, refreshToken, onUnauthorized })
    await Promise.all(
      [1, 2, 3].map(() => client.POST('/api/feedback', { body: { message: 'hello' } })),
    )
    expect(refreshToken).toHaveBeenCalledOnce()
    expect(bodies).toHaveLength(6)
    expect(bodies.every((body) => JSON.stringify(body) === '{"message":"hello"}')).toBe(true)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it.each([429, 503])('preserves Problem Details verbatim for %s', async (status) => {
    server.use(
      http.get(origin + '/api/me', () =>
        HttpResponse.json(
          {
            title: 'Unavailable',
            status,
            code: 'LIMIT',
            detail: 'Hãy thử lại sau 12 giây.',
          },
          { status },
        ),
      ),
    )
    const refreshToken = vi.fn()
    const client = createApiClient({ getToken: async () => null, refreshToken })
    await expect(client.GET('/api/me')).rejects.toMatchObject({
      status,
      code: 'LIMIT',
      detail: 'Hãy thử lại sau 12 giây.',
      message: 'Hãy thử lại sau 12 giây.',
    })
    expect(refreshToken).not.toHaveBeenCalled()
  })

  it('does not retry twice and navigates on a rejected retry', async () => {
    let count = 0
    server.use(
      http.get(origin + '/api/me', () => {
        count++
        return HttpResponse.json(
          { title: 'Unauthorized', status: 401, detail: 'Phiên hết hạn.' },
          { status: 401 },
        )
      }),
    )
    const onUnauthorized = vi.fn()
    const client = createApiClient({
      getToken: async () => 'old',
      refreshToken: async () => 'new',
      onUnauthorized,
    })
    await expect(client.GET('/api/me')).rejects.toMatchObject({ detail: 'Phiên hết hạn.' })
    expect(count).toBe(2)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('handles failed refresh and an empty non-JSON error response', async () => {
    server.use(http.get(origin + '/api/me', () => new HttpResponse(null, { status: 401 })))
    const onUnauthorized = vi.fn()
    const client = createApiClient({
      getToken: async () => null,
      refreshToken: async () => null,
      onUnauthorized,
    })
    await expect(client.GET('/api/me')).rejects.toBeInstanceOf(ApiClientError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
