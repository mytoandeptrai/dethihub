import { describe, expect, it } from 'vitest'

import LegalUi from '@/modules/public-pages/components/legal-ui'
import { renderWithProviders } from '@/testing/render'

describe('legal pages', () => {
  it.each(['terms', 'privacy'] as const)(
    '%s keeps nonempty, consecutively numbered sections without social contacts',
    (kind) => {
      const { container } = renderWithProviders(<LegalUi kind={kind} />)
      const sections = [...container.querySelectorAll('article section')]
      expect(sections).toHaveLength(kind === 'terms' ? 14 : 9)
      sections.forEach((section, index) => {
        const heading = section.querySelector('h2')
        expect(heading?.textContent).toMatch(new RegExp(`^${index + 1}\\. `))
        expect(heading?.nextElementSibling?.textContent?.trim()).toBeTruthy()
        expect(container.querySelector(`nav a[href="#${section.id}"]`)).not.toBeNull()
      })
      expect(container.textContent).not.toMatch(
        /facebook|zalo|fanpage|threads|messenger|kênh ở mục 1/i,
      )
      expect(
        container.querySelectorAll('a[href^="mailto:"], a[href^="tel:"], img[src*="/social/"]'),
      ).toHaveLength(0)
    },
  )
})
