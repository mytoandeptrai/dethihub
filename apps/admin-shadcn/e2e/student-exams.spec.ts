import { expect, test } from '@playwright/test'

import copy from '@/i18n/messages/student-copy'
import { studentDoc, studentExam, studentRemoteId } from '@/modules/student-exams/testing/fixture'

import { signedInState } from './session-helper'

import type { Page } from '@playwright/test'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const api = process.env.E2E_API_ORIGIN ?? 'http://localhost:3000'
function errorsOf(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}
async function fixtures(page: Page) {
  await page.addInitScript((exam) => {
    if (localStorage.getItem('phase3d-ready')) return
    localStorage.setItem('phase3d-ready', '1')
    localStorage.setItem(
      'dethinhbien-v1',
      JSON.stringify({
        state: { myExams: [exam], draft: null, chat: [], lastResult: null },
        version: 0,
      }),
    )
  }, studentExam)
  await page.route('**/api/exams/*/reports', (route) => route.abort())
  await page.route(`**/api/exams/${studentRemoteId}/play`, (route) =>
    route.fulfill({ json: { doc: studentDoc } }),
  )
  await page.route(`**/api/exams/${studentRemoteId}/gate?**`, (route) =>
    route.fulfill({ json: { listed: false, attempted: false } }),
  )
  await page.route(`**/api/exams/community/${studentRemoteId}`, (route) =>
    route.fulfill({ json: studentDoc }),
  )
}
async function content(page: Page, path: string) {
  const response = await page.goto(origin + path, { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('main').first()).toBeVisible()
  await expect
    .poll(async () => (await page.locator('main').first().innerText()).trim().length)
    .toBeGreaterThan(20)
  await expect(page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })).toHaveCount(0)
}
for (const width of [1440, 390]) {
  for (const path of [
    `/play/${studentRemoteId}`,
    `/quiz/${studentExam.id}`,
    `/exams/${studentRemoteId}`,
  ]) {
    test(`signed out ${path} at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      try {
        const page = await context.newPage()
        const errors = errorsOf(page)
        await fixtures(page)
        await content(page, path)
        expect(errors).toEqual([])
      } finally {
        await context.close()
      }
    })
  }
  test(`local quiz navigator, confirmation, scoring and review at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    try {
      const page = await context.newPage()
      const errors = errorsOf(page)
      await fixtures(page)
      await content(page, `/quiz/${studentExam.id}`)
      await page.getByRole('button', { name: /^A\s+2$/ }).click()
      if (width >= 640) {
        await page.getByRole('button', { name: copy.m318, exact: true }).first().click()
        await expect(page.getByText(copy.m129, { exact: true }).last()).toBeVisible()
        await page.getByRole('button', { name: '2', exact: true }).last().click()
      } else await page.getByRole('button', { name: copy.m140, exact: true }).click()
      await page.getByRole('textbox').fill('5')
      await page
        .getByRole('button', { name: /Nộp bài/, exact: false })
        .first()
        .click()
      await expect(page.getByText(copy.m330, { exact: true })).toBeVisible()
      await page.getByRole('button', { name: copy.m336, exact: true }).click()
      await expect(page.getByRole('button', { name: copy.m346, exact: true })).toBeVisible()
      await page.getByRole('button', { name: copy.m346, exact: true }).click()
      await expect(page.getByRole('button', { name: copy.m345, exact: true })).toBeVisible()
      expect(errors).toEqual([])
    } finally {
      await context.close()
    }
  })
}

