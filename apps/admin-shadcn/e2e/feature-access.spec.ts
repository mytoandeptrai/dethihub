import { expect, test } from '@playwright/test'

import fixture from './fixtures/editor.json'
import { signedInState } from './session-helper'

import type { Page } from '@playwright/test'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const features = { word: false, slide: false, board: false, online: false }
async function mockStatus(page: Page, role = 'user') {
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({ json: path === '/api/site/status' ? { features, maintenance: { on: false }, announcements: [] } : path === '/api/me' ? { userId: 'feature-user', role } : path === '/api/ai/quota' ? { credits: 100, used: 0, limit: 100 } : [] })
  })
}

test('disabled kinds hide creation, open saved documents read-only and preserve export', async ({ browser }, info) => {
  const auth = await signedInState(browser, origin)
  const context = await browser.newContext({ storageState: auth.state })
  const page = await context.newPage()
  await mockStatus(page)
  const doc = { ...fixture, id: 'readonly-document', title: 'Tài liệu chỉ xem' }
  await page.addInitScript((saved) => localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [saved], myDecks: [] }, version: 0 })), doc)
  await page.goto(`${origin}/editor`)
  await expect(page.locator('.quick-card')).toHaveCount(0)
  await page.getByText(doc.title, { exact: true }).click()
  const editor = page.locator('.ProseMirror')
  await expect(editor).toHaveAttribute('contenteditable', 'false')
  await expect(page.getByText('Quản trị viên đã tạm tắt tính năng này. Nội dung bạn đã tạo vẫn xem được.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tạo tài liệu mới', exact: true })).toHaveCount(0)
  const before = await page.evaluate(() => localStorage.getItem('soandethi-docs'))
  await editor.click()
  await page.keyboard.type('Must not edit')
  await page.keyboard.press('Control+s')
  await expect(editor).not.toContainText('Must not edit')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('soandethi-docs'))).toBe(before)
  await page.getByRole('button', { name: 'Xuất', exact: true }).click()
  await expect(page.getByRole('menuitem', { name: 'Xuất Word', exact: true })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'PDF', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.screenshot({ path: info.outputPath('readonly-word.png'), fullPage: true })
  for (const kind of ['word', 'slide', 'board']) {
    await page.goto(`${origin}/editor?new=${kind}`)
    await expect(page.getByRole('heading', { name: 'Tính năng đang tạm tắt' })).toBeVisible()
  }
  await page.goto(`${origin}/online-exams/new`)
  await expect(page.getByRole('heading', { name: 'Tính năng đang tạm tắt' })).toBeVisible()
  await page.goto(`${origin}/online-exams`)
  await expect(page.getByRole('heading', { name: 'Tính năng đang tạm tắt' })).toHaveCount(0)
  await context.close()
})

test('staff retain all creation kinds and editing with a disabled-feature banner', async ({ browser }, info) => {
  const auth = await signedInState(browser, origin)
  const context = await browser.newContext({ storageState: auth.state })
  const page = await context.newPage()
  await mockStatus(page, 'moderator')
  const doc = { ...fixture, id: 'staff-document', title: 'Tài liệu của nhân viên' }
  await page.addInitScript((saved) => localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [saved], myDecks: [] }, version: 0 })), doc)
  await page.goto(`${origin}/editor`)
  await expect(page.locator('.quick-card')).toHaveCount(3)
  await page.getByText(doc.title, { exact: true }).click()
  await expect(page.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'true')
  await expect(page.getByText('Tính năng đang tắt với người dùng', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lưu đề', exact: true })).toBeVisible()
  await page.screenshot({ path: info.outputPath('staff-word.png'), fullPage: true })
  await context.close()
})
