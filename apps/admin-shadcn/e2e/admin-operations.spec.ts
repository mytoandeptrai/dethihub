import { expect, test } from '@playwright/test'

import copy from '@/i18n/messages/admin-ops-copy'
import { createOperationsFixture } from '@/modules/admin-pages/testing/operations-fixture'

import { signedInState } from './session-helper'

import type { BrowserContext, Page } from '@playwright/test'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const api = process.env.E2E_API_ORIGIN ?? 'http://localhost:3000'
const paths = [
  '/admin/stats',
  '/admin/stats/weekly',
  '/admin/payments',
  '/admin/ai',
  '/admin/audit',
  '/admin/unknown-panel',
]
let auth: Awaited<ReturnType<typeof signedInState>>
test.beforeAll(async ({ browser }) => {
  auth = await signedInState(browser, origin)
})
async function fixtures(context: BrowserContext, role: string | null = 'admin') {
  const fixture = createOperationsFixture()
  fixture.setRole(role)
  const headers = {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  }
  await context.route('https://i.pravatar.cc/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#e0e7ff"/></svg>',
    }),
  )
  await context.route('**/api/**', async (route) => {
    const request = route.request(),
      response = fixture.respond(request.method(), request.url(), request.postDataJSON() ?? {})
    await route.fulfill(
      response.status === 204
        ? { status: 204, headers }
        : { status: response.status, json: response.json, headers },
    )
  })
  return fixture
}
function errorsOf(page: Page) {
  page.setDefaultTimeout(7000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}
async function go(page: Page, path: string) {
  const response = await page.goto(origin + path, { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(200)
  await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toHaveCount(0)
}

;[1440, 390].forEach((width) =>
  test(`remaining admin staff routes and stats at ${width}`, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: auth.state,
      viewport: { width, height: 900 },
    })
    await fixtures(context)
    const page = await context.newPage()
    const errors = errorsOf(page)
    try {
      for (const path of paths) {
        await go(page, path)
        await expect
          .poll(async () => (await page.locator('main').first().innerText()).trim().length)
          .toBeGreaterThan(30)
      }
      await go(page, '/admin/stats')
      await expect(page.getByRole('heading', { name: copy.m4, exact: true })).toBeVisible()
      await page.getByRole('radio', { name: copy.m7, exact: true }).click()
      await page.getByRole('radio', { name: copy.m8, exact: true }).click()
      await page
        .getByRole('button')
        .filter({ has: page.locator('svg.lucide-radio') })
        .click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('00000000', { exact: true })).toHaveCount(4)
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      expect(errors).toEqual([])
    } finally {
      await context.close()
    }
  }),
)

test('signed-out admin operations redirect before protected reads', async ({ browser }) => {
  const context = await browser.newContext()
  const fixture = await fixtures(context, null)
  const page = await context.newPage()
  try {
    for (const path of paths) {
      await page.goto(origin + path)
      await expect(page).toHaveURL(/\/login\?redirectTo=/)
    }
    expect(fixture.requests.filter((request) => request.path.startsWith('/api/admin/'))).toEqual([])
  } finally {
    await context.close()
  }
})

test('payments filters, row drawer, nested prompt Escape, sync, manual credit and pricing', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  try {
    await go(page, '/admin/payments')
    await page.getByText('giaovien2@example.com', { exact: true }).click()
    const drawer = page.getByRole('dialog', { name: 'Đơn 100006', exact: true })
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button', { name: copy.m66, exact: true }).click()
    await expect(page.locator('[role="dialog"]')).toHaveCount(2)
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).toHaveCount(1)
    await expect(drawer).toBeVisible()
    await expect(drawer).not.toHaveClass(/drawer-out/)
    await drawer.getByRole('button', { name: copy.m104, exact: true }).click()
    await expect(page.locator('[role="dialog"]')).toHaveCount(2)
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).toHaveCount(1)
    await expect(drawer).toBeVisible()
    await expect(drawer).not.toHaveClass(/drawer-out/)
    await drawer.getByRole('button', { name: copy.m66, exact: true }).click()
    const prompt = page.getByRole('dialog').last()
    await prompt.getByRole('textbox').fill('Fixture statement checked')
    await prompt.getByRole('button', { name: copy.m67, exact: true }).click()
    await expect
      .poll(() => fixture.data.payments.items.find((item) => item.orderCode === 100_006)?.status)
      .toBe('paid')
    await expect(page.locator('[role="dialog"]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).toHaveCount(0)
    await page.getByRole('textbox', { name: copy.m77, exact: true }).fill('999999')
    await page.getByRole('button', { name: copy.m78, exact: true }).click()
    await expect(page.getByText(copy.m86, { exact: true })).toBeVisible()
    await page.getByRole('radio', { name: copy.m94, exact: true }).click()
    await page.getByLabel(copy.m211, { exact: true }).fill('30')
    await page.getByRole('button', { name: copy.m210, exact: true }).click()
    await expect.poll(() => fixture.data.settings.pricing?.pointsPer1000).toBe(30)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})

