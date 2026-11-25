import { describe, expect, it } from 'vitest'

import { PublicLinks } from '@/components/seo/public-links'
import { FooterUi } from '@/modules/public-pages/components/marketing-shell-ui'
import { renderWithProviders } from '@/testing/render'

describe('public footers', () => {
  it.each([
    { name: 'marketing and exam footer', ui: <FooterUi /> },
    { name: 'app and community public links', ui: <PublicLinks /> },
  ])('$name keeps internal navigation without contact blocks', ({ ui }) => {
    const { container } = renderWithProviders(ui)
    const hrefs = [...container.querySelectorAll('a')].map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/pricing', '/community', '/terms', '/privacy']),
    )
    expect(hrefs.every((href) => href?.startsWith('/'))).toBe(true)
    expect(container.textContent).not.toMatch(
      /facebook|zalo|fanpage|threads|messenger|hotline|liên hệ|email|điện thoại|địa chỉ|@/i,
    )
    expect(container.querySelectorAll('button, img[src*="/social/"]')).toHaveLength(0)
  })

  it('keeps the marketing and exam copyright', () => {
    const { getByText } = renderWithProviders(<FooterUi />)
    expect(getByText('© 2026 Đề Thi Hub')).toBeInTheDocument()
  })
})
