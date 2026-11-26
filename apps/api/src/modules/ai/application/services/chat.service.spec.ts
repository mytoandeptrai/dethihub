import { createMock } from '@golevelup/ts-vitest'
import { HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatService } from '@/modules/ai/application/services/chat.service'
import { estimatePromptTokens } from '@/modules/ai/domain/billing'
import { LlmUpstreamError } from '@/modules/ai/domain/provider-chain'
import { issueReceipt, requestHash } from '@/modules/ai/domain/receipt'
import { OpenAiCompatibleAdapter } from '@/modules/ai/infrastructure/adapters/openai-compatible.adapter'

import type { Env } from '@/app/config/env.schema'
import type { AiCallLogRepositoryPort } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import type { LlmProviderPort, LlmResult } from '@/modules/ai/application/ports/llm-provider.port'
import type { TaskPromptsPort } from '@/modules/ai/application/ports/task-prompts.port'
import type { ChatCommand, ChatSink } from '@/modules/ai/application/services/chat.service'
import type { ProviderConfigService } from '@/modules/ai/application/services/provider-config.service'
import type { QuotaService } from '@/modules/ai/application/services/quota.service'
import type { ProviderConfig } from '@/modules/ai/domain/provider-chain'

vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn().mockResolvedValue(undefined) }))

const friendly = 'AI đang quá tải. Bạn vui lòng thử lại sau ít phút hoặc tự soạn câu hỏi.'
const command: ChatCommand = {
  userId: 'test-user',
  task: 'soan-de',
  messages: [{ role: 'user', content: 'Test question' }],
  maxTokens: 256,
}
const success: LlmResult = {
  content: 'A complete answer',
  reasoning: '',
  finishReason: 'stop',
  usage: { total_tokens: 80 },
}
const empty: LlmResult = { content: '', reasoning: 'hidden reasoning', finishReason: 'length' }
const slot = { apiKey: 'test-key', baseUrl: 'https://example.com/v1', model: 'test-model' }
const defaultProviders = { gemini: slot, numes: slot }

const event = (content: string, reasoning = '', done = false) =>
  new TextEncoder().encode(
    `data: ${JSON.stringify({
      choices: [{ delta: { content, reasoning }, ...(done ? { finish_reason: 'stop' } : {}) }],
      ...(done ? { usage: success.usage } : {}),
    })}\n\n${done ? 'data: [DONE]\n\n' : ''}`,
  )

function setup(providers: ProviderConfig['providers'] = defaultProviders) {
  const quotas = createMock<QuotaService>()
  const quota = { used: 10, limit: 100_000, scope: 'month' as const }
  const release = vi.fn().mockResolvedValue(undefined)
  quotas.readQuota.mockResolvedValue(quota)
  quotas.reserve.mockResolvedValue(release)
  quotas.addUsage.mockResolvedValue({ ...quota, used: 90 })
  quotas.refundReceipt.mockResolvedValue(quota)
  const configs = createMock<ProviderConfigService>()
  configs.load.mockResolvedValue({ providers })
  const prompts = createMock<TaskPromptsPort>()
  prompts.build.mockReturnValue('Test system')
  const calls = createMock<AiCallLogRepositoryPort>()
  calls.log.mockResolvedValue(undefined)
  calls.countRecentFreeFails.mockResolvedValue(99)
  const openai = createMock<LlmProviderPort>()
  const anthropic = createMock<LlmProviderPort>()
  const sink = createMock<ChatSink>()
  const config = new ConfigService<Env, true>({
    LLM_TIMEOUT_MS: 250_000,
    LLM_FIRST_ANSWER_TIMEOUT_MS: 60_000,
    STRONG_POINT_FACTOR: 3,
    AI_RECEIPT_SECRET: 'test-receipt-secret',
  })
  const service = new ChatService(quotas, configs, config, prompts, calls, openai, anthropic)
  return { service, quotas, quota, release, calls, openai, sink, config }
}

