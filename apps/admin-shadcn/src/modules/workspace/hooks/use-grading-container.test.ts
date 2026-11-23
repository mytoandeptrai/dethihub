import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useGradingContainer } from './use-grading-container'

afterEach(() => vi.unstubAllGlobals())

describe('local grading', () => {
  it('grades answers and trims student details', async () => {
    const { result } = renderHook(useGradingContainer)
    for (const [index, letter] of result.current.keyLetters.entries()) {
      act(() => result.current.toggleAnswer(index, letter))
    }
    act(() => result.current.setStudentName('  Học sinh  '))
    await act(async () => {
      await result.current.grade()
    })
    expect(result.current.result).toMatchObject({ score: 20, correct: 20, wrong: 0, blank: 0 })
    expect(result.current.studentName).toBe('Học sinh')
    act(() => result.current.setSelectedKey('k2'))
    expect(result.current.answers).toEqual([])
    expect(result.current.result).toBeNull()
    expect(result.current.keyLetters).toHaveLength(12)
  })

  it('counts every unanswered question as blank and resets results', async () => {
    const { result } = renderHook(useGradingContainer)
    await act(async () => {
      await result.current.grade()
    })
    expect(result.current.result).toMatchObject({ score: 0, correct: 0, wrong: 0, blank: 20 })
    act(() => result.current.reset())
    expect(result.current.result).toBeNull()
  })

  it('rejects non-images and surfaces file reading errors', () => {
    const { result } = renderHook(useGradingContainer)
    act(() => result.current.handleFile(new File(['text'], 'text.txt', { type: 'text/plain' })))
    expect(result.current.error).toBe('Chọn một tệp hình ảnh.')
    vi.stubGlobal(
      'FileReader',
      class {
        failure?: () => void
        addEventListener(event: string, handler: () => void) {
          if (event === 'error') this.failure = handler
        }
        abort() {}
        readAsDataURL() {
          this.failure?.()
        }
      },
    )
    act(() => result.current.handleFile(new File(['image'], 'image.png', { type: 'image/png' })))
    expect(result.current.error).toBe('Không đọc được hình ảnh. Thử lại với tệp khác.')
    expect(result.current.scanning).toBe(false)
    expect(result.current.image).toBeNull()
  })
})
