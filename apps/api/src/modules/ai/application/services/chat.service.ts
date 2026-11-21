import { setTimeout as sleep } from 'node:timers/promises'

import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AI_CALL_LOG_REPOSITORY } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import {
  ANTHROPIC_PROVIDER,
  OPENAI_COMPATIBLE_PROVIDER,
} from '@/modules/ai/application/ports/llm-provider.port'
import { TASK_PROMPTS } from '@/modules/ai/application/ports/task-prompts.port'
import { ProviderConfigService } from '@/modules/ai/application/services/provider-config.service'
import { QuotaService } from '@/modules/ai/application/services/quota.service'
import {
  billOf,
  costFromUsage,
  EMPTY_FREE_PER_DAY,
  estimatePromptTokens,
  MAX_OUTPUT_TOKENS,
  MAX_PROMPT_TOKENS,
  MIN_OUTPUT_TOKENS,
} from '@/modules/ai/domain/billing'
import { buildTargets, LlmUpstreamError } from '@/modules/ai/domain/provider-chain'
import { quotaMessage, remainingTokens, shortfallMessage } from '@/modules/ai/domain/quota'
import { checkReceipt, issueReceipt, requestHash } from '@/modules/ai/domain/receipt'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { Env } from '@/app/config/env.schema'
import type { AiCallLogRepository } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import type {
  Citation,
  LlmProvider,
  LlmStream,
} from '@/modules/ai/application/ports/llm-provider.port'
import type { TaskPrompts } from '@/modules/ai/application/ports/task-prompts.port'
import type { ChatMessage, Usage } from '@/modules/ai/domain/billing'
import type { Target } from '@/modules/ai/domain/provider-chain'
import type { Quota } from '@/modules/ai/domain/quota'
import type { Receipt } from '@/modules/ai/domain/receipt'

export interface ChatCommand {
  userId: string
  task: string
  taskInput?: unknown
  messages: ChatMessage[]
  maxTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max'
  temperature?: number
  webSearch?: boolean
  strong?: boolean
  /** receipt of the previous reply, sent when that reply was unusable */
  retryOf?: string
}

/** Receives a streamed answer as it arrives; the reply itself is still returned by `chat` */
export interface ChatSink {
  /** the first provider answered: switch the response to a stream */
  start(): void
  think(text: string): void
  delta(text: string): void
  /** the next attempt (same model again or the next one) is starting */
  retry(): void
}

export interface ChatReply {
  content: string
  reasoning: string
  usage: Usage | null
  finishReason: string
  quota: Quota | null
  receipt?: string
  citations?: Citation[]
}

interface Billing {
  userId: string
  quota: Quota | null
  receipt: Receipt | null
  promptTokens: number
  maxTokens: number
  /** signs a receipt for `spent`, undefined when none is due */
  receiptFor: (spent: number) => string | undefined
}

const RETRY_WAIT_MS = 4000
const THINK_BATCH_MS = 250
const NEXT_MODEL_WAIT_MS = 500

const fail = (status: HttpStatus, code: string, message: string) =>
  new HttpException({ code, message }, status)

@Injectable()
export class ChatService {
  readonly #logger = new Logger(ChatService.name)

  constructor(
    private readonly quotas: QuotaService,
    private readonly providers: ProviderConfigService,
    private readonly config: ConfigService<Env, true>,
    @Inject(TASK_PROMPTS) private readonly prompts: TaskPrompts,
    @Inject(AI_CALL_LOG_REPOSITORY) private readonly calls: AiCallLogRepository,
    @Inject(OPENAI_COMPATIBLE_PROVIDER) private readonly openAiCompatible: LlmProvider,
    @Inject(ANTHROPIC_PROVIDER) private readonly anthropic: LlmProvider,
  ) {}

