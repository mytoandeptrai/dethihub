import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import fixture from './fixtures/editor.json'

test.use({ viewport: { width: 1440, height: 900 } })

test('editor tools, exports, slide and board surfaces', async ({ page }, info) => {
  test.setTimeout(120_000)
  page.setDefaultTimeout(10_000)
  const output = process.env.EDITOR_ARTIFACT_DIR ?? info.outputDir
  await mkdir(output, { recursive: true })
  const errors: string[] = []
  const requests: string[] = []
  const responses: { path: string; status: number }[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', (request) => requests.push(new URL(request.url()).pathname))
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/')) responses.push({ path: url.pathname, status: response.status() })
  })
  await page.addInitScript((doc) => {
    localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [doc], myDecks: [] }, version: 0 }))
  }, fixture)
  await page.goto(process.env.EDITOR_URL ?? 'http://localhost:8080/editor', { timeout: 60_000 })
  await page.getByText(fixture.title, { exact: true }).click()
  await expect(page.locator('.doc-paper')).toHaveCount(3)
  await expect(page.locator('[data-exam-node="examQuestion"]')).toHaveCount(24)
  await page.evaluate(() => document.fonts.ready)

  for (const label of ['Văn bản', 'Chèn', 'Trang', 'Mục lục']) {
    await page.getByRole('navigation', { name: 'Công cụ soạn đề' }).getByRole('button', { name: label, exact: true }).click()
    await expect(page.locator('.exam-tool-panel')).toHaveCSS('width', '300px')
    await page.getByRole('button', { name: 'Đóng công cụ', exact: true }).click()
  }
  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Lệnh soạn đề' })
  await expect(palette).toBeVisible()
  await palette.getByRole('combobox').fill('Kho câu hỏi')
  await palette.getByText('Kho câu hỏi', { exact: true }).click()
  const bank = page.getByRole('dialog', { name: 'Kho câu hỏi' })
  await expect(bank).toBeVisible()
  await expect.poll(() => responses.find((response) => response.path === '/api/bank/overrides')?.status).toBe(200)
  await bank.getByLabel('Đóng', { exact: true }).click()

  await page.locator('.ProseMirror').press('Control+End')
  await page.keyboard.type('/')
  await expect(page.getByRole('listbox', { name: 'Chèn nhanh' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Backspace')

  await page.getByRole('button', { name: 'Xuất', exact: true }).click()
  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: 'Xuất Word', exact: true }).click()
  const download = await pendingDownload
  expect(download.suggestedFilename()).toMatch(/\.docx$/)
  await download.saveAs(path.join(output, 'exam.docx'))
  expect((await readFile(path.join(output, 'exam.docx'))).subarray(0, 2).toString()).toBe('PK')

  const pendingPopup = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Xuất', exact: true }).click()
  await page.getByRole('menuitem', { name: 'PDF', exact: true }).click()
  const preview = await pendingPopup
  await preview.waitForLoadState()
  await preview.evaluate(() => document.fonts.ready)
  const pdf = await preview.pdf({ path: path.join(output, 'exam.pdf'), preferCSSPageSize: true })
  const print = [...pdf.toString('latin1').matchAll(/\/MediaBox\s*\[([^\]]+)\]/g)].map((match) => match[1])
  expect(print.length).toBeGreaterThan(0)
  await preview.screenshot({ path: path.join(output, 'print-preview.png') })
  await preview.close()

  const aiToggle = page.getByRole('button', { name: 'Mở trợ lý AI', exact: true })
  const aiCollapse = page.getByRole('button', { name: 'Thu gọn trợ lý AI', exact: true })
  if (await aiCollapse.isVisible()) await aiCollapse.click()
  await aiToggle.click()
  await expect(page.locator('.ai-dock:not(.collapsed)')).toBeVisible()
  await page.locator('.ProseMirror').press('Control+Home')
  await page.screenshot({ path: path.join(output, 'exam-ai.png') })

  await page.getByRole('button', { name: 'Tạo tài liệu mới', exact: true }).click()
  await page.getByRole('menuitem', { name: /Slide/ }).click()
  await expect(page.locator('.slide-stage .slide-frame')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const slide = await page.locator('.slide-stage .slide-frame').evaluate((element) => {
    const box = element.getBoundingClientRect()
    return { width: box.width, height: box.height, layoutWidth: element.clientWidth, layoutHeight: element.clientHeight }
  })
  expect(slide.layoutWidth / slide.layoutHeight).toBeCloseTo(16 / 9, 2)
  await page.screenshot({ path: path.join(output, 'slide.png') })

  await page.getByRole('button', { name: 'Tạo tài liệu mới', exact: true }).click()
  await page.getByRole('menuitem', { name: /Bảng vẽ/ }).click()
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible()
  await page.keyboard.press('p')
  const before = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Board canvas has no bounding box')
  await page.mouse.move(box.x + 100, box.y + 100)
  await page.mouse.down()
  await page.mouse.move(box.x + 250, box.y + 180, { steps: 10 })
  await page.mouse.up()
  await page.evaluate(() => new Promise((resolve) => { requestAnimationFrame(() => { requestAnimationFrame(resolve) }) }))
  const board = await canvas.evaluate((element) => {
    const surface = element as HTMLCanvasElement
    return { width: surface.width, height: surface.height, clientWidth: surface.clientWidth, clientHeight: surface.clientHeight, image: surface.toDataURL() }
  })
  expect(board.image).not.toBe(before)
  const image = Buffer.from(board.image.split(',')[1] ?? '', 'base64')
  await writeFile(path.join(output, 'board-canvas.png'), image)
  await page.screenshot({ path: path.join(output, 'board.png') })
  const boardMetrics = { ...board, image: createHash('sha256').update(image).digest('hex') }

  expect(responses).toContainEqual({ path: '/api/site/status', status: 200 })
  expect(requests.filter((request) => request.startsWith('/api/workspace'))).toEqual([])
  expect(errors).toEqual([])
  const metrics = { print, slide, board: boardMetrics, errors, responses, download: download.suggestedFilename() }
  await writeFile(path.join(output, 'surfaces.json'), JSON.stringify(metrics, null, 2))
  console.log(JSON.stringify(metrics, null, 2))
})
