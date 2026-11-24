import { createMock } from '@golevelup/ts-vitest'
import { HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { describe, expect, it, vi } from 'vitest'

import { ChatService } from '@/modules/ai/application/services/chat.service'
import { LlmUpstreamError } from '@/modules/ai/domain/provider-chain'
import { issueReceipt, requestHash } from '@/modules/ai/domain/receipt'

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
    STRONG_POINT_FACTOR: 3,
    AI_RECEIPT_SECRET: 'test-receipt-secret',
  })
  const service = new ChatService(quotas, configs, config, prompts, calls, openai, anthropic)
  return { service, quotas, quota, release, calls, openai, sink }
}

describe('chatService fallback and settlement', () => {
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
      ]).toEqual(['gemini', 'numes', 'crowllm', 'coarena', 'vyceai'])
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
