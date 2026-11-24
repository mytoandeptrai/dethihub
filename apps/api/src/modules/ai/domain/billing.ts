export interface ChatMessage {
  role: string
  content: string
}

export interface Usage {
  prompt_tokens?: number
  completion_tokens?: number
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  prompt_cache_hit_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number }
  opencode?: { list_cost?: unknown }
}

export const MAX_OUTPUT_TOKENS = 32_000
export const MIN_OUTPUT_TOKENS = 256
export const MAX_PROMPT_TOKENS = 200_000
/** failed calls per user per 24 h that cost nothing; from the next one they are charged as usual */
export const EMPTY_FREE_PER_DAY = 3

/** USD per million tokens: [input, cached input, output] */
const PRICE: Record<string, [number, number, number]> = {
  deepseek: [0.27, 0.027, 1.1],
  gemini: [0.3, 0.03, 2.5],
  opencode: [0.27, 0.27, 1.1],
  fosta: [0.27, 0.27, 1.1],
  anyrouter: [0.27, 0.27, 1.1],
  nightrouter: [0.27, 0.27, 1.1],
  anthropic: [3, 0.3, 15],
  numes: [0, 0, 0],
  crowllm: [0, 0, 0],
}

/** ~3 characters per token for Vietnamese and JSON alike, plus a per-message overhead; errs high on purpose */
export function estimatePromptTokens(messages: unknown[]): number {
  let chars = 0
  for (const message of messages) {
    chars += typeof message === 'string' ? message.length : JSON.stringify(message ?? '').length
  }
  return Math.ceil(chars / 3) + messages.length * 8
}

const cachedTokens = (usage: Usage | undefined): number =>
  Math.max(
    0,
    Number(usage?.prompt_cache_hit_tokens ?? usage?.prompt_tokens_details?.cached_tokens) || 0,
  )

/** Real usage when reported (cached input costs ~1/10); otherwise the ceiling: the prompt plus all the output the call was allowed */
export function billOf(
  usage: Usage | undefined,
  output: string,
  ctx: { promptTokens: number; maxTokens: number; factor: number },
): number {
  const total = Number(usage?.total_tokens)
  if (Number.isFinite(total) && total > 0) {
    const cached = Math.min(cachedTokens(usage), total)
    return Math.max(1, Math.ceil((total - cached * 0.9) * ctx.factor))
  }
  return Math.ceil(
    (ctx.promptTokens + Math.max(ctx.maxTokens, Math.ceil(output.length / 3))) * ctx.factor,
  )
}

/** Cost in USD for the call log: the gateway's own figure when present, otherwise tokens x price table */
export function costFromUsage(usage: Usage | undefined, provider: string): number | null {
  const reported = usage?.opencode?.list_cost
  if (typeof reported === 'number' && Number.isFinite(reported)) return reported

  const input = Number(usage?.prompt_tokens ?? usage?.input_tokens) || 0
  const output = Number(usage?.completion_tokens ?? usage?.output_tokens) || 0
  const price = Object.hasOwn(PRICE, provider) ? PRICE[provider] : undefined
  if (input + output <= 0 || !price) return null

  const cached = Math.min(input, cachedTokens(usage))
  return ((input - cached) * price[0] + cached * price[1] + output * price[2]) / 1_000_000
}
