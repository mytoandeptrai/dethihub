import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { closeTestApp, createTestApp } from '@/__tests__/helpers/create-app'
import { createRequest } from '@/__tests__/helpers/create-request'

import type { INestApplication } from '@nestjs/common'

describe('authentication HTTP boundary', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    if (app) await closeTestApp(app)
  })

  it('returns RFC 9457 Problem Details when a protected route has no token', async () => {
    const response = await createRequest(app).get('/api/me').expect(401)

    expect(response.headers['content-type']).toContain('application/problem+json')
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.body).toMatchObject({
      status: 401,
      title: 'Unauthorized',
      instance: '/api/me',
      code: 'TOKEN_MISSING',
      request_id: expect.any(String),
      timestamp: expect.any(String),
    })
  })

  it.each(['not-a-jwt', 'Bearer not-a-jwt', 'Bearer a.b.c'])(
    'rejects malformed tokens: %s',
    async (token) => {
      await createRequest(app).get('/api/me').set('Authorization', token).expect(401)
    },
  )

  it('verifies a signed ES256 token against the local JWKS endpoint', async () => {
    const user = globalThis.e2eAuth.addUser()
    const token = await globalThis.e2eAuth.token(user)
    const response = await createRequest(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual({ userId: user.id, role: null })
  })

  it('rejects expired signed tokens', async () => {
    const user = globalThis.e2eAuth.addUser()
    const token = await globalThis.e2eAuth.token(user, -60)

    await createRequest(app).get('/api/me').set('Authorization', `Bearer ${token}`).expect(401)
  })

  it('rejects a signed token with the wrong auth role', async () => {
    const user = globalThis.e2eAuth.addUser()
    const token = await globalThis.e2eAuth.token(user, 300, 'anon')

    await createRequest(app).get('/api/me').set('Authorization', `Bearer ${token}`).expect(401)
  })

  it('rejects a banned account after verifying its token', async () => {
    const user = globalThis.e2eAuth.addUser('Banned', true)
    const token = await globalThis.e2eAuth.token(user)
    const response = await createRequest(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)

    expect(response.body).toMatchObject({ status: 403, code: 'ACCOUNT_BANNED' })
  })

  it('fails closed when the account ban check is unavailable', async () => {
    const user = globalThis.e2eAuth.addUser()
    const token = await globalThis.e2eAuth.token(user)
    globalThis.e2eAuth.failLookup(true)
    try {
      const response = await createRequest(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(503)

      expect(response.body).toMatchObject({ status: 503, code: 'TOKEN_BUSY' })
    } finally {
      globalThis.e2eAuth.failLookup(false)
    }
  })
})
