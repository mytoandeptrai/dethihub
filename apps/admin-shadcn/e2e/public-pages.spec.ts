import { expect, test } from '@playwright/test'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const routes = [
  '/',
  '/pricing',
  '/privacy',
  '/terms',
  '/preview-designs',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/play/preview',
  '/quiz/preview',
  '/exams/preview',
  '/my-docs',
  '/my-docs/analytics',
  '/online-exams',
  '/library',
  '/community',
  '/grading',
]

for (const width of [1440, 390]) {
  test.describe(`public pages at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })
    for (const route of routes)
      test(route, async ({ page }) => {
        test.setTimeout(90_000)
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text())
        })
        const response = await page.goto(origin + route, { waitUntil: 'networkidle' })
        expect(response?.status()).toBe(200)
        await expect(page.locator('main').first()).toBeVisible()
        expect((await page.locator('main').first().innerText()).trim().length).toBeGreaterThan(20)
        await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toHaveCount(0)
        expect(errors).toEqual([])
      })
    test('mobile menu, persisted collapse and unique command entries', async ({ page }) => {
      await page.goto(origin + '/library')
      if (width === 1440) {
        await page.getByRole('button', { name: 'Chỉ hiện biểu tượng', exact: true }).click()
        await page.reload()
        await expect(page.locator('aside').first()).toHaveCSS('width', '64px')
        await page.keyboard.press('Control+k')
      } else {
        await page.getByRole('button', { name: 'Mở thanh điều hướng', exact: true }).first().click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
        await page.getByRole('button', { name: 'Đi đến trang (Ctrl K)', exact: true }).click()
      }
      await expect(page.getByRole('dialog')).toBeVisible()
      const values = await page
        .locator('[cmdk-item]')
        .evaluateAll((items) => items.map((item) => item.dataset.value))
      expect(new Set(values).size).toBe(values.length)
      await page.keyboard.press('Escape')
      await page.goto(origin)
      if (width === 390) {
        await page.getByRole('button', { name: 'Menu', exact: true }).click()
        await expect(
          page.getByRole('link', { name: 'Tài liệu tham khảo', exact: true }).first(),
        ).toBeVisible()
      }
    })
  })
}

test('unknown routes retain the redesigned not-found page and a real 404 status', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().includes('server responded with a status of 404')
    )
      errors.push(message.text())
  })
  const response = await page.goto(origin + '/does-not-exist', { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(404)
  await expect(page.locator('main')).toContainText('404')
  await expect(page.getByRole('link', { name: 'Về trang chủ' }).first()).toBeVisible()
  await expect(page.locator('main')).toContainText('/does-not-exist')
  expect(errors).toEqual([])
})
