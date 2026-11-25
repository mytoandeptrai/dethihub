import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MathText } from './lazy-math-text'

vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({ children }: { children: string }) => <span data-testid="formula">{children}</span>,
}))

describe('conditional math text', () => {
  it('renders non-math content and formatting immediately without the math component', () => {
    const { container } = render(
      <MathText as="div" className="preview">
        {'**Chữ** < 3'}
      </MathText>,
    )
    expect(container.firstElementChild).toHaveClass('preview')
    expect(container.querySelector('strong')).toHaveTextContent('Chữ')
    expect(container).toHaveTextContent('Chữ < 3')
    expect(screen.queryByTestId('formula')).not.toBeInTheDocument()
  })

  it('renders empty content without loading math', () => {
    const empty = ''
    const { container } = render(<MathText>{empty}</MathText>)
    expect(container.firstElementChild).toBeEmptyDOMElement()
    expect(screen.queryByTestId('formula')).not.toBeInTheDocument()
  })

  it('delegates formulas to the existing math component', () => {
    render(<MathText>{'$\\frac{1}{2}$'}</MathText>)
    expect(screen.getByTestId('formula')).toHaveTextContent('$\\frac{1}{2}$')
  })
})
