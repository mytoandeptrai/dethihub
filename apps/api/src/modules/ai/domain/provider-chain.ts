export type ProviderName =
  | 'deepseek'
  | 'gemini'
  | 'opencode'
  | 'fosta'
  | 'anyrouter'
  | 'nightrouter'
  | 'anthropic'

export interface ProviderSettings {
  apiKey: string
  baseUrl: string
  model: string
}

export interface ProviderConfig {
  providers: Partial<Record<ProviderName, ProviderSettings>>
  opencodeFallbackModel?: string
  deepseekStrongModel?: string
}

/** One model attempt in the chain */
export interface Target extends ProviderSettings {
  provider: ProviderName
  /** forward reasoning_effort */
  effort?: boolean
  /** call with stream:true and collect the SSE (the gateway cuts plain calls after 60 s) */
  stream?: boolean
  /** DeepSeek web-search tool, thinking disabled */
  search?: boolean
  /** priced at STRONG_POINT_FACTOR */
  strong?: boolean
}

/** Non-2xx answer from a provider */
export class LlmUpstreamError extends Error {
  constructor(readonly status: number) {
    super(`upstream ${status}`)
  }
}

/** The cost-ordered chain: DeepSeek, Gemini, opencode (+fallback model), FOSTA, AnyRouter, NightRouter, Claude last. Providers without a key are skipped */
export function buildTargets(
  config: ProviderConfig,
  options: { webSearch: boolean; strong: boolean },
): Target[] {
  const { providers: p } = config

  if (options.webSearch) {
    return p.deepseek ? [{ provider: 'deepseek', ...p.deepseek, search: true }] : []
  }

  const targets: Target[] = []
  if (p.deepseek) targets.push({ provider: 'deepseek', ...p.deepseek, effort: true })
  if (p.gemini) targets.push({ provider: 'gemini', ...p.gemini })
  if (p.opencode) {
    for (const model of [p.opencode.model, config.opencodeFallbackModel]) {
      if (model && !targets.some((t) => t.model === model)) {
        targets.push({ provider: 'opencode', ...p.opencode, model })
      }
    }
  }
  if (p.fosta) targets.push({ provider: 'fosta', ...p.fosta })
  if (p.anyrouter) targets.push({ provider: 'anyrouter', ...p.anyrouter, stream: true })
  if (p.nightrouter) targets.push({ provider: 'nightrouter', ...p.nightrouter })
  if (p.anthropic) targets.push({ provider: 'anthropic', ...p.anthropic })

  if (options.strong && p.deepseek && config.deepseekStrongModel) {
    targets.unshift({
      provider: 'deepseek',
      ...p.deepseek,
      model: config.deepseekStrongModel,
      effort: true,
      strong: true,
    })
  }
  return targets
}
