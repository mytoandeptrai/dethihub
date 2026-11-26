import { expect, test } from '@playwright/test'

import exam from '@/testing/fixtures/public-exam.json'

const canonicalOrigin = process.env.SEO_SITE_ORIGIN ?? 'https://dethihub.vercel.app'
const publicPaths = ['/', '/pricing', '/community', '/terms', '/privacy', `/exams/${exam.id}`]

for (const path of publicPaths) {
  test(`public metadata and semantics: ${path}`, async ({ page, request }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).not.toBeEmpty()
    const logo = page.locator('header img[src="/brand/logo-de-ro.svg"]')
    await expect(logo).toHaveAttribute('loading', 'eager')
    await expect(logo).toHaveAttribute('fetchpriority', 'high')
    await expect(page.locator('link[rel="preload"][as="font"][href^="/fonts/"]')).toHaveCount(6)
    expect(new URL((await page.locator('link[rel="canonical"]').getAttribute('href'))!).href).toBe(
      new URL(path, canonicalOrigin).href,
    )
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description?.length).toBeGreaterThan(40)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      description!,
    )
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    )
    for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
      const image = await page.locator(selector).first().getAttribute('content')
      const imageResponse = await request.get(new URL(image!).pathname)
      expect(imageResponse.status()).toBe(200)
      expect(imageResponse.headers()['content-type']).toContain('image/png')
    }
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      await page.title(),
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
    const structured = await page.locator('script[type="application/ld+json"]').allTextContents()
    const schemas = structured.map((value) => JSON.parse(value))
    if (path === '/')
      expect(schemas.map((schema) => schema['@type'])).toEqual(
        expect.arrayContaining(['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage']),
      )
    if (path === '/pricing')
      expect(schemas.some((schema) => schema['@type'] === 'OfferCatalog')).toBe(true)
    if (path === '/community') {
      expect(
        schemas.find((schema) => schema['@type'] === 'CollectionPage').mainEntity.numberOfItems,
      ).toBe(1)
      await expect(page.locator('article').first()).toHaveCSS('animation-name', 'none')
    }
    if (path.startsWith('/exams/')) {
      await expect(page.locator('.ProseMirror')).toBeVisible()
      await expect(page.getByRole('textbox', { name: 'Nội dung đề thi' })).toHaveAttribute(
        'aria-readonly',
        'true',
      )
      await expect(page.getByRole('link', { name: 'Về đề cộng đồng', exact: true })).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(1)
      expect(schemas.find((schema) => schema['@type'] === 'Quiz').additionalProperty.value).toBe(4)
      expect(schemas.some((schema) => schema['@type'] === 'BreadcrumbList')).toBe(true)
      const html = await (await request.get(path)).text()
      expect(html).toContain('Căn bậc hai số học của 16')
      await expect(page.locator('#exam-title')).toHaveText(exam.title)
      await page.emulateMedia({ media: 'print' })
      await expect(page.locator('#exam-title')).not.toBeVisible()
      await page.emulateMedia({ media: 'screen' })
    }
    for (const href of ['/', '/pricing', '/community', '/terms', '/privacy']) {
      expect(await page.locator(`footer a[href="${href}"]`).count()).toBeGreaterThan(0)
    }
    const footers = page.locator('footer')
    if (path === '/terms' || path === '/privacy') {
      const article = page.locator('article')
      await expect(article).not.toContainText(/facebook|zalo|fanpage|threads|messenger/i)
      await expect(
        article.locator('a[href^="mailto:"], a[href^="tel:"], img[src*="/social/"]'),
      ).toHaveCount(0)
      const sections = article.locator('section')
      await expect(sections).toHaveCount(path === '/terms' ? 14 : 9)
    }
    await expect(
      footers.locator('a[href^="mailto:"], a[href^="tel:"], img[src*="/social/"]'),
    ).toHaveCount(0)
    expect(await footers.allTextContents()).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/facebook|zalo|fanpage|threads|messenger|hotline|liên hệ|@/i),
      ]),
    )
    const footerHrefs = await footers
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    expect(footerHrefs.every((href) => href?.startsWith('/'))).toBe(true)
    const images = await page
      .locator('img')
      .evaluateAll((elements) => elements.filter((element) => !element.hasAttribute('alt')).length)
    expect(images).toBe(0)
    const headingLevels = await page
      .locator('h1,h2,h3,h4,h5,h6')
      .evaluateAll((elements) => elements.map((element) => Number(element.tagName.slice(1))))
    for (let index = 1; index < headingLevels.length; index++)
      expect(headingLevels[index]! - headingLevels[index - 1]!).toBeLessThanOrEqual(1)
  })
}

test('guest community cards are visible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false })
  const page = await context.newPage()
  try {
    expect((await page.goto('/community'))?.status()).toBe(200)
    const card = page.locator('article').filter({ hasText: exam.title }).first()
    await expect(card).toBeVisible()
    await expect(card.getByRole('button', { name: 'Đọc đề', exact: true })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Làm bài', exact: true })).toBeVisible()
    await expect(page.getByRole('status')).toHaveCount(0)
    await expect(page.locator('h1')).toHaveCount(1)
  } finally {
    await context.close()
  }
})

test('private and utility pages remain noindex', async ({ page, request }) => {
  await page.goto('/editor')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page).toHaveTitle(/Trình soạn đề/)
  const admin = await request.get('/admin', { maxRedirects: 0 })
  expect(admin.headers()['x-robots-tag']).toBe('noindex')
  for (const path of ['/login', '/register', '/preview-designs']) {
    await page.goto(path)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  }
})

test('missing exams are noindex and bundled samples remain available', async ({
  page,
  request,
}) => {
  for (const id of ['invalid', '22222222-2222-4222-8222-222222222222']) {
    for (const userAgent of ['Mozilla/5.0', 'Googlebot']) {
      const missing = await request.get(`/exams/${id}`, {
        headers: { 'user-agent': userAgent },
      })
      expect(missing.status()).toBe(404)
    }
    await page.goto(`/exams/${id}`)
    expect(
      await page
        .locator('meta[name="robots"]')
        .evaluateAll((elements) =>
          elements.some((element) => element.getAttribute('content')?.includes('noindex')),
        ),
    ).toBe(true)
  }
  expect((await page.goto('/exams/ct-toan-9-2026'))?.status()).toBe(200)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.locator('h1')).toHaveCount(1)
})
