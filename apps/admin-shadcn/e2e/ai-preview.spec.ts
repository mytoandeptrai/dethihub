import { expect, test } from '@playwright/test'

import { draftPreviewFixture } from '@/components/ai-document-preview.test-fixture'
import fixture from './fixtures/editor.json'
import { signedInState } from './session-helper'

import type { components } from '@workspace/api-types'

test('inserting a question leaves existing answer-key cells unchanged', async ({ browser }) => {
  const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
  const auth = await signedInState(browser, origin)
  const context = await browser.newContext({ storageState: auth.state })
  const page = await context.newPage()
  const response: components['schemas']['ChatResponseDto'] = { content: JSON.stringify({ patch: [{ id: 'k0', op: 'insertBefore', block: { type: 'question', text: '1 + 2 = ?', options: ['2', '3'] } }] }), reasoning: '', usage: null, finishReason: 'stop', quota: null, receipt: 'key-fixture' }
  await page.route('**/api/**', (route) => {
    const pathname = new URL(route.request().url()).pathname
    return route.fulfill({ json: pathname === '/api/ai/chat' ? response : pathname === '/api/me' ? { userId: auth.user.id, role: 'user' } : pathname === '/api/site/status' ? { maintenance: false } : pathname === '/api/ai/quota' ? { used: 0, limit: 100, credits: 100 } : [] })
  })
  const doc = { ...fixture, id: 'key-fixture', title: 'Kiểm tra bảng đáp án', blocks: [{ type: 'question', no: 1, text: '1 + 1 = ?', options: [{ label: 'A', text: '2' }] }, { type: 'answerKey', items: [{ no: 1, answer: 'A' }] }] }
  await page.addInitScript((document) => localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [document], myDecks: [] }, version: 0 })), doc)
  await page.goto(`${origin}/editor`)
  await page.getByText(doc.title, { exact: true }).click()
  const editor = page.locator('.ProseMirror')
  await expect(editor).toBeVisible()
  const key = editor.locator('[data-exam-node="examAnswerKey"]')
  const before = await key.locator('th, td').allTextContents()
  const open = page.getByRole('button', { name: 'Mở trợ lý AI', exact: true })
  if (await open.isVisible()) await open.click()
  await page.getByLabel('Nhập yêu cầu cho AI').fill('Thêm câu hỏi vào đầu đề Toán lớp 9')
  await page.getByLabel('Nhập yêu cầu cho AI').press('Enter')
  const preview = page.getByRole('region', { name: 'Nội dung sẽ áp dụng' })
  await expect(preview).toContainText('Bảng đáp án có thể không còn khớp với thứ tự câu hỏi.')
  await expect(preview.getByText('Đáp án đúng', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  const questions = editor.locator('[data-exam-node="examQuestion"]')
  await expect(questions).toHaveCount(2)
  await expect(questions.first()).toContainText('1 + 2 = ?')
  await expect(questions.nth(1)).toContainText('1 + 1 = ?')
  await expect(key.locator('th, td')).toHaveText(before)
  await expect(key).toContainText('1')
  await expect(key).toContainText('A')
  await context.close()
})

for (const [label, id] of [['out-of-bounds', 'k999'], ['malformed-id', 'invalid']]) test(`${label} patches keep rejection and regeneration available after Apply`, async ({ browser }) => {
  const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
  const auth = await signedInState(browser, origin)
  const context = await browser.newContext({ storageState: auth.state })
  const page = await context.newPage()
  const response: components['schemas']['ChatResponseDto'] = { content: JSON.stringify({ say: 'Đã sửa xong.', patch: [{ id, block: { type: 'paragraph', text: 'Không được chèn' } }] }), reasoning: '', usage: null, finishReason: 'stop', quota: null, receipt: 'no-op-fixture' }
  await page.route('**/api/**', (route) => {
    const pathname = new URL(route.request().url()).pathname
    return route.fulfill({ json: pathname === '/api/ai/chat' ? response : pathname === '/api/me' ? { userId: auth.user.id, role: 'user' } : pathname === '/api/site/status' ? { maintenance: false } : pathname === '/api/ai/quota' ? { used: 0, limit: 100, credits: 100 } : [] })
  })
  const doc = { ...fixture, id: 'no-op-fixture', title: 'Không có thay đổi', blocks: [] }
  await page.addInitScript((document) => localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [document], myDecks: [] }, version: 0 })), doc)
  await page.goto(`${origin}/editor`)
  await page.getByText(doc.title, { exact: true }).click()
  const editor = page.locator('.ProseMirror')
  await expect(editor).toBeVisible()
  const before = await editor.innerText()
  const open = page.getByRole('button', { name: 'Mở trợ lý AI', exact: true })
  if (await open.isVisible()) await open.click()
  await page.getByLabel('Nhập yêu cầu cho AI').fill('Sửa câu hỏi trong đề Toán lớp 9')
  await page.getByLabel('Nhập yêu cầu cho AI').press('Enter')
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Huỷ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Soạn lại', exact: true })).toBeEnabled()
  await expect(page.locator('.ai-msg-error')).toContainText('Không có thay đổi hợp lệ để áp dụng.')
  await expect(page.getByRole('region', { name: 'Nội dung sẽ áp dụng' })).toContainText('Không có thay đổi hợp lệ để áp dụng.')
  await expect(editor).toHaveText(before)
  await context.close()
})