test('operations provider edits, reset layering, maintenance, welcome points and announcement preview', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  try {
    await go(page, '/admin/ai')
    const provider = fixture.data.targets.providers[0]!
    await page
      .getByRole('button', { name: 'Xem cấu hình ' + provider.provider, exact: true })
      .click()
    const drawer = page.getByRole('dialog', { name: 'Cấu hình ' + provider.provider, exact: true })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('button', { name: copy.m188, exact: true })).toHaveCount(0)
    await drawer.getByLabel(copy.m162, { exact: true }).fill('fixture-model')
    await drawer.getByRole('button', { name: copy.m197, exact: true }).click()
    await expect.poll(() => fixture.data.targets.providers[0]?.model).toBe('fixture-model')
    await expect(drawer).toHaveCount(0)
    await page
      .getByRole('button', { name: 'Xem cấu hình ' + provider.provider, exact: true })
      .click()
    await drawer.getByRole('button', { name: copy.m188, exact: true }).click()
    await expect(page.locator('[role="dialog"]')).toHaveCount(2)
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).toHaveCount(1)
    await drawer.getByRole('button', { name: copy.m188, exact: true }).click()
    await page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: copy.m188, exact: true })
      .click()
    await expect(drawer).toHaveCount(0)
    await expect.poll(() => fixture.data.targets.providers[0]?.custom).toBe(false)
    await page.locator('#switch-maintenance').click()
    await page.getByRole('dialog').getByRole('button', { name: copy.m114, exact: true }).click()
    await page.locator('#maint-message').fill('Fixture maintenance')
    await page.getByRole('button', { name: copy.m138, exact: true }).click()
    await expect.poll(() => fixture.data.settings.maintenance.on).toBe(true)
    await page.locator('#welcome-points').fill('25')
    await page
      .locator('#welcome-points')
      .locator('xpath=../..')
      .getByRole('button', { name: copy.m197, exact: true })
      .click()
    await expect.poll(() => fixture.data.settings.aiWelcome?.points).toBe(25)
    await page.getByRole('radio', { name: copy.m129, exact: true }).click()
    await page.getByRole('button', { name: copy.m243, exact: true }).click()
    const preview = page.getByRole('dialog')
    await expect(preview).toBeVisible()
    await preview.getByRole('button', { name: copy.nextAnnouncement, exact: true }).click()
    await expect(preview.getByText('Bảo trì cuối tuần', { exact: true }).last()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(preview).toHaveCount(0)
    await page
      .getByRole('textbox', { name: copy.m233, exact: true })
      .first()
      .fill('Fixture announcement')
    await page.getByRole('button', { name: copy.m244, exact: true }).click()
    await expect
      .poll(() => fixture.data.settings.announcements.items[0]?.title)
      .toBe('Fixture announcement')
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})

test('audit paging, reload, and empty state are fixture-only', async ({ browser }) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  for (let index = 0; index < 25; index++)
    fixture.data.audit.items.push({ ...fixture.data.audit.items[0]!, id: 100 + index })
  try {
    await go(page, '/admin/audit')
    await expect(page.locator('tbody tr')).toHaveCount(20)
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
    await expect(page.locator('tbody tr')).toHaveCount(8)
    await page.getByRole('button', { name: copy.m95, exact: true }).click()
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})

test('LIVE /api/me denies all remaining admin routes with zero protected requests', async ({
  browser,
  request,
}) => {
  const headers = { Authorization: 'Bearer ' + auth.accessToken }
  const before = await request.get(api + '/api/me', { headers })
  expect(before.status()).toBe(200)
  const initial = await before.json()
  expect(['admin', 'moderator']).not.toContain(initial.role)
  const context = await browser.newContext({ storageState: auth.state })
  await fixtures(context, null)
  await context.route('**/api/me', (route) => route.continue())
  const page = await context.newPage()
  const errors = errorsOf(page)
  const protectedRequests: string[] = []
  page.on('request', (observed) => {
    if (/^\/api\/admin(?:\/|$)/.test(new URL(observed.url()).pathname))
      protectedRequests.push(observed.url())
  })
  try {
    for (const path of paths) {
      await page.goto(origin + path, { waitUntil: 'networkidle' })
      await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toBeVisible()
    }
    expect(errors).toEqual([])
    expect(protectedRequests).toEqual([])
  } finally {
    await context.close()
  }
  const after = await request.get(api + '/api/me', { headers })
  expect((await after.json()).role).toBe(initial.role)
  console.log(
    'LIVE /api/me 200; non-staff role unchanged; six Phase4b routes denied; ZERO admin requests; other APIs fixture-isolated',
  )
})
