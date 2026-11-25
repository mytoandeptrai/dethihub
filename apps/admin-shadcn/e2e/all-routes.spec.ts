import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import { mapLegacyPath } from '@/config/legacy-paths'
import studentCopy from '@/i18n/messages/student-copy'
import { createOperationsFixture } from '@/modules/admin-pages/testing/operations-fixture'
import {
  communityFixtureCard,
  communityFixtureOwner,
  libraryFixtureFile,
  userPagesFixtureUsage,
} from '@/modules/community/testing/fixture'
import { studentDoc, studentExam, studentRemoteId } from '@/modules/student-exams/testing/fixture'

import editorFixture from './fixtures/editor.json'
import onlineFixture from './fixtures/online-exam.json'
import { signedInState } from './session-helper'

import type { BrowserContext } from '@playwright/test'
import type { components } from '@workspace/api-types'

const origin = process.env.PUBLIC_PAGES_ORIGIN ?? 'http://localhost:8080'
const id = studentRemoteId
const online = { ...onlineFixture, id, publishedId: id, publishedListed: false }
const remoteExam = { ...studentExam, id }
const doc = { ...studentDoc, online: remoteExam }
const primaryRoutes = [
  ['home', '/'],
  ['editor', '/soan-de'],
  ['board-alias', '/bang-ve'],
  ['slide-alias', '/soan-slide'],
  ['online-list', '/tao-de-online'],
  ['online-results', `/tao-de-online/ket-qua/${id}`],
  ['online-builder', `/tao-de-online/${id}`],
  ['play', `/de-online/${id}`],
  ['community', '/de-cong-dong'],
  ['my-docs', '/de-cua-toi'],
  ['analytics', '/de-cua-toi/phan-tich'],
  ['library', '/kho-tai-lieu'],
  ['grading', '/cham-trac-nghiem'],
  ['local-quiz', `/lam-de/${studentExam.id}`],
  ['exam-view', `/de/${id}`],
  ['login', '/dang-nhap'],
  ['register', '/dang-ky'],
  ['forgot-password', '/quen-mat-khau'],
  ['reset-password', '/dat-lai-mat-khau'],
  ['profile', '/ho-so'],
  ['uploads', '/ho-so/de-tai-len'],
  ['privacy', '/quyen-rieng-tu'],
  ['terms', '/dieu-khoan'],
  ['designs', '/preview-designs'],
  ['pricing', '/bang-gia'],
  ['admin-root', '/admin'],
  ['not-found', '/__all-routes-not-found__'],
] as const
const adminRoutes = [
  ['admin-overview', '/admin'],
  ['admin-users', '/admin/users'],
  ['admin-content', '/admin/content'],
  ['admin-bank', '/admin/bank'],
  ['admin-stats', '/admin/stats'],
  ['admin-payments', '/admin/payments'],
  ['admin-ai', '/admin/ai'],
  ['admin-audit', '/admin/audit'],
  ['admin-fallback', '/admin/__unknown-panel__'],
] as const
const legacySamples = [
  '/soan-de',
  `/tao-de-online/${id}`,
  '/de-cua-toi',
  '/admin/nguoi-dung',
  '/admin/noi-dung/reports',
  '/admin/so-lieu/weekly',
  '/admin/nap-diem',
] as const
type Capture = { name: string; route: string; width: number; file: string; videoSeconds: number }
type FixtureAttempt = Omit<components['schemas']['ExamAttemptDto'], 'className' | 'seatNo'> & {
  className: string
  seatNo: number
}
const captures: Capture[] = []
let output: string
let auth: Awaited<ReturnType<typeof signedInState>>

test.describe.configure({ mode: 'serial' })
test.beforeAll(async ({ browser }, info) => {
  output = process.env.ALL_ROUTES_ARTIFACT_DIR ?? path.join(info.project.outputDir, 'all-routes')
  await mkdir(path.join(output, 'screenshots'), { recursive: true })
  auth = await signedInState(browser, origin)
})
test.afterAll(async () => {
  if (!output) return
  await writeFile(
    path.join(output, 'screenshots', 'manifest.json'),
    JSON.stringify(captures, null, 2),
  )
  await writeFile(
    path.join(output, 'screenshots', 'manifest.md'),
    '# Full-page route and major-view screenshots\n\n' +
      '| View | Route | Width | Filename |\n|---|---|---:|---|\n' +
      captures
        .map(
          (item) =>
            `| ${item.name} | \`${item.route}\` | ${item.width} | [${item.file}](${item.file}) |`,
        )
        .join('\n') +
      '\n',
  )
})

