import { createMock } from '@golevelup/ts-vitest'
import { describe, expect, it } from 'vitest'

import { AdminSettingsService } from '@/modules/app-settings/application/services/admin-settings.service'
import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import { SiteStatusService } from '@/modules/app-settings/application/services/site-status.service'
import { SiteStatusController } from '@/modules/app-settings/presentation/controllers/site-status.controller'

import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'

describe('resolved feature settings', () => {
  it.each([undefined, { word: false }])(
    'resolves stored %j for staff and public status',
    async (stored) => {
      const settings = createMock<AppSettingsService>()
      settings.get.mockImplementation(async (key) => (key === 'features' ? stored : undefined))
      const expected = { word: true, slide: true, board: true, online: true, ...stored }
      expect(
        (await new AdminSettingsService(settings, createMock<AdminAuditPort>()).getAll()).features,
      ).toEqual(expected)
      expect(
        (await new SiteStatusController(new SiteStatusService(settings)).get()).features,
      ).toEqual(expected)
    },
  )
  it('persists and audits valid writes but rejects invalid ones before persistence', async () => {
    const settings = createMock<AppSettingsService>()
    const audit = createMock<AdminAuditPort>()
    const service = new AdminSettingsService(settings, audit)
    const value = { word: false, slide: true, board: true, online: true }
    await expect(service.set('staff', 'features', { ...value, extra: true })).rejects.toThrow()
    expect(settings.set).not.toHaveBeenCalled()
    await expect(service.set('staff', 'features', value)).resolves.toEqual(value)
    expect(settings.set).toHaveBeenCalledWith('features', value)
    expect(audit.record).toHaveBeenCalledWith('staff', 'settings.set', 'features', value)
  })
})
