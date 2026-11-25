import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { closeTestApp, createTestApp } from '@/__tests__/helpers/create-app'
import { createRequest } from '@/__tests__/helpers/create-request'
import { PrismaService } from '@/app/database/prisma.service'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'

import type { INestApplication } from '@nestjs/common'

describe('feature settings HTTP endpoints', () => {
  let app: INestApplication
  let adminToken: string
  let moderatorToken: string
  let original: unknown
  const enabled = { word: true, slide: true, board: true, online: true }

  beforeAll(async () => {
    app = await createTestApp()
    original = await app.get(AppSettingsService).get('features')
    const admin = globalThis.e2eAuth.addUser('Admin')
    const moderator = globalThis.e2eAuth.addUser('Moderator')
    await app.get(PrismaService).appUserRole.createMany({
      data: [
        { userId: admin.id, role: 'admin' },
        { userId: moderator.id, role: 'moderator' },
      ],
    })
    adminToken = await globalThis.e2eAuth.token(admin)
    moderatorToken = await globalThis.e2eAuth.token(moderator)
  })

  afterAll(async () => {
    if (app) {
      await app.get(AppSettingsService).set('features', original ?? {})
      await closeTestApp(app)
    }
  })

  it('resolves partial stored settings publicly and for moderators', async () => {
    await app.get(AppSettingsService).set('features', { word: false })
    const expected = { ...enabled, word: false }
    expect((await createRequest(app).get('/api/site/status').expect(200)).body.features).toEqual(
      expected,
    )
    expect(
      (
        await createRequest(app)
          .get('/api/admin/settings')
          .set('Authorization', `Bearer ${moderatorToken}`)
          .expect(200)
      ).body.features,
    ).toEqual(expected)
  })

  it('rejects moderator writes and malformed admin writes', async () => {
    await createRequest(app)
      .put('/api/admin/settings/features')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ value: enabled })
      .expect(403)
    for (const value of [{ ...enabled, extra: true }, { ...enabled, word: 'false' }, []]) {
      const response = await createRequest(app)
        .put('/api/admin/settings/features')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value })
      expect([400, 422]).toContain(response.status)
    }
  })

  it('persists admin writes and invalidates public cached status', async () => {
    await createRequest(app)
      .put('/api/admin/settings/features')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ value: enabled })
      .expect(200)
    expect((await createRequest(app).get('/api/site/status').expect(200)).body.features).toEqual(
      enabled,
    )
  })
})
