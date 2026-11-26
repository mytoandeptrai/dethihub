import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuestionBody } from './lazy-question-body'
import { QuestionBody as OriginalBody } from './QuestionBody'

describe('lazy question body', () => {
  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'preserves %s image layout and rich text',
    (position) => {
      const q = {
        prompt: '**Đề bài** < 3',
        align: 'center' as const,
        image: { src: '/figure.png', alt: 'Hình vẽ', position, width: 40 },
      }
      const original = render(<OriginalBody q={q} className="question" />)
      const lazy = render(<QuestionBody q={q} className="question" />)
      expect(lazy.container.innerHTML).toBe(original.container.innerHTML)
    },
  )

  it('preserves formula HTML after the math module loads', async () => {
    const q = { prompt: '**Câu 1.** $\\frac{1}{2}$ và $\\ce{H2O}$' }
    const original = render(<OriginalBody q={q} />)
    const lazy = render(<QuestionBody q={q} />)
    await waitFor(() => expect(lazy.container.querySelectorAll('.katex')).toHaveLength(2))
    expect(lazy.container.innerHTML).toBe(original.container.innerHTML)
  })
})
