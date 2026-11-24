'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { QuestionStreamParser } from '@/lib/ai-question-stream'
import { streamAiChat } from '@/lib/ai-stream'

import type { GeneratedQuestion } from '@/lib/ai-question-stream'
import type { components } from '@workspace/api-types'

export interface AiQuestionRequest {
  body: components['schemas']['ChatRequestDto']
  retryOf?: string
  total?: number
}

export interface AiQuestionState {
  busy: boolean
  stopped: boolean
  questions: GeneratedQuestion[]
  blocks: Record<string, unknown>[]
  total?: number
  text: string
  error?: string
  receipt?: string
  refundedTokens?: number
}

interface RunOptions {
  signal?: AbortSignal
  onUpdate?: (state: AiQuestionState) => void
  onQuota?: (quota: unknown) => void
  onProgress?: (progress: { phase: 'think' | 'write' | 'retry'; thought: number; thinking: string; text: string }) => void
}

const initialState = (): AiQuestionState => ({ busy: false, stopped: false, questions: [], blocks: [], text: '' })

export function useAiQuestionStream() {
  const [state, setState] = useState<AiQuestionState>(initialState)
  const active = useRef<AbortController | null>(null)
  const previous = useRef<{ request: AiQuestionRequest; options: RunOptions } | null>(null)
  useEffect(() => () => active.current?.abort(), [])
  const stop = useCallback(() => active.current?.abort(), [])

  const run = useCallback(async (request: AiQuestionRequest, options: RunOptions = {}) => {
    if (active.current) throw new Error('AI đang xử lý yêu cầu trước.')
    const controller = new AbortController()
    active.current = controller
    previous.current = { request: structuredClone(request), options }
    const abort = () => controller.abort()
    options.signal?.addEventListener('abort', abort, { once: true })
    if (options.signal?.aborted) controller.abort()
    let parser = new QuestionStreamParser()
    let current: AiQuestionState = { ...initialState(), busy: true, total: request.total }
    let thinking = ''
    let final: components['schemas']['ChatResponseDto'] | undefined
    const publish = (patch: Partial<AiQuestionState> = {}) => {
      current = { ...current, questions: [...parser.questions], blocks: [...parser.blocks], ...patch }
      if (patch.receipt && previous.current) previous.current.request.retryOf = patch.receipt
      setState(current)
      options.onUpdate?.(current)
    }
    publish()
    try {
      for await (const event of streamAiChat(request.body, controller.signal, request.retryOf)) {
        const value = JSON.parse(event.data) as Record<string, unknown>
        if (typeof value.refundedTokens === 'number' && value.refundedTokens > 0) publish({ refundedTokens: value.refundedTokens })
        if (value.type === 'delta') {
          const chunk = typeof value.c === 'string' ? value.c : ''
          parser.push(chunk)
          publish({ text: current.text + chunk })
          options.onProgress?.({ phase: 'write', thought: thinking.length, thinking, text: current.text })
        } else if (value.type === 'think') {
          thinking += typeof value.d === 'string' ? value.d : ''
          options.onProgress?.({ phase: 'think', thought: thinking.length, thinking, text: current.text })
        } else if (value.type === 'retry') {
          parser = new QuestionStreamParser()
          thinking = ''
          publish({ text: '' })
          options.onProgress?.({ phase: 'retry', thought: 0, thinking, text: '' })
        } else if (value.type === 'done') {
          final = value as unknown as components['schemas']['ChatResponseDto']
          options.onQuota?.(value.quota)
          if (typeof value.content === 'string' && value.content !== current.text) {
            parser = new QuestionStreamParser()
            parser.push(value.content)
          }
          publish({ text: typeof value.content === 'string' ? value.content : current.text, receipt: typeof value.receipt === 'string' ? value.receipt : undefined })
        } else if (value.type === 'error') {
          options.onQuota?.(value.quota)
          throw new Error(typeof value.detail === 'string' ? value.detail : 'AI đang quá tải. Bạn vui lòng thử lại sau ít phút hoặc tự soạn câu hỏi.')
        }
      }
      if (!final) throw new Error('Kết nối tới AI bị ngắt giữa chừng. Vui lòng thử lại.')
      if (!current.text.trim()) throw new Error('AI không trả về nội dung. Vui lòng thử lại.')
    } catch (error) {
      if (controller.signal.aborted) publish({ stopped: true })
      else {
        const refund = error && typeof error === 'object' && 'refundedTokens' in error ? error.refundedTokens : undefined
        publish({ error: error instanceof Error ? error.message : 'Không gọi được AI.', ...(typeof refund === 'number' && refund > 0 ? { refundedTokens: refund } : {}) })
        throw error
      }
    } finally {
      publish({ busy: false })
      active.current = null
      options.signal?.removeEventListener('abort', abort)
    }
    return { content: current.text, reasoning: thinking, usage: final?.usage ?? null, receipt: current.receipt, citations: final?.citations, stopped: current.stopped }
  }, [])

  const retry = useCallback(() => {
    if (!previous.current) return Promise.reject(new Error('Chưa có yêu cầu để thử lại.'))
    return run(previous.current.request, { ...previous.current.options, signal: undefined })
  }, [run])
  return { state, run, stop, retry }
}
