import { expect, test } from '@playwright/test'

import { createAdminFixture } from '@/modules/admin-pages/testing/admin-fixture'

import { signedInState } from './session-helper'

import type { BrowserContext, Page } from '@playwright/test'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const api = process.env.E2E_API_ORIGIN ?? 'http://localhost:3000'
const paths = ['/admin', '/admin/users', '/admin/content', '/admin/bank']
const auth = {
  state: undefined as Awaited<ReturnType<typeof signedInState>>['state'] | undefined,
  accessToken: '',
}
test.beforeAll(async ({ browser }) => {
  Object.assign(auth, await signedInState(browser, origin))
})
function errorsOf(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}
async function fixtures(context: BrowserContext) {
  const fixture = createAdminFixture()
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
    const request = route.request()
    const body = request.postDataJSON() ?? {}
    const response = fixture.respond(request.method(), request.url(), body)
    if (response.status === 204) return route.fulfill({ status: 204, headers })
    return route.fulfill({ status: response.status, json: response.json, headers })
  })
  return fixture
}
async function content(page: Page, path: string) {
  const response = await page.goto(origin + path, { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('main').first()).toBeVisible()
  await expect
    .poll(async () => (await page.locator('main').first().innerText()).trim().length)
    .toBeGreaterThan(30)
  await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toHaveCount(0)
}
for (const width of [1440, 390]) {
  test(`staff fixtures: all scoped routes at ${width}`, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: auth.state,
      viewport: { width, height: 900 },
    })
    await fixtures(context)
    const page = await context.newPage()
    const errors = errorsOf(page)
    try {
      for (const path of [...paths, '/admin/content/reports', '/admin/bank/questions'])
        await content(page, path)
      expect(errors).toEqual([])
    } finally {
      await context.close()
    }
  })
  test(`signed-out routes redirect to login at ${width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = errorsOf(page)
    try {
      for (const path of paths) {
        await page.goto(origin + path, { waitUntil: 'networkidle' })
        await expect(page).toHaveURL(/\/login\?redirectTo=/)
        await expect(page.locator('main').first()).toBeVisible()
      }
      expect(errors).toEqual([])
    } finally {
      await context.close()
    }
  })
}
test('fixture users drawer, row actions and nested credit dialog', async ({ browser }) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  try {
    await content(page, '/admin/users')
    await page.getByRole('button', { name: 'Thao tác', exact: true }).nth(1).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByText('giaovien1@example.com', { exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cộng điểm', exact: true }).click()
    await expect(page.locator('[role="dialog"]')).toHaveCount(2)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(1)
    expect(
      fixture.requests.some(
        (request) => request.method === 'POST' && request.path.includes('/credits'),
      ),
    ).toBe(false)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
test('fixture bank editor: actual drawing picker Escape closes only the upper layer', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  try {
    await content(page, '/admin/bank')
    await page.getByRole('button', { name: 'Thêm câu hỏi', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await page.getByRole('button', { name: 'Vẽ bằng công cụ', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Chọn công cụ vẽ' })).toBeVisible()
    await page.getByRole('button', { name: /Đồ thị hàm số/ }).click()
    await expect(page.getByRole('dialog')).toHaveCount(3)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(2)
    await expect(page.getByRole('dialog', { name: 'Chọn công cụ vẽ' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Vẽ bằng công cụ', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(
      fixture.requests.filter(
        (request) =>
          request.method !== 'GET' &&
          request.method !== 'OPTIONS' &&
          request.path.startsWith('/api/admin/'),
      ),
    ).toEqual([])
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
test('LIVE existing non-staff role is unchanged and denied in UI without protected API probes', async ({
  browser,
  request,
}) => {
  const headers = { Authorization: 'Bearer ' + auth.accessToken }
  const before = await request.get(api + '/api/me', { headers })
  expect(before.status()).toBe(200)
  const initial = await before.json()
  expect(['admin', 'moderator']).not.toContain(initial.role)
  const context = await browser.newContext({ storageState: auth.state })
  const page = await context.newPage()
  const errors = errorsOf(page)
  const protectedRequests: string[] = []
  page.on('request', (observed) => {
    if (observed.url().startsWith(api + '/api/admin/')) protectedRequests.push(observed.url())
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
    'LIVE role unchanged; all scoped routes denied with source-equivalent concealed forbidden state; no admin mutation sent',
  )
})
