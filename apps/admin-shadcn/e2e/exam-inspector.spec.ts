import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test as base } from '@playwright/test'

import fixture from './fixtures/editor.json'
import { signedInState } from './session-helper'

const origin = process.env.EDITOR_URL ?? 'http://localhost:8080/editor'
const test = base.extend<{ inspectorAuth: Awaited<ReturnType<typeof signedInState>> }>({
  inspectorAuth: async ({ browser }, provide) => {
    await provide(await signedInState(browser, new URL(origin).origin))
  },
  storageState: async ({ inspectorAuth }, provide) => {
    await provide(inspectorAuth.state)
  },
})

test.use({
  viewport: { width: 1440, height: 1000 },
  video: { mode: 'on', size: { width: 1440, height: 1000 } },
  screenshot: 'on',
  trace: 'off',
})

for (const insertion of ['click', 'drag-drop'] as const) {
  test(`header inspector synchronizes form and canvas after ${insertion} insertion`, async ({ page, inspectorAuth }, info) => {
    test.setTimeout(90_000)
    page.setDefaultTimeout(15_000)
    const output = process.env.INSPECTOR_ARTIFACT_DIR ?? info.outputDir
    await mkdir(output, { recursive: true })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/api/**', (route) => {
      const pathname = new URL(route.request().url()).pathname
      if (pathname.startsWith('/api/ai/chat')) throw new Error('Inspector E2E must not call AI')
      return route.fulfill({
        json: pathname === '/api/me' ? { userId: inspectorAuth.user.id, role: 'user' }
          : pathname === '/api/site/status' ? { maintenance: false }
            : pathname === '/api/ai/quota' ? { used: 0, limit: 0, credits: 0 } : [],
      })
    })
    const doc = { ...fixture, id: `inspector-${insertion}`, title: `Thuộc tính E2E — ${insertion}`, blocks: [] }
    await page.addInitScript((document) => {
      localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [document], myDecks: [] }, version: 0 }))
    }, doc)
    await page.goto(origin, { timeout: 60_000 })
    await page.getByText(doc.title, { exact: true }).click()
    await expect(page.locator('.ProseMirror')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const collapseAi = page.getByRole('button', { name: 'Thu gọn trợ lý AI', exact: true })
    if (await collapseAi.isVisible()) await collapseAi.click()
    const zoomOut = page.getByRole('button', { name: 'Thu nhỏ', exact: true })
    while (!await zoomOut.isDisabled()) await zoomOut.click()
    for (let index = 0; index < 5; index++) await page.getByRole('button', { name: 'Phóng to', exact: true }).click()
    await expect(page.locator('.status-right')).toContainText('100%')
    const papers = page.locator('.doc-paper')
    await expect(papers).toHaveCount(1)
    const before = await papers.count()
    await page.getByRole('navigation', { name: 'Bảng điều hướng' }).getByRole('button', { name: 'Khối mẫu', exact: true }).click()
    const source = page.getByRole('button', { name: /Đầu đề hai cột/ })
    if (insertion === 'click') await source.click()
    else {
      await expect(source).toHaveAttribute('draggable', 'true')
      const target = page.locator('.ProseMirror p').first()
      const box = await target.boundingBox()
      if (!box) throw new Error('Canvas drop target has no bounding box')
      await source.dragTo(target, { targetPosition: { x: box.width - 12, y: 8 } })
    }
    const header = page.locator('.ProseMirror [data-exam-node="examHeader"]')
    await expect(header).toHaveCount(1)
    await expect(page.getByTestId('inspector-tab')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('inspector-item-header')).toHaveAttribute('data-inspector-active', 'true')
    const department = page.getByLabel('Sở giáo dục', { exact: true })
    const duration = page.getByLabel('Thời gian (phút)', { exact: true })
    await expect(department).toBeVisible()
    await expect(duration).toBeVisible()
    await page.screenshot({ path: path.join(output, `${insertion}-inserted.png`), animations: 'disabled' })

    await department.fill('SỞ GD&ĐT HÀ NỘI')
    await duration.fill('90')
    await expect(header).toContainText('SỞ GD&ĐT HÀ NỘI')
    await expect(header).toContainText('90 phút')
    await page.screenshot({ path: path.join(output, `${insertion}-form-to-canvas.png`), animations: 'disabled' })

    const school = header.locator('p').filter({ hasText: 'TRƯỜNG THPT' }).first()
    await school.click()
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+End')
    await page.keyboard.insertText('TRƯỜNG THPT CHU VĂN AN')
    await expect(school).toHaveText('TRƯỜNG THPT CHU VĂN AN')
    await expect(page.getByLabel('Tên trường', { exact: true })).toHaveValue('TRƯỜNG THPT CHU VĂN AN')
    await expect(papers).toHaveCount(before)
    await expect.poll(() => papers.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }))).toEqual([{ width: 794, height: 1123 }])
    await expect(page.locator('.status-right')).toContainText('100%')
    await page.screenshot({ path: path.join(output, `${insertion}-canvas-to-form.png`), animations: 'disabled' })
    expect(errors).toEqual([])
  })
}