  async chat(command: ChatCommand, sink?: ChatSink): Promise<ChatReply> {
    const { userId } = command
    const quota = await this.quotas.readQuota(userId)

    const system = this.prompts.build(command.task, command.taskInput)
    const history = command.messages.filter((m) => m.role !== 'system')
    if (system === null || history.length === 0) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_TASK,
        message: 'Tác vụ AI không hợp lệ.',
      })
    }
    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      ...history.map(({ role, content }) => ({ role, content })),
    ]

    const promptTokens = estimatePromptTokens(messages)
    if (promptTokens > MAX_PROMPT_TOKENS) {
      throw new PayloadTooLargeException({
        code: ErrorCode.PROMPT_TOO_LONG,
        message: 'Nội dung gửi cho AI quá dài, hãy rút gọn tài liệu nguồn.',
      })
    }

    const temperature =
      command.temperature === undefined ? undefined : Math.min(2, Math.max(0, command.temperature))
    const requested = Math.floor(command.maxTokens ?? MAX_OUTPUT_TOKENS) || MAX_OUTPUT_TOKENS
    let maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.max(MIN_OUTPUT_TOKENS, requested))
    const hash = requestHash(messages, maxTokens, {
      model: command.webSearch ? 'web:' : undefined,
      effort: command.reasoningEffort,
      temperature,
    })

    // A retry earns a refund only when it repeats the exact request of the receipt, and only once it succeeds
    const secret =
      this.config.get('AI_RECEIPT_SECRET', { infer: true }) ||
      this.config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }) ||
      ''
    const receipt =
      command.retryOf && quota ? checkReceipt(secret, command.retryOf, userId, hash) : null
    const pendingRefund = receipt?.t ?? 0

    const remaining = quota ? remainingTokens(quota, pendingRefund) : Infinity
    if (quota && remaining - promptTokens < MIN_OUTPUT_TOKENS) {
      throw fail(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.QUOTA_EXCEEDED,
        remaining >= 1000 ? shortfallMessage(promptTokens, remaining) : quotaMessage(quota),
      )
    }
    if (quota) maxTokens = Math.min(maxTokens, Math.floor(remaining - promptTokens))

    // Hold the most this call can cost, so parallel calls cannot all slip under the limit
    const holdFor =
      quota && pendingRefund ? { ...quota, limit: quota.limit + pendingRefund } : quota
    const release = holdFor
      ? await this.quotas.reserve(userId, holdFor, promptTokens + maxTokens)
      : async () => {}
    if (!release) {
      throw fail(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.QUOTA_BUSY,
        'Đang có nhiều yêu cầu AI chạy cùng lúc, vui lòng thử lại sau ít giây.',
      )
    }

    try {
      return await this.#runChain(
        { ...command, messages, temperature },
        {
          userId,
          quota,
          receipt,
          promptTokens,
          maxTokens,
          receiptFor: (spent) =>
            quota && !command.retryOf ? issueReceipt(secret, userId, spent, hash) : undefined,
        },
        release,
        sink,
      )
    } finally {
      await release()
    }
  }

  async #runChain(
    command: ChatCommand,
    billing: Billing,
    release: () => Promise<void>,
    sink?: ChatSink,
  ): Promise<ChatReply> {
    const { userId, quota, promptTokens, maxTokens } = billing
    const webSearch = command.webSearch === true

    let providers
    try {
      providers = await this.providers.load()
    } catch (error) {
      this.#logger.error(error instanceof Error ? error.message : String(error))
      throw new InternalServerErrorException({
        code: ErrorCode.AI_UNAVAILABLE,
        message: 'Cấu hình nhà cung cấp AI không hợp lệ.',
      })
    }
    if (webSearch && !providers.providers.deepseek) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Tìm trên web chưa được bật trên máy chủ.',
      })
    }
    const targets = buildTargets(providers, { webSearch, strong: command.strong === true })
    if (targets.length === 0) {
      throw new InternalServerErrorException({
        code: ErrorCode.AI_UNAVAILABLE,
        message: 'Máy chủ chưa cấu hình nhà cung cấp AI nào.',
      })
    }

    const timeoutMs = this.config.get('LLM_TIMEOUT_MS', { infer: true })
    const strongFactor = this.config.get('STRONG_POINT_FACTOR', { infer: true })
    const logs: Promise<void>[] = []
    // tokens a provider billed for an attempt that gave the user nothing: charged only beyond the free allowance
    let wasted = 0

    const log = (target: Target, startedAt: number, error: string | null, usage?: Usage) => {
      logs.push(
        this.calls
          .log({
            userId,
            model: target.model,
            provider: target.provider,
            ok: error === null,
            error,
            promptTokens: usage?.prompt_tokens ?? usage?.input_tokens ?? 0,
            completionTokens: usage?.completion_tokens ?? usage?.output_tokens ?? 0,
            cost: costFromUsage(usage, target.provider),
            ms: Date.now() - startedAt,
          })
          .catch(() => {}),
      )
    }

    for (const [index, target] of targets.entries()) {
      const factor = target.strong ? strongFactor : 1
      const bill = (usage: Usage | undefined, output: string) =>
        billOf(usage, output, { promptTokens, maxTokens, factor })
      const opencode = target.provider === 'opencode'
      const anthropic = target.provider === 'anthropic'
      const provider = anthropic ? this.anthropic : this.openAiCompatible
      const startedAt = Date.now()
      let reasoningEffort = command.reasoningEffort
      let lastError: string | null = null

      for (let attempt = 0; attempt < (anthropic ? 1 : 2); attempt++) {
        if (attempt > 0 || index > 0) sink?.retry()
        let result
        try {
          result = await provider.complete({
            target,
            messages: command.messages,
            maxTokens,
            temperature: command.temperature,
            reasoningEffort,
            timeoutMs,
            stream: sink && !webSearch ? this.#streamTo(sink) : undefined,
          })
        } catch (error) {
          const failure = this.#classify(error, target.model, timeoutMs, attempt < 1)
          lastError = failure.message
          if (!failure.retry) break
          await sleep(RETRY_WAIT_MS)
          continue
        }

        if (result.broken) {
          // the provider still bills what it generated; estimate it from what arrived
          if (await this.#beyondFreeFails(userId)) {
            wasted +=
              promptTokens + Math.ceil((result.content.length + result.reasoning.length) / 3)
          }
          lastError = `${target.model}: luồng trả lời bị ngắt giữa chừng`
          break
        }

        if (result.content.trim()) {
          log(target, startedAt, null, result.usage)
          const spent = bill(result.usage, result.content + result.reasoning)
          const [after] = await Promise.all([
            this.#settle(billing, spent, wasted),
            release(),
            ...logs,
          ])
          return {
            content: result.content,
            reasoning: result.reasoning,
            usage: result.usage ?? null,
            finishReason: result.finishReason,
            quota: after,
            receipt: billing.receiptFor(spent),
            ...(result.citations ? { citations: result.citations } : {}),
          }
        }

        lastError = `${target.model}: empty content (finish_reason=${result.finishReason})`
        if (!anthropic && (await this.#beyondFreeFails(userId))) {
          wasted += bill(result.usage, result.reasoning)
        }
        // Out of tokens while thinking: the same model with the same cap would only do it again
        if (result.finishReason === 'length' && !opencode) break
        if (attempt === 0 && opencode) reasoningEffort = 'medium'
      }

      if (lastError) log(target, startedAt, lastError)
      if (index < targets.length - 1) await sleep(NEXT_MODEL_WAIT_MS)
    }

    await Promise.all([wasted ? this.quotas.addUsage(userId, wasted, quota) : null, ...logs])
    throw new BadGatewayException({
      code: ErrorCode.AI_UNAVAILABLE,
      message: 'Các model AI đều không phản hồi. Vui lòng thử lại sau.',
    })
  }

  /** Reasoning arrives a few characters at a time; it is sent in batches, and always before the answer text that follows it */
  #streamTo(sink: ChatSink): LlmStream {
    let thinking = ''
    let sentAt = 0
    return {
      onOpen: () => sink.start(),
      onDelta: ({ content, reasoning }) => {
        if (reasoning) {
          thinking += reasoning
          if (Date.now() - sentAt > THINK_BATCH_MS) {
            sentAt = Date.now()
            sink.think(thinking)
            thinking = ''
          }
        }
        if (content) {
          if (thinking) sink.think(thinking)
          thinking = ''
          sink.delta(content)
        }
      },
    }
  }

  async #settle(billing: Billing, spent: number, wasted: number): Promise<Quota | null> {
    const { userId, quota, receipt } = billing
    const refunded = receipt
      ? await this.quotas.refundReceipt(userId, receipt, quota, spent)
      : quota
    return this.quotas.addUsage(userId, spent + wasted, refunded)
  }

  /** false when the allowance cannot be read: the user is not charged for what we cannot verify */
  async #beyondFreeFails(userId: string): Promise<boolean> {
    try {
      return (
        (await this.calls.countRecentFreeFails(userId, EMPTY_FREE_PER_DAY)) >= EMPTY_FREE_PER_DAY
      )
    } catch {
      return false
    }
  }

  /** A rejected key moves on to the next model; 429 and 5xx get one more try on the same model */
  #classify(
    error: unknown,
    model: string,
    timeoutMs: number,
    canRetry: boolean,
  ): { message: string; retry: boolean } {
    if (error instanceof LlmUpstreamError) {
      if (error.status === 401 || error.status === 403) {
        return { message: `${model}: API key bị từ chối (${error.status})`, retry: false }
      }
      return {
        message: `${model}: upstream ${error.status}`,
        retry: canRetry && (error.status === 429 || error.status >= 500),
      }
    }
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return {
        message: `${model}: quá thời gian chờ ${Math.round(timeoutMs / 1000)}s`,
        retry: false,
      }
    }
    const detail = error instanceof Error ? error.message.slice(0, 200) : String(error)
    return { message: `${model}: ${detail}`, retry: false }
  }
}
