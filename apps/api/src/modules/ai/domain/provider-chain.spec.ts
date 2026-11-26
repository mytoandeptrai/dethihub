import { describe, expect, it } from 'vitest'

import { costFromUsage } from '@/modules/ai/domain/billing'
import { buildTargets } from '@/modules/ai/domain/provider-chain'

import type { ProviderName } from '@/modules/ai/domain/provider-chain'

const order: ProviderName[] = [
  'deepseek',
  'gemini',
  'opencode',
  'fosta',
  'anyrouter',
  'nightrouter',
  'anthropic',
  'coarena',
  'numes',
  'crowllm',
  'vyceai',
]

describe('ai provider chain', () => {
  it('preserves the existing order and appends the four fallback slots', () => {
    const providers = Object.fromEntries(
      order.map((provider) => [
        provider,
        {
          apiKey: 'test-key',
          baseUrl: 'https://example.com/v1',
          model: provider,
        },
      ]),
    )
    const targets = buildTargets(
      { providers, opencodeFallbackModel: 'opencode-fallback' },
      {
        webSearch: false,
        strong: false,
      },
    )
    expect(targets.map((target) => target.provider)).toEqual([
      ...order.slice(0, 3),
      'opencode',
      ...order.slice(3),
    ])
    expect(targets.at(-1)?.model).toBe('vyceai')
  })

  it('skips absent slots, including an entirely unconfigured chain', () => {
    expect(buildTargets({ providers: {} }, { webSearch: false, strong: false })).toEqual([])
    expect(
      buildTargets(
        {
          providers: {
            crowllm: { apiKey: 'test-key', baseUrl: 'https://example.com/v1', model: 'free' },
          },
        },
        { webSearch: false, strong: false },
      ).map((target) => target.provider),
    ).toEqual(['crowllm'])
  })

  it.each(['coarena', 'numes', 'crowllm', 'vyceai'] as const)(
    'uses low-effort streaming for %s even without a client stream',
    (provider) => {
      const targets = buildTargets(
        {
          providers: {
            [provider]: { apiKey: 'key', baseUrl: 'https://example.com', model: 'free' },
          },
        },
        { webSearch: false, strong: false },
      )
      expect(targets[0]).toMatchObject({ effort: true, reasoningEffort: 'low', stream: true })
    },
  )

  it('retains the DeepSeek-only web-search contract', () => {
    expect(
      buildTargets(
        {
          providers: {
            numes: { apiKey: 'test-key', baseUrl: 'https://example.com/v1', model: 'free' },
          },
        },
        { webSearch: true, strong: false },
      ),
    ).toEqual([])
  })

  it.each(['numes', 'crowllm'])('estimates the default free %s slot at zero cost', (provider) => {
    expect(costFromUsage({ prompt_tokens: 100, completion_tokens: 50 }, provider)).toBe(0)
  })

  it.each(['coarena', 'vyceai'])('does not invent unpublished %s prices', (provider) => {
    expect(costFromUsage({ prompt_tokens: 100, completion_tokens: 50 }, provider)).toBeNull()
  })
})
