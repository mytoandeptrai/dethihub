import { render } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExamEditor } from './ExamEditor'

vi.mock('@tiptap/react', async (original) => ({
  ...(await original<object>()),
  useEditor: vi.fn(() => null),
}))
beforeEach(() => vi.clearAllMocks())

describe('read-only editor accessibility', () => {
  it.each([
    { name: 'empty', content: { type: 'doc', content: [] } },
    {
      name: 'populated',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Question' }] }],
      },
    },
  ])('names the $name read-only textbox', ({ content }) => {
    render(<ExamEditor content={content} onChange={vi.fn()} readOnly />)
    const options = vi.mocked(useEditor).mock.calls.at(-1)?.[0]
    expect(options?.editorProps?.attributes).toMatchObject({
      'aria-label': 'Nội dung đề thi',
      'aria-readonly': 'true',
    })
  })
  it('does not change editable editor attributes', () => {
    render(<ExamEditor content={{ type: 'doc', content: [] }} onChange={vi.fn()} />)
    const options = vi.mocked(useEditor).mock.calls.at(-1)?.[0]
    expect(options?.editorProps?.attributes).not.toHaveProperty('aria-readonly')
  })
})
