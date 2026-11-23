import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { closeTestApp, createTestApp } from '@/__tests__/helpers/create-app'
import { createRequest } from '@/__tests__/helpers/create-request'
import { PrismaService } from '@/app/database/prisma.service'

import type { INestApplication } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'

describe('current user management endpoints', () => {
  let app: INestApplication
  let admin: User
  let member: User
  let adminToken: string
  let moderatorToken: string

  beforeAll(async () => {
    app = await createTestApp()
    const prisma = app.get(PrismaService)
    admin = globalThis.e2eAuth.addUser('Admin')
    const moderator = globalThis.e2eAuth.addUser('Moderator')
    member = globalThis.e2eAuth.addUser('Member')
    await prisma.appUserRole.createMany({
      data: [
        { userId: admin.id, role: 'admin' },
        { userId: moderator.id, role: 'moderator' },
      ],
    })
    await prisma.presence.create({ data: { userId: member.id } })
    await prisma.userItem.create({
      data: { ownerId: member.id, kind: 'doc', id: globalThis.e2ePrefix, data: {} },
    })
    adminToken = await globalThis.e2eAuth.token(admin)
    moderatorToken = await globalThis.e2eAuth.token(moderator)
  })

  afterAll(async () => {
    if (app) await closeTestApp(app)
  })

  it('reads the current platform role from PostgreSQL rather than JWT claims', async () => {
    const response = await createRequest(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body).toEqual({ userId: admin.id, role: 'admin' })
  })

  it('joins auth-directory users with real database activity', async () => {
    const response = await createRequest(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body).toMatchObject({
      total: 3,
      items: expect.arrayContaining([
        expect.objectContaining({ id: member.id, docs: 1, decks: 0, online: true, role: null }),
        expect.objectContaining({ id: admin.id, role: 'admin' }),
      ]),
    })
  })

  it('returns a genuinely empty filtered page', async () => {
    const response = await createRequest(app)
      .get('/api/admin/users')
      .query({ q: `${globalThis.e2ePrefix}-missing` })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body).toEqual({ items: [], total: 0 })
  })

  it('requires authentication for admin user lists', async () => {
    const response = await createRequest(app).get('/api/admin/users').expect(401)

    expect(response.body).toMatchObject({ status: 401, code: 'TOKEN_MISSING' })
  })

  it('forbids a moderator from the admin-only list', async () => {
    const response = await createRequest(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(403)

    expect(response.headers['content-type']).toContain('application/problem+json')
    expect(response.body).toMatchObject({ status: 403, code: 'INSUFFICIENT_SCOPE' })
  })

  it('returns validation Problem Details for unknown query fields', async () => {
    const response = await createRequest(app)
      .get('/api/admin/users')
      .query({ unexpected: 'field' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(422)

    expect(response.body).toMatchObject({
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: expect.arrayContaining([expect.objectContaining({ field: 'unexpected' })]),
    })
  })

  it('maps upstream directory failures to Problem Details', async () => {
    globalThis.e2eAuth.failList(true)
    try {
      const response = await createRequest(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500)

      expect(response.body).toMatchObject({ status: 500, code: 'INTERNAL_SERVER_ERROR' })
      expect(response.headers['content-type']).toContain('application/problem+json')
    } finally {
      globalThis.e2eAuth.failList(false)
    }
  })
})