test.describe('student routes signed in', () => {
  test.skip(!process.env.E2E_ACCOUNT_FILE, 'Requires the existing private test account')
  let state: string
  let accessToken: string
  test.beforeAll(async ({ browser }) => {
    ;({ state, accessToken } = await signedInState(browser, origin))
  })
  ;[1440, 390].forEach((width) => {
    test(`signed-in play, quiz and community view at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: state,
        viewport: { width, height: 900 },
      })
      try {
        const page = await context.newPage()
        const errors = errorsOf(page)
        await fixtures(page)
        for (const path of [
          `/play/${studentRemoteId}`,
          `/quiz/${studentExam.id}`,
          `/exams/${studentRemoteId}`,
        ])
          await content(page, path)
        await page.getByRole('button', { name: /Lưu/ }).first().click()
        await expect(page.getByRole('menuitem', { name: /Tạo bản soạn online/ })).toBeVisible()
        await expect(page.getByRole('menu')).toBeInViewport({ ratio: 1 })
        expect(errors).toEqual([])
      } finally {
        await context.close()
      }
    })
  })
  test('LIVE unlisted exam, anonymous student attempt, owner results and cleanup', async ({
    browser,
    request,
  }) => {
    test.setTimeout(120_000)
    const headers = { Authorization: `Bearer ${accessToken}` }
    const title = `E2E student ${Date.now()}`
    const name = `Học sinh E2E ${Date.now()}`
    let publishedId: string | undefined
    const student = await browser.newContext({ viewport: { width: 390, height: 900 } })
    const owner = await browser.newContext({
      storageState: state,
      viewport: { width: 1440, height: 900 },
    })
    try {
      const published = await request.post(api + '/api/me/exams', {
        headers,
        data: {
          listed: false,
          doc: {
            ...studentDoc,
            title,
            online: { ...studentExam, title, settings: { noTimeLimit: true, showScore: true } },
          },
        },
      })
      expect(published.status()).toBe(201)
      const row = (await published.json()) as { id: string; listed: boolean }
      publishedId = row.id
      expect(row.listed).toBe(false)
      console.log('LIVE publish: HTTP 201, listed=false')
      const page = await student.newPage()
      const errors = errorsOf(page)
      await page.route('**/api/exams/*/reports', (route) => route.abort())
      await content(page, `/play/${publishedId}`)
      await page.getByLabel(copy.m292).fill(name)
      await page.getByLabel(copy.m144, { exact: true }).fill('10E2E')
      await page.getByLabel(copy.m296, { exact: true }).fill('17')
      await page.getByRole('button', { name: copy.m298 }).click()
      await expect(page).toHaveURL(/\/quiz\//)
      await page.getByRole('button', { name: /^A\s+2$/ }).click()
      await page
        .getByRole('button', { name: /Câu tiếp|Tiếp/ })
        .last()
        .click()
      await page.getByRole('textbox').fill('5')
      await page
        .getByRole('button', { name: /Nộp bài/ })
        .first()
        .click()
      const attemptPromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === `/api/exams/${publishedId}/attempts`,
      )
      await page.getByRole('button', { name: copy.m336, exact: true }).click()
      const attempt = await attemptPromise
      expect(attempt.status()).toBe(200)
      expect(attempt.request().headers()['authorization']).toBeUndefined()
      expect(await attempt.json()).toMatchObject({ score: 2, max: 2 })
      console.log('LIVE anonymous attempt: HTTP 200, score=2/2, no Authorization header')
      const results = await owner.newPage()
      const ownerErrors = errorsOf(results)
      await results.route('**/api/exams/*/reports', (route) => route.abort())
      await content(results, `/online-exams/${publishedId}/results`)
      await expect(results.getByRole('cell', { name, exact: true })).toBeVisible()
      await expect(results.getByText('10E2E', { exact: true })).toBeVisible()
      console.log('LIVE owner results: student name, class and attempt visible')
      expect(errors).toEqual([])
      expect(ownerErrors).toEqual([])
    } finally {
      await student.close()
      await owner.close()
      if (publishedId) {
        const removed = await request.delete(api + `/api/me/exams/${publishedId}`, { headers })
        expect([204, 404]).toContain(removed.status())
        const rows = await request.get(api + '/api/me/exams', { headers })
        expect(rows.status()).toBe(200)
        expect(
          ((await rows.json()) as { id: string }[]).some((row) => row.id === publishedId),
        ).toBe(false)
        console.log(
          'LIVE cleanup: temporary exam unpublished; authenticated owner list confirms absence',
        )
      }
    }
  })
})
