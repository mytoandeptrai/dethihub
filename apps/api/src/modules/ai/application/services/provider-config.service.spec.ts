import { createMock } from '@golevelup/ts-vitest'
import { ConfigService } from '@nestjs/config'
import { describe, expect, it } from 'vitest'

import { envSchema } from '@/app/config/env.schema'
import { ProviderConfigService } from '@/modules/ai/application/services/provider-config.service'

import type { Env } from '@/app/config/env.schema'
import type { ProviderSettingsRepositoryPort } from '@/modules/ai/application/ports/provider-settings.repository.port'

function setup(env: Record<string, string> = {}) {
  const settings = createMock<ProviderSettingsRepositoryPort>()
  settings.findAll.mockResolvedValue([])
  const service = new ProviderConfigService(new ConfigService<Env, true>(env), settings)
  return { service, settings }
}

describe('providerConfigService fallback slots', () => {
  it.each([
    [undefined, 60_000],
    ['', 60_000],
    ['invalid', 60_000],
    ['0', 60_000],
    ['-1', 60_000],
    ['25', 25],
    ['120000', 120_000],
  ])('parses first-answer timeout %s as %s milliseconds', (value, expected) => {
    expect(envSchema.shape.LLM_FIRST_ANSWER_TIMEOUT_MS.parse(value)).toBe(expected)
  })
  it.each(['NUMES', 'CROWLLM', 'COARENA', 'VYCEAI'])(
    'validates and loads the %s environment slot',
    async (prefix) => {
      const values = {
        [`${prefix}_API_KEY`]: 'test-provider-key',
        [`${prefix}_BASE_URL`]: 'https://example.com/v1/',
        [`${prefix}_MODEL`]: 'test-model',
      }
      for (const [key, value] of Object.entries(values)) {
        expect(envSchema.shape[key as keyof typeof envSchema.shape]?.parse(value)).toBe(value)
      }
      const { service } = setup(values)
      expect((await service.load()).providers).toEqual({
        [prefix.toLowerCase()]: {
          apiKey: 'test-provider-key',
          baseUrl: 'https://example.com/v1',
          model: 'test-model',
        },
      })
    },
  )

  it('skips keyless slots while listing them in the admin settings with safe defaults', async () => {
    const { service } = setup()
    expect((await service.load()).providers).toEqual({})
    const views = await service.describe()
    expect(views.slice(-4).map((view) => view.provider)).toEqual([
      'numes',
      'crowllm',
      'coarena',
      'vyceai',
    ])
    expect(
      views.slice(-4).every((view) => view.keyMask === '' && view.model && view.endpoint),
    ).toBe(true)
    expect(views.at(-1)?.defaultModel).toBe('wave')
  })

  it('retains safe environment configuration if the settings store is unavailable', async () => {
    const { service, settings } = setup({ NUMES_API_KEY: 'test-provider-key' })
    settings.findAll.mockRejectedValue(new Error('settings unavailable'))
    expect((await service.load()).providers.numes?.apiKey).toBe('test-provider-key')
    expect(JSON.stringify(await service.describe())).not.toContain('test-provider-key')
  })
})
