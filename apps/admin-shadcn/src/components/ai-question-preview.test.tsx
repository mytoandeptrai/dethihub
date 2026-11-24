import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AiQuestionPreview } from './ai-question-preview'

const questions = [1, 2].map((number) => ({ id: String(number), number, prompt: `Question ${number}`, raw: { no: number } }))

describe('question preview', () => {
  it('selects every new question by default and inserts only checked questions', async () => {
    const onInsert = vi.fn()
    render(<AiQuestionPreview questions={questions} onInsert={onInsert} onRegenerate={vi.fn()} />)
    expect(screen.getByLabelText('Chọn câu 1')).toBeChecked()
    await userEvent.click(screen.getByLabelText('Chọn câu 1'))
    await userEvent.click(screen.getByRole('button', { name: 'Chèn vào đề' }))
    expect(onInsert).toHaveBeenCalledExactlyOnceWith([questions[1]])
  })

  it('keeps prior selections as new questions arrive and disables empty insertion', async () => {
    const props = { onInsert: vi.fn(), onRegenerate: vi.fn() }
    const { rerender } = render(<AiQuestionPreview {...props} questions={questions.slice(0, 1)} busy total={20} />)
    await userEvent.click(screen.getByLabelText('Chọn câu 1'))
    rerender(<AiQuestionPreview {...props} questions={questions} total={20} />)
    expect(screen.getByLabelText('Chọn câu 1')).not.toBeChecked()
    expect(screen.getByLabelText('Chọn câu 2')).toBeChecked()
    await userEvent.click(screen.getByLabelText('Chọn câu 2'))
    expect(screen.getByRole('button', { name: 'Chèn vào đề' })).toBeDisabled()
  })

  it('shows explicit refund information only when provided and supports regenerate', async () => {
    const props = { questions, onInsert: vi.fn(), onRegenerate: vi.fn() }
    const { rerender } = render(<AiQuestionPreview {...props} />)
    expect(screen.queryByText(/Đã hoàn/)).not.toBeInTheDocument()
    rerender(<AiQuestionPreview {...props} refundedTokens={2000} />)
    expect(screen.getByText('Đã hoàn 2 điểm')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Soạn lại' }))
    expect(props.onRegenerate).toHaveBeenCalledOnce()
  })
})
