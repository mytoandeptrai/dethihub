import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { closeTestApp, createTestApp } from '@/__tests__/helpers/create-app'
import { createRequest } from '@/__tests__/helpers/create-request'

import type { INestApplication } from '@nestjs/common'

describe('public HTTP endpoints', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    if (app) await closeTestApp(app)
  })

  it('reports real PostgreSQL and Redis health without the api prefix', async () => {
    const response = await createRequest(app).get('/health').expect(200)

    expect(response.body).toMatchObject({
      environment: 'test',
      database: { status: 'up' },
      redis: { status: 'up' },
      memory_heap: { status: 'up' },
      memory_rss: { status: 'up' },
      storage: { status: 'up' },
    })
  })

  it('serves the site status without authentication', async () => {
    const response = await createRequest(app).get('/api/site/status').expect(200)

    expect(response.body).toEqual({
      maintenance: { on: false, message: '', until: null },
      announcements: [],
      features: { word: true, slide: true, board: true, online: true },
    })
  })

  it('returns 400 Problem Details for an invalid exam UUID', async () => {
    const response = await createRequest(app).get('/api/exams/not-a-uuid/play').expect(400)

    expect(response.headers['content-type']).toContain('application/problem+json')
    expect(response.body).toMatchObject({ status: 400, code: 'INVALID_UUID' })
  })

  it('validates public attempt bodies before looking up the exam', async () => {
    const response = await createRequest(app)
      .post(`/api/exams/${randomUUID()}/attempts`)
      .send({ unexpected: true })
      .expect(422)

    expect(response.body).toMatchObject({
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
        expect.objectContaining({ field: 'answers' }),
        expect.objectContaining({ field: 'unexpected' }),
      ]),
    })
  })

  it.each(['/api/articles/all', `/api/orders/${randomUUID()}`, '/api/users'])(
    'does not register the retired boilerplate endpoint %s',
    async (path) => {
      await createRequest(app).get(path).expect(404)
    },
  )

  it('does not expose the retired local password-login endpoint', async () => {
    await createRequest(app).post('/api/auth/login').send({}).expect(404)
  })
})