describe('chatService fallback and settlement', () => {
  describe('first-answer deadline with the real streaming adapter', () => {
    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    it.each([false, true])(
      'aborts reasoning-only output at 60000ms and bills only the fallback (stream=%s)',
      async (stream) => {
        vi.useFakeTimers()
        const { service, openai, quotas, sink, calls } = setup()
        const adapter = new OpenAiCompatibleAdapter()
        openai.complete.mockImplementation((request) => adapter.complete(request))
        let firstSignal: AbortSignal | undefined
        const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
          if (fetchMock.mock.calls.length > 1) {
            return new Response(event(success.content, '', true))
          }
          firstSignal = options?.signal ?? undefined
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(event('   ', 'reasoning is not an answer'))
                firstSignal?.addEventListener(
                  'abort',
                  () => controller.error(firstSignal?.reason),
                  { once: true },
                )
              },
            }),
          )
        })
        vi.stubGlobal('fetch', fetchMock)
        const reply = service.chat(command, stream ? sink : undefined)
        await vi.advanceTimersByTimeAsync(59_999)
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(firstSignal?.aborted).toBe(false)
        expect(quotas.addUsage).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(1)
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(firstSignal?.aborted).toBe(true)
        expect((await reply).content).toBe(success.content)
        expect(quotas.addUsage).toHaveBeenCalledExactlyOnceWith(
          command.userId,
          80,
          expect.anything(),
        )
        expect(calls.log).toHaveBeenCalledWith(
          expect.objectContaining({ ok: false, error: expect.stringContaining('60000') }),
        )
        expect(sink.think).not.toHaveBeenCalled()
        expect(sink.delta.mock.calls).toEqual(stream ? [[success.content]] : [])
        const body = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as Record<
          string,
          unknown
        >
        expect(body).toMatchObject({ reasoning_effort: 'low', stream: true })
      },
    )

    it('lets a non-streaming client finish at 90s after answer text arrives before 60s', async () => {
      vi.useFakeTimers()
      const { service, openai, quotas } = setup({ coarena: slot })
      const adapter = new OpenAiCompatibleAdapter()
      openai.complete.mockImplementation((request) => adapter.complete(request))
      let signal: AbortSignal | undefined
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
          signal = options?.signal ?? undefined
          return new Response(
            new ReadableStream({
              start(controller) {
                setTimeout(() => controller.enqueue(event(success.content)), 1000)
                setTimeout(() => {
                  controller.enqueue(event('', '', true))
                  controller.close()
                }, 90_000)
              },
            }),
          )
        }),
      )
      const reply = service.chat(command)
      await vi.advanceTimersByTimeAsync(60_000)
      expect(signal?.aborted).toBe(false)
      expect(quotas.addUsage).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(30_000)
      expect((await reply).content).toBe(success.content)
      expect(signal?.aborted).toBe(false)
    })

    it('still aborts at the 250s absolute deadline after answer output, without splicing or charging', async () => {
      vi.useFakeTimers()
      const { service, openai, sink, quotas } = setup()
      const adapter = new OpenAiCompatibleAdapter()
      openai.complete.mockImplementation((request) => adapter.complete(request))
      let signal: AbortSignal | undefined
      const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
        signal = options?.signal ?? undefined
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(event(success.content))
              signal?.addEventListener('abort', () => controller.error(signal?.reason), {
                once: true,
              })
            },
          }),
        )
      })
      vi.stubGlobal('fetch', fetchMock)
      const failure = service.chat(command, sink).catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(60_000)
      expect(signal?.aborted).toBe(false)
      expect(sink.delta).toHaveBeenCalledWith(success.content)
      await vi.advanceTimersByTimeAsync(190_000)
      expect(signal?.aborted).toBe(true)
      expect(await failure).toBeInstanceOf(HttpException)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(quotas.addUsage).not.toHaveBeenCalled()
    })

    it('gives each attempt its own deadline and leaves a fully timed-out chain uncharged', async () => {
      vi.useFakeTimers()
      const { service, openai, quotas, release } = setup()
      openai.complete.mockImplementation(() => new Promise(() => {}))
      const failure = service.chat(command).catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(60_000)
      expect(openai.complete).toHaveBeenCalledTimes(2)
      await vi.advanceTimersByTimeAsync(59_999)
      expect(release).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(await failure).toBeInstanceOf(HttpException)
      expect(quotas.addUsage).not.toHaveBeenCalled()
      expect(quotas.refundReceipt).not.toHaveBeenCalled()
      expect(release).toHaveBeenCalled()
    })

    it('does not bill an adapter that resolves a broken result synchronously on abort', async () => {
      vi.useFakeTimers()
      const { service, openai, quotas } = setup()
      openai.complete
        .mockImplementationOnce(
          (request) =>
            new Promise((resolve) => {
              request.signal?.addEventListener('abort', () => resolve({ ...empty, broken: true }), {
                once: true,
              })
            }),
        )
        .mockResolvedValue(success)
      const reply = service.chat(command)
      await vi.advanceTimersByTimeAsync(60_000)
      expect((await reply).content).toBe(success.content)
      expect(quotas.addUsage).toHaveBeenCalledExactlyOnceWith(command.userId, 80, expect.anything())
    })

    it('allows a 110s chain with a 100s per-attempt absolute deadline', async () => {
      vi.useFakeTimers()
      const { service, openai, config, quotas } = setup()
      config.set('LLM_TIMEOUT_MS', 100_000)
      openai.complete
        .mockImplementationOnce(() => new Promise(() => {}))
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(success), 50_000)
            }),
        )
      const started = Date.now()
      const reply = service.chat(command)
      await vi.advanceTimersByTimeAsync(110_000)
      expect((await reply).content).toBe(success.content)
      expect(Date.now() - started).toBe(110_000)
      expect(openai.complete).toHaveBeenCalledTimes(2)
      expect(quotas.addUsage).toHaveBeenCalledExactlyOnceWith(command.userId, 80, expect.anything())
    })
  })

  it.each(['coarena', 'numes', 'crowllm', 'vyceai'] as const)(
    'forces low reasoning effort for %s instead of the client effort',
    async (provider) => {
      const { service, openai } = setup({ [provider]: slot })
      openai.complete.mockResolvedValue(success)
      await service.chat({ ...command, reasoningEffort: 'high' })
      expect(openai.complete.mock.calls[0]?.[0].reasoningEffort).toBe('low')
    },
  )

  it.each([12_000, 100_000])('caps output against available quota (limit=%s)', async (limit) => {
    const { service, openai, quota } = setup()
    quota.limit = limit
    openai.complete.mockResolvedValue(success)
    await service.chat({ ...command, maxTokens: 32_000 })
    const prompt = estimatePromptTokens([
      { role: 'system', content: 'Test system' },
      ...command.messages,
    ])
    expect(openai.complete.mock.calls[0]?.[0].maxTokens).toBe(
      Math.min(32_000, limit - quota.used - prompt),
    )
  })

  it.each([false, true])('returns a successful first answer (stream=%s)', async (stream) => {
    const { service, openai, quotas, sink } = setup()
    openai.complete.mockResolvedValue(success)
    expect((await service.chat(command, stream ? sink : undefined)).content).toBe(success.content)
    expect(openai.complete).toHaveBeenCalledTimes(1)
    expect(quotas.addUsage).toHaveBeenCalledWith(command.userId, 80, expect.anything())
  })

  describe.each([false, true])('stream=%s', (stream) => {
    it.each([
      ['403 tier rejection', new LlmUpstreamError(403)],
      ['429', new LlmUpstreamError(429)],
      ['503', new LlmUpstreamError(503)],
      ['timeout', new DOMException('timeout', 'TimeoutError')],
      ['abort', new DOMException('aborted', 'AbortError')],
      ['network error', new Error('network unavailable')],
    ])('falls back after %s before output', async (_label, error) => {
      const { service, openai, sink } = setup()
      openai.complete.mockImplementation(async (request) => {
        if (request.target.provider === 'gemini') throw error
        request.stream?.onOpen()
        request.stream?.onDelta({ content: success.content, reasoning: '' })
        return success
      })
      expect((await service.chat(command, stream ? sink : undefined)).content).toBe(success.content)
      expect(openai.complete.mock.calls.at(-1)?.[0].target.provider).toBe('numes')
      expect(sink.delta.mock.calls).toEqual(stream ? [[success.content]] : [])
    })

    it('falls back on empty reasoning-only content without exposing it', async () => {
      const { service, openai, sink } = setup()
      openai.complete.mockImplementation(async (request) => {
        request.stream?.onOpen()
        if (request.target.provider === 'gemini') {
          request.stream?.onDelta({ content: '', reasoning: empty.reasoning })
          return empty
        }
        request.stream?.onDelta({ content: success.content, reasoning: '' })
        return success
      })
      expect((await service.chat(command, stream ? sink : undefined)).content).toBe(success.content)
      expect(sink.think).not.toHaveBeenCalled()
    })

    it('exhausts every configured fallback and never charges a fully failed request', async () => {
      const { service, openai, quotas, release, sink } = setup({
        gemini: slot,
        numes: slot,
        crowllm: slot,
        coarena: slot,
        vyceai: slot,
      })
      openai.complete.mockResolvedValue(empty)
      await expect(service.chat(command, stream ? sink : undefined)).rejects.toThrow(friendly)
      expect([
        ...new Set(openai.complete.mock.calls.map(([request]) => request.target.provider)),
      ]).toEqual(['gemini', 'coarena', 'numes', 'crowllm', 'vyceai'])
      expect(quotas.addUsage).not.toHaveBeenCalled()
      expect(quotas.refundReceipt).not.toHaveBeenCalled()
      expect(release).toHaveBeenCalled()
    })
  })

  it.each(['broken', 'throw'] as const)(
    'does not splice another model after visible partial output (%s)',
    async (failure) => {
      const { service, openai, sink, quotas, calls } = setup()
      openai.complete.mockImplementation(async (request) => {
        request.stream?.onOpen()
        request.stream?.onDelta({ content: 'partial', reasoning: '' })
        if (failure === 'throw') throw new DOMException('timeout', 'TimeoutError')
        return { ...success, content: 'partial', broken: true }
      })
      await expect(service.chat(command, sink)).rejects.toThrow(friendly)
      expect(openai.complete).toHaveBeenCalledTimes(1)
      expect(sink.delta).toHaveBeenCalledExactlyOnceWith('partial')
      expect(quotas.addUsage).not.toHaveBeenCalled()
      expect(calls.log).toHaveBeenCalledWith(expect.objectContaining({ ok: false }))
    },
  )

  it('falls back after a broken stream that emitted reasoning but no answer', async () => {
    const { service, openai, sink } = setup()
    openai.complete.mockImplementation(async (request) => {
      if (request.target.provider === 'gemini') {
        request.stream?.onOpen()
        request.stream?.onDelta({ content: '', reasoning: 'discard me' })
        return { ...empty, broken: true }
      }
      return success
    })
    expect((await service.chat(command, sink)).content).toBe(success.content)
    expect(openai.complete).toHaveBeenCalledTimes(2)
    expect(sink.think).not.toHaveBeenCalled()
  })

  it('returns a friendly error for an unconfigured chain and releases the reservation', async () => {
    const { service, release, quotas } = setup({})
    await expect(service.chat(command)).rejects.toThrow(friendly)
    expect(quotas.addUsage).not.toHaveBeenCalled()
    expect(release).toHaveBeenCalled()
  })

  it('settles a successful retry receipt only once after fallback succeeds', async () => {
    const { service, openai, quotas, quota } = setup()
    const hash = requestHash([{ role: 'system', content: 'Test system' }, ...command.messages], 256)
    const retryOf = issueReceipt('test-receipt-secret', command.userId, 100, hash)
    openai.complete.mockRejectedValueOnce(new LlmUpstreamError(403)).mockResolvedValue(success)
    const reply = await service.chat({ ...command, retryOf })
    expect(quotas.refundReceipt).toHaveBeenCalledExactlyOnceWith(
      command.userId,
      expect.objectContaining({ t: 100, h: hash }),
      quota,
      80,
    )
    expect(reply.receipt).toBeUndefined()
  })

  it('preserves the pending refund and explains it on a fully failed retry', async () => {
    const { service, openai, quotas } = setup()
    const hash = requestHash([{ role: 'system', content: 'Test system' }, ...command.messages], 256)
    const retryOf = issueReceipt('test-receipt-secret', command.userId, 100, hash)
    openai.complete.mockResolvedValue(empty)
    const exception: unknown = await service
      .chat({ ...command, retryOf })
      .catch((error: unknown) => error)
    expect(exception).toBeInstanceOf(HttpException)
    const body = (exception as HttpException).getResponse()
    expect(body).toMatchObject({ message: expect.stringContaining('chưa áp dụng hoàn điểm') })
    expect(quotas.refundReceipt).not.toHaveBeenCalled()
    expect(quotas.addUsage).not.toHaveBeenCalled()
  })
})
