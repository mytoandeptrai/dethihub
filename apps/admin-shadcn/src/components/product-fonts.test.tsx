import { existsSync, readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import ProductFontPreloads from './product-font-preloads'

describe('marketing fonts', () => {
  it('preloads six local Vietnamese/Latin faces with matching files', () => {
    const html = renderToStaticMarkup(<ProductFontPreloads />)
    const urls = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]!)
    expect(urls).toHaveLength(6)
    expect(new Set(urls).size).toBe(6)
    for (const url of urls) {
      expect(url).toMatch(
        /^\/fonts\/be-vietnam-pro-(vietnamese|latin)-(400|600|700)-normal\.woff2$/,
      )
      expect(existsSync(`public${url}`)).toBe(true)
    }
  })
  it('keeps swap, Unicode ranges and a distinct family for marketing UI', () => {
    const css = readFileSync('src/styles/product-fonts.css', 'utf8')
    expect(css.match(/font-display: swap/g)).toHaveLength(6)
    expect(css.match(/unicode-range:/g)).toHaveLength(6)
    expect(css).toContain("font-family: 'Be Vietnam Pro UI'")
    expect(css).toContain('html:has([data-marketing-shell])')
    expect(css).toContain('.doc-content')
  })
})
