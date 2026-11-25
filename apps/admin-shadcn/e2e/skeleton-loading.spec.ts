import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import adminDemo from '@/modules/admin-pages/testing/demo.json'
import { createOperationsFixture } from '@/modules/admin-pages/testing/operations-fixture'
import {
  communityFixtureCard,
  libraryFixtureFile,
  userPagesFixtureUsage,
} from '@/modules/community/testing/fixture'

import { signedInState } from './session-helper'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
let auth: Awaited<ReturnType<typeof signedInState>>
test.beforeAll(async ({ browser }) => {
  auth = await signedInState(browser, origin)
})

;[
  ['community', '/community', '/api/exams/community'],
  ['library', '/library', '/api/storage/documents'],
  ['admin-users', '/admin/users', '/api/admin/users'],
  ['admin-stats', '/admin/stats', '/api/admin/stats/overview'],
].forEach(([name, target, endpoint]) => {
  test(`${name} keeps its shell and exposes a shaped skeleton until API data arrives`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      storageState: auth.state,
      viewport: { width: 1440, height: 1000 },
    })
    const fixture = createOperationsFixture()
    let release!: () => void
    let held = false
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    await context.route('**/api/**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === endpoint && route.request().method() === 'GET') {
        held = true
        await gate
      }
      let response: { status: number; json: unknown } = fixture.respond(
        route.request().method(),
        url.href,
      )
      if (url.pathname === '/api/exams/community')
        response = { status: 200, json: [communityFixtureCard] }
      if (url.pathname === '/api/exams/community/authors') response = { status: 200, json: [] }
      if (url.pathname === '/api/storage/documents')
        response = { status: 200, json: [libraryFixtureFile] }
      if (url.pathname === '/api/storage/usage')
        response = { status: 200, json: userPagesFixtureUsage }
      if (url.pathname.startsWith('/api/workspace/items')) response = { status: 200, json: [] }
      const headers = {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
      }
      await route.fulfill(
        response.status === 204
          ? { status: 204, headers }
          : { status: response.status, json: response.json, headers },
      )
    })
    const page = await context.newPage()
    try {
      await page.goto(origin + target, { waitUntil: 'domcontentloaded' })
      await expect.poll(() => held).toBe(true)
      await expect(page.locator('main [data-slot="skeleton"]').first()).toBeVisible()
      await expect(
        page.getByRole('status', { name: 'Đang tải', exact: true }).first(),
      ).toBeAttached()
      await expect(page.locator('header').first()).toBeVisible()
      await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveCount(0)
      const output = process.env.SKELETON_ARTIFACT_DIR ?? info.outputPath('screenshots')
      await mkdir(output, { recursive: true })
      await page.screenshot({
        path: path.join(output, `${name}.png`),
        fullPage: true,
        animations: 'disabled',
      })
      release()
      await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0)
      await expect(page.locator('main')).not.toContainText('Đang tải…')
      const loadedText = name === 'community' ? communityFixtureCard.title
        : name === 'library' ? libraryFixtureFile.name
          : name === 'admin-users' ? adminDemo.users[0]!.email
            : String(fixture.data.stats[7].totalUsers)
      await expect(page.locator('main').getByText(loadedText, { exact: true }).first()).toBeVisible()
    } finally {
      release()
      await context.close()
    }
  })
})
