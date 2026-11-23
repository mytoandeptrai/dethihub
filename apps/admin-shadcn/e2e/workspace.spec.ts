import { expect, test } from '@playwright/test'

import fixture from './fixtures/editor.json'
import { signedInState } from './session-helper'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const routes = ['/my-docs', '/my-docs/analytics', '/grading']

for (const width of [1440, 390]) {
  test.describe(`workspace signed out at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })
    for (const route of routes)
      test(route, async ({ page }) => {
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
    test('dashboard filters, URL state and item dialogs', async ({ page }) => {
      await page.addInitScript((doc) => {
        if (localStorage.getItem('workspace-seeded')) return
        localStorage.setItem('workspace-seeded', '1')
        localStorage.setItem(
          'soandethi-docs',
          JSON.stringify({
            state: {
              myDocs: [
                { ...doc, id: 'workspace-draft', title: 'Đề kiểm tra thử', status: 'draft' },
                { ...doc, id: 'workspace-published', title: 'Đề đã xuất bản', status: 'published' },
              ],
              myDecks: [],
            },
            version: 0,
          }),
        )
      }, fixture)
      await page.goto(origin + '/my-docs')
      await expect(page.getByRole('combobox', { name: 'Trạng thái' })).toContainText(
        'Mọi trạng thái',
      )
      await expect(page.getByRole('tab', { name: 'Đề thi', exact: true })).toHaveAttribute(
        'data-state',
        'active',
      )
      await page.getByRole('button', { name: 'Xem danh sách', exact: true }).click()
      await expect(page).toHaveURL(/view=list/)
      await page.getByRole('textbox', { name: 'Tìm tên đề hoặc slide' }).fill('không tồn tại')
      await expect(page.getByText('Không có đề khớp bộ lọc', { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('textbox', { name: 'Tìm tên đề hoặc slide' })).toHaveValue(
        'không tồn tại',
      )
      await page
        .getByRole('region', { name: 'Lọc đề và slide' })
        .getByRole('button', { name: 'Bỏ lọc', exact: true })
        .click()
      await page.getByRole('combobox', { name: 'Trạng thái' }).click()
      await page.getByRole('option', { name: 'Đã xuất bản', exact: true }).click()
      await expect(
        page.getByRole('button', { name: 'Thao tác: Đề kiểm tra thử', exact: true }),
      ).toHaveCount(0)
      await page
        .getByRole('region', { name: 'Lọc đề và slide' })
        .getByRole('button', { name: 'Bỏ lọc', exact: true })
        .click()
      await page.getByRole('button', { name: 'Thao tác: Đề kiểm tra thử', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Chọn trạng thái', exact: true }).hover()
      await page.getByRole('menuitemradio', { name: 'Lưu trữ', exact: true }).click()
      await expect(
        page
          .locator('article')
          .filter({ has: page.getByRole('heading', { name: 'Đề kiểm tra thử', exact: true }) }),
      ).toContainText('Lưu trữ')
      await expect(page.locator('[data-slot=dropdown-menu-content]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Thao tác: Đề kiểm tra thử', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Đổi tên', exact: true }).click()
      await page.getByRole('dialog').getByRole('textbox').fill('Đề đã đổi tên')
      await page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }).click()
      await page.getByRole('button', { name: 'Thao tác: Đề đã đổi tên', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Chia sẻ', exact: true }).click()
      await expect(page.getByRole('dialog')).toContainText('/exams/workspace-draft')
      await page.getByRole('dialog').getByRole('button').click()
      await page.getByRole('button', { name: 'Thao tác: Đề đã đổi tên', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Xóa', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click()
      await expect(
        page.getByRole('button', { name: 'Thao tác: Đề đã đổi tên', exact: true }),
      ).toHaveCount(0)
      await page.getByRole('tab', { name: 'Slide bài giảng', exact: true }).click()
      await expect(page.getByText('Chưa lưu bộ slide nào', { exact: true })).toBeVisible()
    })
    test('local analytics paging and item actions', async ({ page }) => {
      await page.addInitScript(() => {
        const exams = Array.from({ length: 15 }, (_, index) => ({
          id: `analytics-${index + 1}`,
          title: `Bài kiểm tra ${index + 1}`,
          subject: 'Toán',
          grade: '9',
          school: '',
          year: '2026',
          term: '',
          durationMinutes: 45,
          interactive: true,
          sections: [],
          author: '',
          createdAt: '2026-11-22T09:00:00Z',
          views: 0,
          likes: 0,
          shared: false,
        }))
        if (!localStorage.getItem('analytics-seeded')) {
          localStorage.setItem('analytics-seeded', '1')
          localStorage.setItem(
            'dethinhbien-v1',
            JSON.stringify({ state: { myExams: exams }, version: 0 }),
          )
        }
      })
      await page.goto(origin + '/my-docs/analytics')
      await expect(page.getByRole('link', { name: 'Bài kiểm tra 1', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
      await expect(page).toHaveURL(/page=2/)
      await expect(page.getByRole('link', { name: 'Bài kiểm tra 13', exact: true })).toBeVisible()
      await page.reload()
      await page.getByRole('button', { name: 'Thao tác: Bài kiểm tra 13', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Tạo bản sao', exact: true }).click()
      await expect(page.locator('[data-slot=dropdown-menu-content]')).toHaveCount(0)
      await expect(page.locator('main')).toContainText('16 đề đang lưu trên thiết bị này.')
      await page.getByRole('button', { name: 'Thao tác: Bài kiểm tra 13', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Chia sẻ', exact: true }).click()
      const card = page
        .locator('[data-slot=card]')
        .filter({ has: page.getByRole('link', { name: 'Bài kiểm tra 13', exact: true }) })
      await expect(card).toContainText('Đang chia sẻ')
      await expect(page.locator('[data-slot=dropdown-menu-content]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Thao tác: Bài kiểm tra 13', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Xóa đề', exact: true }).click()
      await card.getByRole('button', { name: 'Xóa', exact: true }).click()
      await expect(page.getByRole('link', { name: 'Bài kiểm tra 13', exact: true })).toHaveCount(0)
    })
    test('manual grading, reset and file error', async ({ page }) => {
      await page.goto(origin + '/grading')
      await page.getByRole('button', { name: 'B', exact: true }).first().click()
      await page.getByRole('button', { name: 'Xem điểm', exact: true }).click()
      await expect(page.getByText('Chưa trả lời', { exact: true }).locator('..')).toContainText(
        '19',
      )
      await page.getByRole('button', { name: 'Xóa phiếu', exact: true }).click()
      await page.locator('input[type=file]').setInputFiles({
        name: 'invalid.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('invalid'),
      })
      await expect(page.getByText('Chọn một tệp hình ảnh.', { exact: true })).toBeVisible()
    })
  })
}

test.describe('workspace signed in', () => {
  test.skip(!process.env.E2E_ACCOUNT_FILE, 'Requires the private Supabase test account')
  const auth: { current?: Awaited<ReturnType<typeof signedInState>> } = {}
  test.beforeAll(async ({ browser }) => {
    auth.current = await signedInState(browser, origin)
  })
  test('editor save, remote reload and dashboard delete with cleanup', async ({
    browser,
    request,
  }) => {
    test.setTimeout(90_000)
    const title = `Kiểm tra đồng bộ ${Date.now()}`
    const headers = { Authorization: `Bearer ${auth.current!.accessToken}` }
    const api = process.env.API_ORIGIN ?? 'http://localhost:3000'
    const before = await request.get(api + '/api/workspace/items?kind=doc', { headers })
    expect(before.status()).toBe(200)
    const existingIds = new Set<string>(
      (await before.json()).map((item: { id: string }) => item.id),
    )
    const created = new Set<string>()
    const savedResponses: number[] = []
    const errors: string[] = []
    const editorContext = await browser.newContext({
      storageState: auth.current!.state,
      viewport: { width: 1440, height: 900 },
    })
    const editor = await editorContext.newPage()
    editor.on('pageerror', (error) => errors.push(error.message))
    editor.on('response', (response) => {
      if (response.url().includes('/api/workspace/items'))
        console.log(`Workspace ${response.request().method()}: ${response.status()}`)
      if (
        response.request().method() === 'PUT' &&
        response.url().includes('/api/workspace/items/doc/') &&
        !existingIds.has(new URL(response.url()).pathname.split('/').at(-1)!)
      )
        savedResponses.push(response.status())
    })
    editor.on('request', (req) => {
      if (
        req.method() === 'PUT' &&
        req.url().includes('/api/workspace/items/doc/') &&
        !existingIds.has(new URL(req.url()).pathname.split('/').at(-1)!)
      )
        created.add(new URL(req.url()).pathname.split('/').at(-1)!)
    })
    let dashboardContext: Awaited<ReturnType<typeof browser.newContext>> | undefined
    try {
      await editor.goto(origin + '/editor', { waitUntil: 'networkidle' })
      console.log(
        'Editor initial sync metadata:',
        await editor.evaluate(() => ({
          ownsDocs: !!localStorage.getItem('dethinhbien-sync-doc'),
          cookieCount: document.cookie.split(';').filter((value) => value.includes('auth-token'))
            .length,
        })),
      )
      await editor.getByRole('button', { name: 'Tạo tài liệu mới', exact: true }).click()
      await editor.getByRole('menuitem', { name: /^Đề thi/ }).click()
      await editor
        .locator('[data-editor-header]')
        .getByRole('button', { name: /^Đổi tên:/ })
        .click()
      await editor.getByRole('textbox', { name: 'Tên tài liệu', exact: true }).fill(title)
      await editor.getByRole('textbox', { name: 'Tên tài liệu', exact: true }).press('Enter')
      await editor.locator('.ProseMirror').click()
      await editor.keyboard.press('Control+End')
      await editor.keyboard.press('Enter')
      await editor.keyboard.type('Noi dung kiem tra dong bo Phase 3b.')
      await editor
        .locator('[data-editor-header]')
        .getByRole('button', { name: 'Lưu', exact: true })
        .click()
      await expect.poll(() => savedResponses.length, { timeout: 20_000 }).toBeGreaterThan(0)
      expect(savedResponses.every((status) => status >= 200 && status < 300)).toBe(true)
      expect(created.size).toBe(1)
      const id = [...created][0]!
      const list = await request.get(api + '/api/workspace/items?kind=doc', { headers })
      expect(list.status()).toBe(200)
      const rows = (await list.json()) as {
        id: string
        data: { title: string; blocks: unknown[] }
      }[]
      expect(rows.find((item) => item.id === id)?.data.title).toBe(title)
      expect(JSON.stringify(rows.find((item) => item.id === id)?.data.blocks)).toContain(
        'Noi dung kiem tra dong bo Phase 3b.',
      )
      await editorContext.close()
      dashboardContext = await browser.newContext({
        storageState: auth.current!.state,
        viewport: { width: 1440, height: 900 },
      })
      const dashboard = await dashboardContext.newPage()
      dashboard.on('pageerror', (error) => errors.push(error.message))
      await dashboard.goto(origin + '/my-docs')
      await expect(dashboard.getByRole('heading', { name: title, exact: true })).toBeVisible({
        timeout: 20_000,
      })
      await dashboard.reload()
      await expect(dashboard.getByRole('heading', { name: title, exact: true })).toBeVisible()
      await dashboard.getByRole('button', { name: `Thao tác: ${title}`, exact: true }).click()
      await dashboard.getByRole('menuitem', { name: 'Xóa', exact: true }).click()
      const deleted = dashboard.waitForResponse(
        (res) =>
          res.request().method() === 'DELETE' &&
          res.url().includes('/api/workspace/items/doc') &&
          res.url().includes(id),
      )
      await dashboard.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click()
      expect((await deleted).ok()).toBe(true)
      await expect(dashboard.getByRole('heading', { name: title, exact: true })).toHaveCount(0)
      expect(errors).toEqual([])
      console.log(
        'LIVE workspace: editor PUT, API GET, fresh-context dashboard reload and UI DELETE verified',
      )
    } finally {
      for (const id of created) {
        const response = await request.delete(
          api + '/api/workspace/items/doc?ids=' + encodeURIComponent(id),
          { headers },
        )
        expect(response.ok()).toBe(true)
      }
      const list = await request.get(api + '/api/workspace/items?kind=doc', { headers })
      expect(list.status()).toBe(200)
      expect(
        (await list.json()).filter((item: { id: string }) => created.has(item.id)),
      ).toHaveLength(0)
      console.log(`CLEANUP: ${created.size} test document(s) absent from remote workspace`)
      await editorContext.close()
      await dashboardContext?.close()
    }
  })
  for (const width of [1440, 390])
    test(`all migrated routes at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: auth.current!.state,
        viewport: { width, height: 900 },
      })
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      try {
        for (const route of routes) {
          const response = await page.goto(origin + route, { waitUntil: 'networkidle' })
          expect(response?.status()).toBe(200)
          expect((await page.locator('main').first().innerText()).trim().length).toBeGreaterThan(20)
          await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toHaveCount(0)
        }
        expect(errors).toEqual([])
      } finally {
        await context.close()
      }
    })
})
