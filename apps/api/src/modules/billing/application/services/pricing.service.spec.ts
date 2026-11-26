import { createMock } from '@golevelup/ts-vitest'
import { DEFAULT_PRICING } from '@workspace/core'
import { describe, expect, it } from 'vitest'

import { PricingService } from '@/modules/billing/application/services/pricing.service'

import type { AppSettingsReaderPort } from '@/shared-kernel/application/ports/app-settings-reader.port'

describe('pricingService', () => {
  it('reads and merges the stored price list through the shared port', async () => {
    const settings = createMock<AppSettingsReaderPort>()
    const stored = { packs: [DEFAULT_PRICING.packs[0]], version: 'test' }
    settings.get.mockResolvedValue(stored)

    expect(await new PricingService(settings).get()).toEqual({ ...DEFAULT_PRICING, ...stored })
    expect(settings.get).toHaveBeenCalledWith('pricing')
  })

  it.each([undefined, {}, { packs: [] }])('keeps the defaults for %j', async (stored) => {
    const settings = createMock<AppSettingsReaderPort>()
    settings.get.mockResolvedValue(stored)

    expect(await new PricingService(settings).get()).toEqual(DEFAULT_PRICING)
  })

  it('propagates settings read failures', async () => {
    const settings = createMock<AppSettingsReaderPort>()
    const error = new Error('settings unavailable')
    settings.get.mockRejectedValue(error)

    await expect(new PricingService(settings).get()).rejects.toBe(error)
  })
})