async function isolate(context: BrowserContext) {
  const fixture = createOperationsFixture()
  const attempts: FixtureAttempt[] = []
  const unexpected: string[] = []
  const intercepted: string[] = []
  const card = {
    ...communityFixtureCard,
    id,
    title: studentExam.title,
    listed: false,
    totalPoints: 2,
    questionCount: 2,
  }
  const owner = { ...card, doc, kind: 'online', updatedAt: doc.updatedAt }
  await context.addInitScript(
    ({ editor, onlineItem, quiz }) => {
      if (localStorage.getItem('all-routes-seeded')) return
      localStorage.setItem('all-routes-seeded', '1')
      localStorage.setItem(
        'soandethi-docs',
        JSON.stringify({ state: { myDocs: [editor], myDecks: [] }, version: 0 }),
      )
      localStorage.setItem(
        'dethinhbien-online',
        JSON.stringify({ state: { items: [onlineItem] }, version: 0 }),
      )
      localStorage.setItem(
        'dethinhbien-v1',
        JSON.stringify({
          state: { myExams: [quiz], draft: null, chat: [], lastResult: null },
          version: 0,
        }),
      )
    },
    { editor: editorFixture, onlineItem: online, quiz: studentExam },
  )
  await context.route('https://i.pravatar.cc/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#e0e7ff"/></svg>',
    }),
  )
  await context.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>
    const method = request.method()
    const endpoint = url.pathname
    intercepted.push(method + ' ' + endpoint)
    let response: { status: number; json: unknown } = fixture.respond(method, url.href, body)
    if (endpoint === '/api/admin/payments' && response.json && typeof response.json === 'object') {
      const revenue = fixture.data.payments.revenue
      const slots = {
        day: { vnd: revenue.day, count: revenue.counts.day },
        week: { vnd: revenue.week, count: revenue.counts.week },
        month: { vnd: revenue.month, count: revenue.counts.month },
        all: { vnd: revenue.all, count: revenue.counts.all },
        prevDay: revenue.prev.day,
        prevWeek: revenue.prev.week,
        prevMonth: revenue.prev.month,
        months: revenue.months,
      } satisfies components['schemas']['RevenueDto']
      response = { ...response, json: { ...response.json, revenue: slots } }
    } else if (endpoint.startsWith('/api/workspace/items')) {
      const kind = url.searchParams.get('kind')
      const data = kind === 'doc' ? editorFixture : kind === 'online' ? online : null
      response = {
        status: method === 'GET' ? 200 : 204,
        json:
          method === 'GET' && data ? [{ id: data.id, kind, data, updatedAt: data.updatedAt }] : [],
      }
    } else if (endpoint === `/api/exams/${id}/play`) response = { status: 200, json: { doc } }
    else if (endpoint === `/api/exams/${id}/gate`)
      response = { status: 200, json: { listed: false, attempted: false } }
    else if (endpoint === `/api/exams/community/${id}`) response = { status: 200, json: doc }
    else if (endpoint === '/api/exams/community') response = { status: 200, json: [card] }
    else if (endpoint === '/api/exams/community/authors')
      response = { status: 200, json: [{ id: communityFixtureOwner, name: 'Cô An', avatar: null }] }
    else if (endpoint === `/api/exams/${id}/attempts` && method === 'POST') {
      attempts.push({
        id: 'all-routes-attempt',
        examId: id,
        userId: null,
        deviceId: null,
        studentName: String(body.name),
        className: String(body.className ?? ''),
        seatNo: Number(body.seat ?? 1),
        score: 2,
        maxScore: 2,
        durationSeconds: Number(body.seconds ?? 0),
        createdAt: new Date().toISOString(),
      })
      response = {
        status: 200,
        json: {
          score: 2,
          max: 2,
          key: { 'question-one': 'A', 'question-two': '5' },
          correct: 2,
          gradable: 2,
        },
      }
    } else if (endpoint === '/api/me/exams/count') response = { status: 200, json: { count: 1 } }
    else if (endpoint === '/api/me/exams/attempts' || endpoint === `/api/me/exams/${id}/attempts`)
      response = { status: 200, json: { items: attempts, nextCursor: null } }
    else if (endpoint === '/api/me/exams')
      response = {
        status: method === 'POST' ? 201 : 200,
        json: method === 'POST' ? owner : [owner],
      }
    else if (endpoint === `/api/me/exams/${id}`) response = { status: 200, json: owner }
    else if (endpoint === '/api/storage/usage')
      response = { status: 200, json: userPagesFixtureUsage }
    else if (endpoint === '/api/storage/documents')
      response = { status: 200, json: [libraryFixtureFile] }
    else if (endpoint === '/api/ai/credits/events')
      response = {
        status: 200,
        json: [{ id: 1, kind: 'welcome', tokens: 120_000, createdAt: doc.createdAt }],
      }
    else if (endpoint === '/api/billing/pricing')
      response = { status: 200, json: fixture.data.settings.pricing }
    else if (endpoint === '/api/billing/first-bonus')
      response = { status: 200, json: { bonused: [] } }
    if (response.status >= 400) unexpected.push(method + ' ' + endpoint + ': ' + response.status)
    const headers = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    }
    await route.fulfill(
      response.status === 204
        ? { status: 204, headers }
        : { status: response.status, json: response.json, headers },
    )
  })
  return { attempts, unexpected, intercepted }
}

