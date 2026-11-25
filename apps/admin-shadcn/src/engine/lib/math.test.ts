import katex from 'katex'
import { describe, expect, it } from 'vitest'

import { renderMath } from './math'

describe('math HTML', () => {
  it.each(['x^2', '\\frac{1}{2}', '\\ce{H2 + O2 -> H2O}'])(
    'preserves KaTeX output for %s',
    (latex) => {
      for (const display of [false, true]) {
        const delimiter = display ? '$$' : '$'
        expect(renderMath(`${delimiter} ${latex} ${delimiter}`)).toBe(
          katex.renderToString(latex, {
            displayMode: display,
            throwOnError: false,
            output: 'html',
            strict: false,
            trust: false,
          }),
        )
      }
    },
  )

  it('preserves empty and malformed formulas without throwing', () => {
    expect(renderMath('')).toBe('')
    expect(renderMath('$unfinished')).toBe('$unfinished')
    expect(renderMath('$\\notarealcommand{$')).toContain('katex-error')
  })
})