test('document approval is a readable mini exam, not a JSON tree', async ({ browser }, testInfo) => {
  const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
  const auth = await signedInState(browser, origin)
  const context = await browser.newContext({ storageState: auth.state, viewport: { width: 1600, height: 900 } })
  const page = await context.newPage()
  const response: components['schemas']['ChatResponseDto'] = { content: JSON.stringify(draftPreviewFixture), reasoning: '', usage: null, finishReason: 'stop', quota: null, receipt: 'preview-fixture' }
  await page.route('**/api/**', (route) => {
    const pathname = new URL(route.request().url()).pathname
    return route.fulfill({ json: pathname === '/api/ai/chat' ? response : pathname === '/api/me' ? { userId: auth.user.id, role: 'user' } : pathname === '/api/site/status' ? { maintenance: false } : pathname === '/api/ai/quota' ? { used: 0, limit: 100, credits: 100 } : [] })
  })
  const doc = { ...fixture, id: 'preview-fixture', title: 'Duyệt bản nháp AI', blocks: [] }
  await page.addInitScript((document) => {
    localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [document], myDecks: [] }, version: 0 }))
  }, doc)
  await page.goto(`${origin}/editor`)
  await page.getByText(doc.title, { exact: true }).click()
  await expect(page.locator('.ProseMirror')).toBeVisible()
  const open = page.getByRole('button', { name: 'Mở trợ lý AI', exact: true })
  if (await open.isVisible()) await open.click()
  await page.getByLabel('Nhập yêu cầu cho AI').fill('Soạn đề 2 câu Toán lớp 9')
  await page.getByLabel('Nhập yêu cầu cho AI').press('Enter')
  const preview = page.getByRole('region', { name: 'Nội dung sẽ áp dụng' })
  await expect(preview).toBeVisible()
  for (const text of ['Thay toàn bộ đề', '2 câu hỏi · 5 khối khác', 'TRƯỜNG THCS ĐỀ THI HUB', 'ĐỀ ÔN TẬP TOÁN 9', 'Họ và tên:', 'Câu 1.', 'Câu 2.', 'A.', 'B.', 'C.', 'D.', 'Đường phân cách', 'Gợi ý:']) await expect(preview).toContainText(text)
  await expect(preview.locator('.katex')).toHaveCount(1)
  await expect(preview).not.toContainText(/\b(type|label|blocks|replace|left|right)\b/)
  await expect(page.getByRole('button', { name: 'Áp dụng', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Soạn lại', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Huỷ', exact: true })).toBeEnabled()
  await page.evaluate(() => document.fonts.ready)
  const approval = page.getByRole('button', { name: 'Áp dụng', exact: true }).locator('..')
  await expect(page.getByRole('button', { name: 'Áp dụng', exact: true })).toBeInViewport({ ratio: 1 })
  await expect.poll(() => approval.evaluate((row) => {
    const chat = row.closest('.ai-chat') as HTMLElement
    return Math.round(chat.getBoundingClientRect().top + chat.clientTop + chat.clientHeight - row.getBoundingClientRect().bottom)
  })).toBeLessThanOrEqual(8)
  await page.locator('.ai-panel').screenshot({ path: testInfo.outputPath('ai-scroll-fixed.png') })
  await preview.screenshot({ path: testInfo.outputPath('ai-preview-new.png') })
  await context.close()
})
