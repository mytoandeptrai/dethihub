import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { JsonLd } from './json-ld'

describe('json-ld serialization', () => {
  it('escapes markup that could close the script element', () => {
    const markup = renderToStaticMarkup(
      <JsonLd data={{ name: '</script><script>alert(1)</script>' }} />,
    )
    expect(markup).toContain('\\u003c/script>')
    expect(markup.match(/<script/g)).toHaveLength(1)
  })
})
