import type { ChatMessage, Usage } from '@/modules/ai/domain/billing'
import type { Target } from '@/modules/ai/domain/provider-chain'

/** Live view of a streamed answer; only OpenAI-compatible providers stream */
export interface LlmStream {
  /** the provider answered 200 and the body is about to be read */
  onOpen(): void
  onDelta(delta: { content: string; reasoning: string }): void
}

export interface LlmRequest {
  target: Target
  messages: ChatMessage[]
  /** data URLs attached to the last user message */
  images?: string[]
  maxTokens: number
  temperature?: number
  reasoningEffort?: string
  timeoutMs: number
  signal?: AbortSignal
  /** actual answer text, excluding reasoning and whitespace */
  onFirstAnswer?: () => void
  stream?: LlmStream
}

export interface Citation {
  url: string
  title: string
}

export interface LlmResult {
  content: string
  reasoning: string
  usage?: Usage
  finishReason: string
  citations?: Citation[]
  /** the stream ended abnormally (network, timeout): the fields hold what arrived */
  broken?: boolean
}

export interface LlmProviderPort {
  /** throws LlmUpstreamError on a non-2xx answer; any other error means the call did not complete (timeout, network) */
  complete(request: LlmRequest): Promise<LlmResult>
}

export const OPENAI_COMPATIBLE_PROVIDER = Symbol('OPENAI_COMPATIBLE_PROVIDER')
export const ANTHROPIC_PROVIDER = Symbol('ANTHROPIC_PROVIDER')
