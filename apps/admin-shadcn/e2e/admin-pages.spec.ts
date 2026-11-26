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
  page.setDefaultTimeout(7000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}
async function fixtures(context: BrowserContext, role: string | null = 'admin') {
  const fixture = createAdminFixture()
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
test('fixture user quota, storage, credits and ban mutations', async ({ browser }) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  try {
    await content(page, '/admin/users')
    await page.getByText('giaovien2@example.com', { exact: true }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByRole('spinbutton').first()).toBeVisible()
    await drawer.getByRole('spinbutton').first().fill('42')
    await drawer.getByRole('button', { name: 'Lưu', exact: true }).first().click()
    await expect
      .poll(() =>
        fixture.requests.some(
          (item) =>
            item.method === 'PUT' &&
            item.path.endsWith('/quota') &&
            item.body.monthlyTokens === 42_000,
        ),
      )
      .toBe(true)
    await drawer.getByRole('spinbutton').nth(1).fill('20')
    await drawer.getByRole('button', { name: 'Lưu', exact: true }).nth(1).click()
    await expect
      .poll(() =>
        fixture.requests.some(
          (item) =>
            item.method === 'PUT' &&
            item.path.includes('/storage/users/') &&
            item.body.maxBytes === 20 * 1024 * 1024,
        ),
      )
      .toBe(true)
    await drawer.getByRole('button', { name: 'Cộng điểm', exact: true }).click()
    await page.getByPlaceholder('Ví dụ: 50', { exact: true }).fill('5')
    await page.getByRole('dialog').getByRole('button', { name: 'Cộng điểm', exact: true }).click()
    await expect
      .poll(() =>
        fixture.requests.some(
          (item) => item.path.endsWith('/credits') && item.body.tokens === 5000,
        ),
      )
      .toBe(true)
    await page.getByRole('button', { name: 'Đóng', exact: true }).click()
    await page.getByRole('button', { name: 'Khóa tài khoản', exact: true }).click()
    await page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: 'Khóa tài khoản', exact: true })
      .click()
    await expect
      .poll(() =>
        fixture.requests.some((item) => item.method === 'POST' && item.path.endsWith('/ban')),
      )
      .toBe(true)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
test('fixture content tabs, moderation, reports, documents and feedback', async ({ browser }) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  try {
    await content(page, '/admin/content')
    await page.locator('tbody tr').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Gỡ đề', exact: true }).click()
    await page.getByRole('dialog').last().getByRole('textbox').fill('Fixture moderation reason')
    await page.getByRole('dialog').last().getByRole('button', { name: 'Lưu', exact: true }).click()
    await expect
      .poll(() =>
        fixture.requests.some((item) => item.method === 'PATCH' && item.body.status === 'removed'),
      )
      .toBe(true)
    await page.getByRole('button', { name: 'Đã hiểu', exact: true }).click()
    await expect(page.locator('[role="dialog"]')).toHaveCount(1)
    await expect(page.getByRole('dialog', { name: 'Xem xét đề', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('radio', { name: 'Phản ánh về đề', exact: true }).click()
    await page
      .locator('tbody')
      .getByRole('button', { name: 'Đã xử lý', exact: true })
      .first()
      .click()
    await expect
      .poll(() =>
        fixture.requests.some(
          (item) => item.path.includes('/reports/') && item.body.status === 'resolved',
        ),
      )
      .toBe(true)
    await page.getByRole('button', { name: 'Đã hiểu', exact: true }).click()
    await page.getByRole('radio', { name: 'Tệp thành viên', exact: true }).click()
    await page
      .locator('tbody')
      .getByRole('button', { name: 'Xóa tài liệu', exact: true })
      .first()
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Xóa tài liệu', exact: true })
      .click()
    await expect
      .poll(() =>
        fixture.requests.some(
          (item) => item.method === 'DELETE' && item.path.includes('/documents/'),
        ),
      )
      .toBe(true)
    await page.getByRole('button', { name: 'Đã hiểu', exact: true }).click()
    await page.getByRole('radio', { name: 'Phản hồi', exact: true }).click()
    await page
      .getByRole('button', { name: 'Đã đọc', exact: true })
      .filter({ has: page.locator('svg.lucide-check') })
      .last()
      .click()
    await expect
      .poll(() =>
        fixture.requests.some((item) => item.path.endsWith('/read') && item.body.read === true),
      )
      .toBe(true)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
test('fixture bank JSON import, validation and selected draft save', async ({ browser }) => {
  const context = await browser.newContext({ storageState: auth.state })
  const fixture = await fixtures(context)
  const page = await context.newPage()
  const errors = errorsOf(page)
  try {
    await content(page, '/admin/bank')
    await page.getByRole('button', { name: 'Thêm câu hỏi', exact: true }).click()
    await page.getByRole('radio', { name: 'Từ AI hoặc tệp', exact: true }).click()
    await page.getByLabel('Nhập JSON', { exact: true }).fill('not json')
    await page.getByRole('button', { name: 'Nhập', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
    await page
      .getByLabel('Nhập JSON', { exact: true })
      .fill(
        JSON.stringify([
          { type: 'tra-loi-ngan', prompt: 'Fixture import: 2 + 2 = ?', answer: '4' },
        ]),
      )
    await page.getByRole('button', { name: 'Nhập', exact: true }).click()
    await expect(page.getByText('Fixture import: 2 + 2 = ?', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Lưu 1 câu vào ngân hàng/ }).click()
    await expect
      .poll(() =>
        fixture.requests.some(
          (item) => item.method === 'POST' && item.path.endsWith('/bank/questions'),
        ),
      )
      .toBe(true)
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
  await fixtures(context, null)
  await context.route('**/api/me', (route) => route.continue())
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
    'LIVE /api/me 200; role unchanged; all scoped routes denied; zero admin browser requests; other API traffic fixture-isolated',
  )
})
