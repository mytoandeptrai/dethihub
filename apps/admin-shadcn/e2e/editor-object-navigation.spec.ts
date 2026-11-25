import { expect, test } from '@playwright/test'

import fixture from './fixtures/editor.json'
import { signedInState } from './session-helper'

test('continue typing after an image without deleting it or adding a blank page', async ({ browser }, testInfo) => {
  const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
  const auth = await signedInState(browser, origin)
  const context = await browser.newContext({ storageState: auth.state, viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const errors: string[] = []
  let uploadUrl = '/brand/ai-static.svg'
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/api/**', (route) => {
    const pathname = new URL(route.request().url()).pathname
    return route.fulfill({ json: pathname === '/api/storage/images' ? { url: uploadUrl } : pathname === '/api/me' ? { userId: auth.user.id, role: 'user' } : pathname === '/api/site/status' ? { maintenance: false } : pathname === '/api/ai/quota' ? { used: 0, limit: 100, credits: 100 } : [] })
  })
  const doc = { ...fixture, id: 'object-navigation', title: 'Tiếp tục soạn sau ảnh', blocks: [{ type: 'paragraph', text: 'Nội dung trước ảnh' }] }
  await page.addInitScript((document) => {
    localStorage.setItem('soandethi-docs', JSON.stringify({ state: { myDocs: [document], myDecks: [] }, version: 0 }))
  }, doc)
  await page.goto(`${origin}/editor`)
  await page.getByText(doc.title, { exact: true }).click()
  const editor = page.locator('.ProseMirror')
  await expect(editor).toBeVisible()
  const ai = page.getByRole('button', { name: 'Thu gọn trợ lý AI', exact: true })
  if (await ai.isVisible()) await ai.click()
  await editor.press('Control+End')
  await page.getByRole('tab', { name: 'Chèn', exact: true }).click()
  const image = editor.locator('img[data-exam-image]')
  const insertImage = async () => {
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Hình ảnh', exact: true }).click()
    await (await chooser).setFiles({ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') })
    await expect(image).toBeVisible()
    await image.evaluate((element: HTMLImageElement) => element.decode())
  }
  const resetImage = async () => {
    await editor.press('Control+a')
    await page.keyboard.press('Backspace')
    await insertImage()
  }
  await insertImage()
  await expect(image).toBeVisible()
  await image.click()
  await expect(editor.locator('.exam-image.is-selected')).toBeVisible()
  await page.keyboard.press('Enter')
  await page.keyboard.type('Nội dung sau ảnh')
  await expect(image).toHaveCount(1)
  await expect(editor.locator('> p').last()).toHaveText('Nội dung sau ảnh')
  await expect(editor).toHaveJSProperty('textContent', 'Nội dung trước ảnhNội dung sau ảnh')

  await image.click()
  await page.keyboard.type('Ký tự an toàn')
  await expect(image).toHaveCount(1)
  await expect(editor.locator('> p').filter({ hasText: 'Ký tự an toàn' })).toBeVisible()

  await resetImage()
  const block = editor.locator('> *').filter({ has: page.locator('img[data-exam-image]') })
  const box = await image.boundingBox()
  if (!box) throw new Error('Image has no bounds')
  await page.mouse.click(box.x + box.width + 24, box.y + box.height / 2)
  await page.keyboard.type('Bên cạnh ảnh')
  await expect(editor.locator('> p').last()).toHaveText('Bên cạnh ảnh')
  await resetImage()
  const imageBox = await image.boundingBox()
  if (!imageBox) throw new Error('Image has no bounds')
  await page.mouse.click(imageBox.x + 10, imageBox.y + imageBox.height + 60)
  await page.keyboard.type('Dưới nội dung')
  await expect(editor.locator('> p').last()).toHaveText('Dưới nội dung')

  const dimensions = await block.evaluate((element) => {
    const flow = element.closest<HTMLElement>('.doc-flow')!
    const paper = flow.parentElement!.querySelector<HTMLElement>('.doc-paper')!
    const contentHeight = Number.parseFloat(paper.style.height) - Number.parseFloat(flow.style.paddingTop) - Number.parseFloat(flow.style.paddingBottom)
    const content = element.parentElement!
    const pictureElement = element.querySelector<HTMLImageElement>('img[data-exam-image]')!
    const k = content.getBoundingClientRect().width / content.offsetWidth
    const overhead = (element.getBoundingClientRect().height - pictureElement.getBoundingClientRect().height) / k
    const top = (element.getBoundingClientRect().top - content.getBoundingClientRect().top) / k
    return { contentHeight, imageHeight: contentHeight - top - overhead, imageWidth: pictureElement.getBoundingClientRect().width / k }
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.imageWidth}" height="${dimensions.imageHeight}"><rect width="100%" height="100%" fill="lightblue"/></svg>`
  uploadUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`
  await resetImage()
  await expect.poll(async () => block.evaluate((element) => {
    const content = element.parentElement!
    const k = content.getBoundingClientRect().width / content.offsetWidth
    return (element.getBoundingClientRect().bottom - content.getBoundingClientRect().top) / k
  })).toBeCloseTo(dimensions.contentHeight, 0)
  await expect(editor.locator('> p[data-typing-tail="true"]')).toHaveCount(1)
  await page.evaluate(() => new Promise<void>((resolve) => { requestAnimationFrame(() => requestAnimationFrame(() => resolve())) }))
  await expect(page.locator('.doc-paper')).toHaveCount(1)
  await expect(editor.locator('.doc-page-gap')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('editor-object-navigation.png'), fullPage: true })
  expect(errors).toEqual([])
  await context.close()
})