;[1440, 390].forEach((width) => {
  test(`all 27 primary routes + 9 admin routes and legacy samples at ${width}`, async ({
    browser,
  }) => {
    test.setTimeout(900_000)
    expect(primaryRoutes).toHaveLength(27)
    expect(adminRoutes).toHaveLength(9)
    const context = await browser.newContext({
      storageState: auth.state,
      viewport: { width, height: 900 },
      serviceWorkers: 'block',
      recordVideo:
        width === 1440
          ? { dir: path.join(output, 'raw-video'), size: { width: 1440, height: 900 } }
          : undefined,
    })
    const fixture = await isolate(context)
    const page = await context.newPage()
    const video = page.video()
    const started = Date.now()
    const errors: string[] = []
    page.setDefaultTimeout(15_000)
    page.on('pageerror', (error) => errors.push(error.message))
    async function capture(name: string) {
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(width === 1440 ? 700 : 100)
      const number = captures.filter((item) => item.width === width).length + 1
      const file = `${String(number).padStart(3, '0')}-${name}-${width}.png`
      await page.screenshot({
        path: path.join(output, 'screenshots', file),
        fullPage: true,
        animations: 'disabled',
      })
      captures.push({
        name,
        route: new URL(page.url()).pathname + new URL(page.url()).search,
        width,
        file,
        videoSeconds: (Date.now() - started) / 1000,
      })
      expect(errors, name + ' page errors').toEqual([])
      console.log(`CAPTURE ${width} ${name} ${new URL(page.url()).pathname}`)
    }
    async function go(target: string, name: string, status = 200) {
      const response = await page.goto(origin + target, { waitUntil: 'networkidle' })
      expect(response?.status(), target).toBe(status)
      expect(new URL(page.url()).pathname).toBe(new URL(origin + mapLegacyPath(target)).pathname)
      const body = page.locator('main').first()
      await expect
        .poll(async () => (await body.innerText()).trim().length, {
          message: target + ' must not be blank',
        })
        .toBeGreaterThan(25)
      const notFound = page.getByText('ĐỀ KIỂM TRA · Mã đề 404', { exact: true })
      await (status === 404 ? expect(notFound).toBeVisible() : expect(notFound).toHaveCount(0))
      await expect(body).not.toContainText('Nội dung đang được chuyển sang')
      await capture(name)
    }
    async function closeDialogs() {
      await page.keyboard.press('Escape')
      await expect(page.locator('[role="dialog"]')).toHaveCount(0)
    }
    async function editorViews() {
      await page.getByText(editorFixture.title, { exact: true }).click()
      await expect(page.locator('.ProseMirror')).toBeVisible()
      await capture('editor-exam')
      for (const [index, label] of ['Trang chủ', 'Chèn', 'Bố cục'].entries()) {
        if (width >= 1024) {
          const tab = page.getByRole('tab', { name: label, exact: true })
          await tab.click()
          await expect(tab).toHaveAttribute('aria-selected', 'true')
          await expect(page.locator('.ribbon-body')).toBeVisible()
          await capture('editor-panel-' + index)
        } else {
          await page.getByRole('button', { name: 'Tất cả công cụ', exact: true }).click()
          const sheet = page.getByRole('dialog', { name: 'Công cụ soạn đề', exact: true })
          await expect(sheet).toBeVisible()
          const tab = sheet.getByRole('button', {
            name: index === 0 ? 'Định dạng' : label,
            exact: true,
          })
          await tab.click()
          await expect(tab).toHaveAttribute('aria-pressed', 'true')
          await expect(sheet.locator('.ribbon-phone-sheet-body')).toBeVisible()
          await capture('editor-panel-' + index)
          await sheet.getByRole('button', { name: 'Đóng', exact: true }).click()
          await expect(sheet).not.toBeVisible()
        }
      }
      if (width < 1024)
        await page.getByRole('button', { name: 'Mục lục, Khối mẫu & Công cụ', exact: true }).click()
      const navigation =
        width >= 1024
          ? page.getByRole('navigation', { name: 'Bảng điều hướng', exact: true })
          : page.getByRole('dialog', {
              name: 'Mục lục, Khối mẫu, Công cụ và Thuộc tính',
              exact: true,
            })
      await navigation.getByRole('button', { name: 'Mục lục', exact: true }).click()
      await expect(page.locator('.nav-body')).toBeVisible()
      await capture('editor-panel-3')
      if (width < 1024) {
        await navigation.getByRole('button', { name: 'Đóng', exact: true }).click()
        await expect(navigation).not.toBeVisible()
      }
      await page.keyboard.press('Control+k')
      await expect(page.getByRole('dialog', { name: 'Lệnh soạn đề' })).toBeVisible()
      await capture('editor-command-palette')
      await closeDialogs()
      await page.locator('.ProseMirror').press('Control+End')
      await page.keyboard.type('/')
      await expect(page.getByRole('listbox', { name: 'Chèn nhanh' })).toBeVisible()
      await capture('editor-slash-menu')
      await page.keyboard.press('Escape')
      await page.keyboard.press('Backspace')
      await page.getByRole('button', { name: 'Tạo tài liệu mới', exact: true }).click()
      await page.getByRole('menuitem', { name: /Slide/ }).click()
      await expect(page.locator('.slide-stage .slide-frame')).toBeVisible()
      await capture('editor-slide')
      await page.getByRole('button', { name: 'Tạo tài liệu mới', exact: true }).click()
      await page.getByRole('menuitem', { name: /Bảng vẽ/ }).click()
      const canvas = page.locator('canvas').first()
      await expect(canvas).toBeVisible()
      const box = await canvas.boundingBox()
      if (!box) throw new Error('Board canvas has no bounds')
      await page.keyboard.press('p')
      await page.mouse.move(box.x + 40, box.y + 70)
      await page.mouse.down()
      await page.mouse.move(box.x + Math.min(220, box.width - 20), box.y + 160, { steps: 12 })
      await page.mouse.up()
      await capture('editor-board')
    }
    async function studentFlow() {
      await page.getByLabel(studentCopy.m292).fill('Học sinh minh họa')
      await page.getByLabel(studentCopy.m144, { exact: true }).fill('10A1')
      await page.getByLabel(studentCopy.m296, { exact: true }).fill('1')
      await capture('student-form')
      await page.getByRole('button', { name: studentCopy.m298, exact: true }).click()
      await expect(page).toHaveURL(/\/quiz\//)
      await page.getByRole('button', { name: /^A\s+2$/ }).click()
      await capture('remote-quiz')
      await page
        .getByRole('button', { name: /Câu tiếp|Tiếp/ })
        .last()
        .click()
      await page.getByRole('textbox').fill('5')
      await page
        .getByRole('button', { name: /Nộp bài/ })
        .first()
        .click()
      await expect(page.getByText(studentCopy.m330, { exact: true })).toBeVisible()
      await capture('quiz-submit-confirm')
      await page.getByRole('button', { name: studentCopy.m336, exact: true }).click()
      await expect.poll(() => fixture.attempts.length).toBe(1)
      await expect(page.getByRole('button', { name: studentCopy.m346, exact: true })).toBeVisible()
      await capture('quiz-result')
      await page.getByRole('button', { name: studentCopy.m346, exact: true }).click()
      await expect(page.getByRole('button', { name: studentCopy.m345, exact: true })).toBeVisible()
      await capture('quiz-review')
      await go(`/online-exams/${id}/results`, 'owner-results-after-attempt')
      await expect(page.getByRole('cell', { name: 'Học sinh minh họa', exact: true })).toBeVisible()
    }
    try {
      for (const [name, source] of primaryRoutes) {
        await go(mapLegacyPath(source), name, name === 'not-found' ? 404 : 200)
        if (name === 'editor') await editorViews()
        if (name === 'online-list') await go('/online-exams?tab=published', 'online-published')
        if (name === 'online-builder') {
          await expect(
            page.getByRole('heading', { name: online.meta.title, exact: true }),
          ).toBeVisible()
          await page.getByRole('button', { name: 'Xem bản đề', exact: true }).click()
          await expect(page.locator('.katex').first()).toBeVisible()
          await capture('online-preview')
          await page.getByRole('button', { name: 'Đóng bản xem thử', exact: true }).click()
          await page.getByRole('button', { name: 'Tiếp: Thiết lập đề', exact: true }).click()
          await capture('online-settings')
        }
        if (name === 'play') await studentFlow()
        if (name === 'exam-view') {
          await page.getByRole('button', { name: /Lưu/ }).first().click()
          await expect(page.getByRole('menu')).toBeVisible()
          await capture('exam-save-menu')
          await page.keyboard.press('Escape')
        }
      }
      for (const [name, target] of adminRoutes) {
        await go(target, name)
        if (name === 'admin-users') {
          await page.getByText('giaovien7@example.com', { exact: true }).click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await capture('admin-user-drawer')
          await closeDialogs()
        }
        if (name === 'admin-content') {
          for (const label of ['Phản ánh về đề', 'Tệp thành viên', 'Phản hồi']) {
            await page.getByRole('radio', { name: label, exact: true }).click()
            await expect(page.locator('main')).not.toContainText('Đang tải…')
            await capture(
              'admin-content-' + ['Phản ánh về đề', 'Tệp thành viên', 'Phản hồi'].indexOf(label),
            )
          }
        }
        if (name === 'admin-bank') {
          await page.getByRole('button', { name: 'Thêm câu hỏi', exact: true }).click()
          await expect(
            page.getByRole('button', { name: 'Vẽ bằng công cụ', exact: true }),
          ).toBeVisible()
          await capture('admin-bank-create')
          await page.getByRole('radio', { name: 'Từ AI hoặc tệp', exact: true }).click()
          await capture('admin-bank-import')
          await closeDialogs()
        }
        if (name === 'admin-stats') {
          await page
            .getByRole('button')
            .filter({ has: page.locator('svg.lucide-radio') })
            .click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await capture('admin-online-users')
          await closeDialogs()
          await go('/admin/stats/weekly', 'admin-nested-stats')
        }
        if (name === 'admin-payments') {
          await page.getByText('giaovien2@example.com', { exact: true }).click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await capture('admin-payment-drawer')
          await page.getByRole('button', { name: 'Cộng điểm thủ công', exact: true }).click()
          await expect(page.getByRole('dialog').last().getByRole('textbox')).toBeVisible()
          await capture('admin-credit-prompt')
          await page.keyboard.press('Escape')
          await expect(page.locator('[role="dialog"]')).toHaveCount(1)
          await closeDialogs()
          await page.getByRole('radio', { name: 'Bảng giá', exact: true }).click()
          await expect(
            page.getByRole('heading', { name: 'Thiết lập giá điểm', exact: true }),
          ).toBeVisible()
          await capture('admin-pricing')
        }
        if (name === 'admin-ai') {
          await page.getByRole('button', { name: 'Xem cấu hình opencode', exact: true }).click()
          await expect(page.getByRole('dialog').getByLabel('Model', { exact: true })).toBeVisible()
          await capture('admin-provider')
          await closeDialogs()
          await page.getByRole('button', { name: 'Xem cấu hình Supabase', exact: true }).click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await capture('admin-service-health')
          await closeDialogs()
          await page.getByRole('radio', { name: 'Thông báo', exact: true }).click()
          await capture('admin-announcements')
          await page.getByRole('button', { name: 'Xem trước', exact: true }).click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await capture('admin-announcement-preview')
          await closeDialogs()
        }
      }
      for (const [index, source] of legacySamples.entries()) {
        const response = await context.request.get(origin + source, { maxRedirects: 0 })
        expect(response.status()).toBe(308)
        expect(new URL(response.headers().location!, origin).pathname).toBe(mapLegacyPath(source))
        await go(source, 'legacy-' + index)
      }
      expect(fixture.unexpected, 'all API traffic must have a successful fixture response').toEqual(
        [],
      )
      expect(fixture.intercepted.some((endpoint) => endpoint.includes('/api/admin/'))).toBe(true)
      expect(errors).toEqual([])
      console.log(
        `ALL ROUTES ${width}: 27 primary + 9 admin + ${legacySamples.length} legacy redirects; no blank/incorrect 404/page errors; all application APIs fixture-isolated`,
      )
    } finally {
      await context.close()
      if (video) {
        await video.saveAs(path.join(output, 'walkthrough.webm'))
        await video.delete()
      }
    }
  })
})
