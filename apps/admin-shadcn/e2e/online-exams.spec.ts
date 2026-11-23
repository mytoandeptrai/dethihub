import { expect, test } from '@playwright/test'

import fixture from './fixtures/online-exam.json'
import { signedInState } from './session-helper'

import type { APIRequestContext, Page } from '@playwright/test'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const api = process.env.E2E_API_ORIGIN ?? 'http://localhost:3000'
const missingId = '11111111-1111-4111-8111-111111111111'
function errorsOf(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).pathname.startsWith('/api/'))
      console.log(
        `HTTP error: ${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`,
      )
  })
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}
async function content(page: Page, route: string) {
  const response = await page.goto(origin + route, { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('main').first()).toBeVisible()
  await expect
    .poll(async () => (await page.locator('main').first().innerText()).trim().length)
    .toBeGreaterThan(20)
  await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toHaveCount(0)
}
async function seed(page: Page) {
  await page.addInitScript((item) => {
    if (localStorage.getItem('phase3c-example-ready')) return
    localStorage.setItem('phase3c-example-ready', '1')
    localStorage.setItem(
      'dethinhbien-online',
      JSON.stringify({ state: { items: [item] }, version: 0 }),
    )
  }, fixture)
}
async function cleanup(
  request: APIRequestContext,
  headers: Record<string, string>,
  ids: string[],
  published: string[] = [],
) {
  for (const id of published) {
    const response = await request.delete(api + '/api/me/exams/' + encodeURIComponent(id), {
      headers,
    })
    expect([204, 404]).toContain(response.status())
  }
  for (const id of ids) {
    const response = await request.delete(
      api + '/api/workspace/items/online?ids=' + encodeURIComponent(id),
      { headers },
    )
    expect(response.ok()).toBe(true)
  }
  const rows = await request.get(api + '/api/workspace/items?kind=online', { headers })
  expect(rows.status()).toBe(200)
  expect(((await rows.json()) as { id: string }[]).filter((row) => ids.includes(row.id))).toEqual(
    [],
  )
  console.log(`CLEANUP online: ${ids.length} targeted local draft(s) absent from remote workspace`)
}

for (const width of [1440, 390]) {
  test.describe(`online exams signed out at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })
    for (const route of [
      '/online-exams',
      '/online-exams?tab=published',
      '/online-exams/' + fixture.id,
      `/online-exams/${missingId}/results`,
    ]) {
      test(route, async ({ page }) => {
        const errors = errorsOf(page)
        await seed(page)
        await content(page, route)
        if (route.endsWith(fixture.id))
          await expect(page.getByRole('heading', { name: fixture.meta.title })).toBeVisible()
        expect(errors).toEqual([])
      })
    }
  })
}

test('online builder previews math, validates metadata, imports, manages AI attachments and opens drawing tools', async ({
  page,
}) => {
  test.setTimeout(90_000)
  const errors = errorsOf(page)
  await seed(page)
  await content(page, '/online-exams/' + fixture.id)
  await page.getByRole('button', { name: 'Xem bản đề', exact: true }).click()
  await expect(page.locator('.katex').first()).toBeVisible()
  await page.getByRole('button', { name: 'Đóng bản xem thử', exact: true }).click()
  const attachmentChooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Thêm tệp nguồn', exact: true }).click()
  await (
    await attachmentChooser
  ).setFiles({
    name: 'nguon.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Bài giảng: hàm số bậc hai.'),
  })
  await page.getByRole('button', { name: 'Xem 1 file đính kèm', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tệp nguồn cho AI' })).toBeVisible()
  await expect(page.getByText('nguon.txt', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Đóng', exact: true }).last().click()
  await page.getByRole('button', { name: 'Gỡ các tệp đã chọn', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Xem 1 file đính kèm', exact: true })).toHaveCount(
    0,
  )
  await page.getByRole('button', { name: 'Vẽ bằng công cụ', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Chọn công cụ vẽ' })).toBeVisible()
  await page.getByRole('button', { name: /Đồ thị hàm số/ }).click()
  await expect(page.getByRole('dialog').last()).toBeVisible()
  await page.getByRole('button', { name: 'Đóng', exact: true }).last().click()
  await page.getByRole('button', { name: 'Đóng', exact: true }).last().click()
  const importChooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Nhập đề từ tệp', exact: true }).click()
  await (
    await importChooser
  ).setFiles({
    name: 'hong.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Không có câu hỏi ở đây.'),
  })
  await expect(page.locator('main').getByRole('alert')).toContainText('Không thấy câu hỏi nào')
  await page.getByRole('button', { name: 'Tiếp: Thiết lập đề', exact: true }).click()
  await page.getByPlaceholder('Kiểm tra cuối kỳ — Toán 10').fill(' ')
  await page.getByRole('button', { name: 'Hoàn tất đề', exact: true }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText('đặt tên')
  expect(errors).toEqual([])
})

test.describe('online exams signed in', () => {
  test.skip(!process.env.E2E_ACCOUNT_FILE, 'Requires the existing private test account')
  let state: string
  let accessToken: string
  test.beforeAll(async ({ browser }) => {
    ;({ state, accessToken } = await signedInState(browser, origin))
  })

  ;[1440, 390].forEach((width) => {
    test(`signed-in list, builder, published subview and empty results at ${width}px`, async ({
      browser,
      request,
    }) => {
      test.setTimeout(60_000)
      const headers = { Authorization: `Bearer ${accessToken}` }
      const context = await browser.newContext({
        storageState: state,
        viewport: { width, height: 900 },
      })
      const page = await context.newPage()
      const errors = errorsOf(page)
      let localId: string | undefined
      try {
        await content(page, '/online-exams')
        await page.getByRole('button', { name: 'Soạn đề online', exact: true }).first().click()
        await expect(page).toHaveURL(/\/online-exams\/[^/?]+$/)
        localId = new URL(page.url()).pathname.split('/').at(-1)!
        await expect(
          page.getByRole('heading', { name: 'Đề chưa đặt tên', exact: true }),
        ).toBeVisible()
        await content(page, '/online-exams?tab=published')
        await content(page, `/online-exams/${missingId}/results`)
        expect(errors).toEqual([])
      } finally {
        await context.close()
        await cleanup(request, headers, localId ? [localId] : [])
      }
    })
  })

  test('LIVE create, publish unlisted, toggle listing, view results and unpublish with cleanup', async ({
    browser,
    request,
  }) => {
    test.setTimeout(120_000)
    const headers = { Authorization: `Bearer ${accessToken}` }
    const context = await browser.newContext({
      storageState: state,
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    const errors = errorsOf(page)
    const title = `E2E online ${Date.now()}`
    let localId: string | undefined
    let publishedId: string | undefined
    try {
      await content(page, '/online-exams')
      await page.getByRole('button', { name: 'Soạn đề online', exact: true }).first().click()
      await expect(page).toHaveURL(/\/online-exams\/[^/?]+$/)
      localId = new URL(page.url()).pathname.split('/').at(-1)!
      await page.getByRole('button', { name: 'Trắc nghiệm', exact: true }).first().click()
      await page.getByPlaceholder('Gõ câu hỏi…').fill('Một cộng một bằng bao nhiêu?')
      for (const key of ['A', 'B', 'C', 'D'])
        await page
          .getByRole('textbox', { name: `Phương án ${key}`, exact: true })
          .fill(key === 'A' ? '2' : key === 'B' ? '3' : key === 'C' ? '4' : '5')
      await page.getByRole('button', { name: 'Chọn A là đáp án đúng', exact: true }).click()
      await page.getByRole('button', { name: 'Tiếp: Thiết lập đề', exact: true }).click()
      await page.getByPlaceholder('Kiểm tra cuối kỳ — Toán 10').fill(title)
      await page.getByRole('button', { name: 'Hoàn tất đề', exact: true }).click()
      const publishResponse = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/me/exams',
      )
      await page.getByRole('button', { name: 'Tạo đường dẫn làm bài', exact: true }).click()
      const published = await publishResponse
      expect(published.ok()).toBe(true)
      const row = (await published.json()) as { id: string; listed: boolean }
      publishedId = row.id
      expect(row.listed).toBe(false)
      await expect(
        page.getByRole('textbox', { name: 'Đường dẫn làm bài', exact: true }),
      ).toHaveValue(origin + '/play/' + row.id)
      console.log(`LIVE publish: HTTP ${published.status()}, listed=false`)
      await content(page, '/online-exams?tab=published')
      const card = page.locator('article').filter({ hasText: title })
      await expect(card).toBeVisible()
      const visible = page.waitForResponse(
        (response) => response.request().method() === 'PATCH' && response.url().endsWith('/listed'),
      )
      await card.getByRole('button', { name: 'Chia sẻ trong cộng đồng', exact: true }).click()
      expect((await visible).ok()).toBe(true)
      await expect(
        card.getByRole('button', {
          name: 'Bỏ chia sẻ cộng đồng, giữ đường dẫn làm bài',
          exact: true,
        }),
      ).toBeVisible()
      const hidden = page.waitForResponse(
        (response) => response.request().method() === 'PATCH' && response.url().endsWith('/listed'),
      )
      await card
        .getByRole('button', { name: 'Bỏ chia sẻ cộng đồng, giữ đường dẫn làm bài', exact: true })
        .click()
      expect((await hidden).ok()).toBe(true)
      await expect(
        card.getByRole('button', { name: 'Chia sẻ trong cộng đồng', exact: true }),
      ).toBeVisible()
      await card.getByRole('button', { name: 'Chia sẻ trong cộng đồng', exact: true }).click()
      await expect(
        card.getByRole('button', {
          name: 'Bỏ chia sẻ cộng đồng, giữ đường dẫn làm bài',
          exact: true,
        }),
      ).toBeVisible()
      const audit = await request.get(api + '/api/me/exams', { headers })
      expect(
        ((await audit.json()) as { id: string; listed: boolean }[]).find(
          (item) => item.id === row.id,
        )?.listed,
      ).toBe(true)
      console.log('LIVE listed: off → on → off → on, authenticated GET confirmed listed=true')
      await content(page, `/online-exams/${row.id}/results`)
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
      await expect(page.getByText('Chưa nhận bài nộp', { exact: true })).toBeVisible()
      console.log('LIVE results: owner page and empty-attempt state visible')
      expect(errors).toEqual([])
      await content(page, '/online-exams?tab=published')
      await page
        .locator('article')
        .filter({ hasText: title })
        .getByRole('button', { name: 'Thu hồi đề', exact: true })
        .click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Thu hồi đề', exact: true })
        .click()
      await expect(page.locator('article').filter({ hasText: title })).toHaveCount(0)
      const remaining = await request.get(api + '/api/me/exams', { headers })
      expect(
        ((await remaining.json()) as { id: string }[]).some((item) => item.id === row.id),
      ).toBe(false)
      publishedId = undefined
      console.log('LIVE unpublish: authenticated GET confirmed server exam absent')
      await content(page, '/online-exams')
      await page
        .locator('article')
        .filter({ hasText: title })
        .getByRole('button', { name: 'Xóa đề', exact: true })
        .click()
      await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click()
      await expect(page.locator('article').filter({ hasText: title })).toHaveCount(0)
      expect(errors).toEqual([])
    } finally {
      await context.close()
      await cleanup(request, headers, localId ? [localId] : [], publishedId ? [publishedId] : [])
    }
  })
})
