import { Inject, Injectable } from '@nestjs/common'

import { AI_CALL_LOG_REPOSITORY } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import {
  ANTHROPIC_PROVIDER,
  OPENAI_COMPATIBLE_PROVIDER,
} from '@/modules/ai/application/ports/llm-provider.port'
import { ProviderConfigService } from '@/modules/ai/application/services/provider-config.service'
import { costFromUsage } from '@/modules/ai/domain/billing'
import {
  VISION_QUESTIONS_PROMPT,
  VISION_TEXT_PROMPT,
} from '@/modules/ai/infrastructure/prompts/vision'

import type { AiCallLogRepositoryPort } from '@/modules/ai/application/ports/ai-call-log.repository.port'
import type { LlmProviderPort } from '@/modules/ai/application/ports/llm-provider.port'
import type { Usage } from '@/modules/ai/domain/billing'
import type { ProviderName, Target } from '@/modules/ai/domain/provider-chain'
import type {
  VisionMode,
  VisionReaderPort,
  VisionResult,
} from '@/shared-kernel/application/ports/vision-reader.port'

/** Cheapest first; a model that cannot see images fails and the next provider is tried */
const ORDER: ProviderName[] = ['deepseek', 'gemini', 'opencode', 'fosta', 'anthropic']
const MAX_TOKENS = 16_000
const OPENCODE_MAX_TOKENS = 64_000
const TIMEOUT_MS = 150_000
const OPENCODE_TIMEOUT_MS = 240_000
/** Used when a provider reports no usage, so reading is never free */
const TOKENS_PER_IMAGE = 2000

@Injectable()
export class VisionReaderAdapter implements VisionReaderPort {
  constructor(
    private readonly providers: ProviderConfigService,
    @Inject(OPENAI_COMPATIBLE_PROVIDER) private readonly openai: LlmProviderPort,
    @Inject(ANTHROPIC_PROVIDER) private readonly anthropic: LlmProviderPort,
    @Inject(AI_CALL_LOG_REPOSITORY) private readonly calls: AiCallLogRepositoryPort,
  ) {}

  async read(userId: string, images: string[], mode: VisionMode): Promise<VisionResult> {
    const config = await this.providers.load()
    const targets: Target[] = []
    for (const name of ORDER) {
      const settings = config.providers[name]
      if (settings) targets.push({ provider: name, ...settings })
    }
    if (targets.length === 0) {
      throw new Error('No provider that can read images is configured')
    }

    const prompt = mode === 'text' ? VISION_TEXT_PROMPT : VISION_QUESTIONS_PROMPT
    const errors: string[] = []
    for (const target of targets) {
      const started = Date.now()
      const log = (ok: boolean, error: string | null, usage?: Usage) =>
        this.calls
          .log({
            userId,
            model: target.model,
            provider: target.provider,
            ok,
            error,
            promptTokens: Number(usage?.prompt_tokens ?? usage?.input_tokens) || 0,
            completionTokens: Number(usage?.completion_tokens ?? usage?.output_tokens) || 0,
            cost: costFromUsage(usage, target.provider),
            ms: Date.now() - started,
          })
          .catch(() => {})

      try {
        const opencode = target.provider === 'opencode'
        const provider = target.provider === 'anthropic' ? this.anthropic : this.openai
        const result = await provider.complete({
          target,
          messages: [{ role: 'user', content: prompt }],
          images,
          maxTokens: opencode ? OPENCODE_MAX_TOKENS : MAX_TOKENS,
          ...(opencode ? { reasoningEffort: 'max' } : {}),
          timeoutMs: opencode ? OPENCODE_TIMEOUT_MS : TIMEOUT_MS,
        })
        if (!result.content.trim()) throw new Error('empty answer')
        // A model that did not really see the images answers with no question at all
        if (mode === 'questions' && !/"prompt"\s*:\s*"[^"]/.test(result.content)) {
          throw new Error('no question read')
        }

        await log(true, null, result.usage)
        const usage = result.usage
        const tokens =
          Number(usage?.total_tokens) ||
          Number(usage?.prompt_tokens ?? 0) + Number(usage?.completion_tokens ?? 0) ||
          images.length * TOKENS_PER_IMAGE + Math.ceil(result.content.length / 3)
        return { content: result.content, model: target.model, tokens }
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 200) : String(error)
        errors.push(`${target.provider}: ${message}`)
        await log(false, message)
      }
    }
    throw new Error(`No provider could read the images. ${errors.join('; ')}`)
  }
}
