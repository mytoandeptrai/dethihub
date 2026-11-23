import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { Document, Packer, Paragraph } from 'docx'

import communityCopy from '@/i18n/messages/community-copy'
import libraryCopy from '@/i18n/messages/library-copy'
import profileCopy from '@/i18n/messages/profile-copy'
import {
  communityFixtureCard,
  communityFixtureDoc,
  communityFixtureOwner,
  libraryFixtureFile,
  userPagesFixtureUsage,
} from '@/modules/community/testing/fixture'

import { signedInState } from './session-helper'

import type { Page } from '@playwright/test'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const api = process.env.E2E_API_ORIGIN ?? 'http://localhost:3000'
const paths = ['/community', '/library', '/profile', '/profile/uploads']
function errorsOf(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}
async function content(page: Page, path: string) {
  const response = await page.goto(origin + path, { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('main').first()).toBeVisible()
  await expect
    .poll(async () => (await page.locator('main').first().innerText()).trim().length)
    .toBeGreaterThan(20)
  await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toHaveCount(0)
}
async function fixtures(page: Page) {
  let files = [libraryFixtureFile]
  await page.route('**/api/workspace/items**', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          json:
            new URL(route.request().url()).searchParams.get('kind') === 'doc'
              ? [
                  {
                    id: communityFixtureDoc.id,
                    kind: 'doc',
                    data: communityFixtureDoc,
                    updatedAt: communityFixtureDoc.updatedAt,
                  },
                ]
              : [],
        })
      : route.fulfill({ status: 204 }),
  )
  await page.route('**/api/exams/community?**', (route) =>
    route.fulfill({ json: [communityFixtureCard] }),
  )
  await page.route('**/api/exams/community/authors?**', (route) =>
    route.fulfill({ json: [{ id: communityFixtureOwner, name: 'Cô An', avatar: null }] }),
  )
  await page.route('**/api/me/exams**', (route) =>
    route.fulfill({
      json: communityFixtureCard,
      status: route.request().method() === 'POST' ? 201 : 200,
    }),
  )
  await page.route('**/api/storage/usage', (route) =>
    route.fulfill({ json: userPagesFixtureUsage }),
  )
  await page.route('**/api/storage/documents**', async (route) => {
    if (route.request().method() === 'DELETE') {
      files = []
      await route.fulfill({ status: 204 })
    } else await route.fulfill({ json: files })
  })
  await page.route('**/api/files/doc/phase3e-file', (route) =>
    route.fulfill({ body: '%PDF-1.4\n%%EOF', contentType: 'application/pdf' }),
  )
  await page.route('**/api/ai/quota', (route) =>
    route.fulfill({
      json: {
        unlimited: false,
        granted: 120_000,
        quota: { scope: 'month', base: 0, credits: 120_000, used: 0, limit: 120_000 },
      },
    }),
  )
  await page.route('**/api/ai/credits/events?**', (route) =>
    route.fulfill({
      json: [{ id: 1, kind: 'welcome', tokens: 120_000, createdAt: '2026-01-01T00:00:00Z' }],
    }),
  )
}
for (const width of [1440, 390])
  for (const path of paths)
    test(`signed out ${path} at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      try {
        const page = await context.newPage()
        const errors = errorsOf(page)
        await fixtures(page)
        await content(page, path)
        if (path === '/community') {
          await expect(page.getByText('Cô An', { exact: true })).toBeVisible()
          await page.getByRole('button', { name: communityCopy.m411, exact: true }).click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.getByText(communityCopy.m420, { exact: true })).toBeVisible()
          await page.keyboard.press('Escape')
          await expect(page.getByRole('dialog')).toHaveCount(0)
        }
        if (path === '/library')
          await expect(page.getByText(libraryCopy.m452, { exact: true })).toBeVisible()
        if (path.startsWith('/profile'))
          await expect(page).toHaveURL(
            (url) => url.pathname === '/login' && url.searchParams.get('redirectTo') === path,
          )
        expect(errors).toEqual([])
      } finally {
        await context.close()
      }
    })

test.describe('user pages signed in', () => {
  test.skip(!process.env.E2E_ACCOUNT_FILE, 'requires existing private test account')
  const signedIn = { account: undefined as Awaited<ReturnType<typeof signedInState>> | undefined }
  test.beforeAll(async ({ browser }) => {
    signedIn.account = await signedInState(browser, origin)
  })
  for (const width of [1440, 390])
    test(`signed-in pages and overlays at ${width}px`, async ({ browser }) => {
      const account = signedIn.account!
      const context = await browser.newContext({
        storageState: account.state,
        viewport: { width, height: 900 },
      })
      try {
        const page = await context.newPage()
        const errors = errorsOf(page)
        await fixtures(page)
        await content(page, '/community')
        await expect(page.getByText('Cô An', { exact: true })).toBeVisible()
        await page.getByPlaceholder(communityCopy.m412).fill('no-matching-document')
        await expect(page.getByText(communityCopy.m416, { exact: true })).toBeVisible()
        await page.getByPlaceholder(communityCopy.m412).fill('')
        await page.getByRole('button', { name: communityCopy.m411, exact: true }).click()
        const modal = page.getByRole('dialog', { name: communityCopy.m411, exact: true })
        await expect(modal.getByText(communityFixtureDoc.title, { exact: true })).toBeVisible()
        await modal.getByRole('button', { name: communityCopy.m103, exact: true }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.getByRole('button', { name: 'Quay lại sửa', exact: true }).click()
        await expect(modal).toBeVisible()
        await page.keyboard.press('Escape')
        await content(page, '/library')
        const row = page.getByRole('listitem').filter({ hasText: libraryFixtureFile.name })
        await expect(row).toBeVisible()
        const opened = page.waitForResponse(
          (response) => new URL(response.url()).pathname === '/api/files/doc/phase3e-file',
        )
        await row.getByRole('button', { name: libraryCopy.m5, exact: true }).click()
        expect((await opened).status()).toBe(200)
        await row
          .getByRole('button', {
            name: libraryCopy.m467.replace('{value0}', libraryFixtureFile.name),
          })
          .click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(row).toBeVisible()
        await content(page, '/profile')
        await expect(page.getByLabel(profileCopy.m34)).toBeVisible()
        await expect(page.getByText(profileCopy.m1, { exact: true })).toBeVisible()
        await page.getByLabel(profileCopy.m34).fill('')
        await page.getByRole('button', { name: profileCopy.m37, exact: true }).click()
        await expect(page.getByText(profileCopy.m8, { exact: true })).toBeVisible()
        await content(page, '/profile/uploads')
        await expect(page.getByText(communityFixtureDoc.title, { exact: true })).toBeVisible()
        await expect(page.getByText(libraryFixtureFile.name, { exact: true })).toBeVisible()
        const radios = page.getByRole('radio')
        await radios.first().focus()
        await page.keyboard.press('ArrowRight')
        await expect(radios.nth(1)).toBeFocused()
        await page.keyboard.press('Space')
        await expect(page.getByText(libraryFixtureFile.name, { exact: true })).toHaveCount(0)
        expect(errors).toEqual([])
      } finally {
        await context.close()
      }
    })
  test('LIVE community publication, library upload and profile edit with restoration and audit', async ({
    browser,
    request,
  }) => {
    test.setTimeout(180_000)
    const account = signedIn.account!
    const headers = { Authorization: `Bearer ${account.accessToken}` }
    const context = await browser.newContext({
      storageState: account.state,
      viewport: { width: 1440, height: 900 },
    })
    const prefix = `E2E phase3e ${Date.now()}`
    const doc = {
      ...communityFixtureDoc,
      id: `phase3e-${Date.now()}`,
      title: prefix,
      updatedAt: new Date().toISOString(),
    }
    const env = Object.fromEntries(
      (await readFile('.env.local', 'utf8')).split('\n').flatMap((line) => {
        const match = line.match(/^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)=(.*)$/)
        return match ? [[match[1]!, match[2]!.trim().replaceAll(/^['"]|['"]$/g, '')]] : []
      }),
    )
    const sdk = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const session = await sdk.auth.setSession({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    })
    expect(session.error).toBeNull()
    const originalName = account.user!.user_metadata.display_name ?? null
    let changed = false
    try {
      const page = await context.newPage()
      const errors = errorsOf(page)
      await content(page, '/profile')
      const input = page.getByLabel(profileCopy.m34)
      const name = await input.inputValue()
      await input.fill(prefix)
      const saved = page.waitForResponse(
        (response) => response.request().method() === 'PUT' && response.url().includes('/user'),
      )
      changed = true
      await page.getByRole('button', { name: profileCopy.m37, exact: true }).click()
      expect((await saved).status()).toBe(200)
      await expect(page.getByText(profileCopy.m10, { exact: true })).toBeVisible()
      if (name) {
        await input.fill(name)
        await page.getByRole('button', { name: profileCopy.m37, exact: true }).click()
        await expect(page.getByText(profileCopy.m10, { exact: true })).toBeVisible()
      }
      console.log('LIVE profile: display name edited and restored through UI')
      const stored = await request.put(api + `/api/workspace/items/doc/${doc.id}`, {
        headers,
        data: { data: doc },
      })
      expect(stored.status()).toBe(204)
      await content(page, '/community')
      await page.getByRole('button', { name: communityCopy.m411, exact: true }).click()
      const modal = page.getByRole('dialog', { name: communityCopy.m411, exact: true })
      const item = modal.getByRole('listitem').filter({ hasText: prefix })
      await expect(item).toBeVisible()
      await item.getByRole('button', { name: communityCopy.m103, exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      const published = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/me/exams',
      )
      await page.getByRole('button', { name: 'Vẫn đăng', exact: true }).click()
      const publication = await published
      expect(publication.status()).toBe(201)
      const publishedRow = (await publication.json()) as { id: string; listed: boolean }
      expect(publishedRow.listed).toBe(true)
      await expect(page.getByText(prefix, { exact: true })).toBeVisible()
      console.log(
        'LIVE community: missing-answer confirmation, POST 201 and listed document visible',
      )
      expect(
        (await request.delete(api + `/api/me/exams/${publishedRow.id}`, { headers })).status(),
      ).toBe(204)
      await content(page, '/library')
      const buffer = await Packer.toBuffer(
        new Document({
          sections: [{ children: [new Paragraph('Temporary Phase 3e verification document.')] }],
        }),
      )
      const uploaded = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/storage/documents',
      )
      await page.locator('input[type=file]').setInputFiles({
        name: prefix + '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer,
      })
      const upload = await uploaded
      expect(upload.status()).toBe(201)
      const row = page.getByRole('listitem').filter({ hasText: prefix + '.docx' })
      await expect(row).toBeVisible()
      const download = page.waitForEvent('download')
      await row.getByRole('button', { name: libraryCopy.m5, exact: true }).click()
      expect((await download).suggestedFilename()).toBe(prefix + '.docx')
      await row
        .getByRole('button', { name: libraryCopy.m467.replace('{value0}', prefix + '.docx') })
        .click()
      const removed = page.waitForResponse(
        (response) =>
          response.request().method() === 'DELETE' &&
          new URL(response.url()).pathname.startsWith('/api/storage/documents/'),
      )
      await page
        .getByRole('dialog', { name: libraryCopy.m448, exact: true })
        .getByRole('button', { name: libraryCopy.m8, exact: true })
        .click()
      expect((await removed).status()).toBe(204)
      await expect(row).toHaveCount(0)
      console.log(
        'LIVE library: tiny DOCX uploaded, authenticated file downloaded, document deleted',
      )
      expect(errors).toEqual([])
    } finally {
      await context.close().catch(() => {})
      const cleanup = await Promise.allSettled([
        (async () => {
          if (changed) {
            const restored = await sdk.auth.updateUser({ data: { display_name: originalName } })
            expect(restored.error).toBeNull()
            const audited = await sdk.auth.getUser()
            expect(audited.data.user?.user_metadata.display_name ?? null).toBe(originalName)
            console.log(
              'CLEANUP profile: SDK independently confirms original display name restored',
            )
          }
        })(),
        ...(
          [
            ['/api/me/exams', 'title'],
            ['/api/storage/documents', 'name'],
          ] as const
        ).map(async ([path, key]) => {
          const response = await request.get(api + path, { headers })
          expect(response.status()).toBe(200)
          const rows = (await response.json()) as { id: string; title?: string; name?: string }[]
          for (const row of rows.filter((item) => item[key]?.startsWith(prefix)))
            expect([204, 404]).toContain(
              (await request.delete(api + path + '/' + row.id, { headers })).status(),
            )
          const check = await request.get(api + path, { headers })
          expect(
            ((await check.json()) as Record<string, string>[]).filter((item) =>
              item[key]?.startsWith(prefix),
            ),
          ).toHaveLength(0)
        }),
        (async () => {
          expect([204, 404]).toContain(
            (
              await request.delete(api + `/api/workspace/items/doc?ids=${doc.id}`, { headers })
            ).status(),
          )
          const checked = await request.get(api + '/api/workspace/items?kind=doc', { headers })
          expect(
            ((await checked.json()) as { id: string }[]).some((item) => item.id === doc.id),
          ).toBe(false)
        })(),
      ])
      for (const [index, result] of cleanup.entries())
        expect.soft(result.status, `Cleanup operation ${index + 1}`).toBe('fulfilled')
      console.log(
        'CLEANUP audit: temporary publication, private file and workspace document absent',
      )
    }
  })
})
