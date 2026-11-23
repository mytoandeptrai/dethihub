import { createMock } from '@golevelup/ts-vitest'
import { describe, expect, it } from 'vitest'

import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import { MaintenanceService } from '@/modules/app-settings/application/services/maintenance.service'

import type { PlatformRoleLookupPort } from '@/shared-kernel/application/ports/platform-role-lookup.port'

describe('maintenanceService', () => {
  it('lets staff bypass maintenance using the role lookup port', async () => {
    const settings = createMock<AppSettingsService>()
    const roles = createMock<PlatformRoleLookupPort>()
    settings.get.mockResolvedValue({ on: true, message: 'Maintenance' })
    roles.getRole.mockResolvedValue('admin')

    expect(await new MaintenanceService(settings, roles).blockMessage('staff')).toBeNull()
    expect(roles.getRole).toHaveBeenCalledWith('staff')
  })

  it('blocks an account without a platform role', async () => {
    const settings = createMock<AppSettingsService>()
    const roles = createMock<PlatformRoleLookupPort>()
    settings.get.mockResolvedValue({ on: true, message: ' Maintenance ' })
    roles.getRole.mockResolvedValue(null)

    expect(await new MaintenanceService(settings, roles).blockMessage('guest')).toBe('Maintenance')
  })

  it('keeps maintenance active when role lookup fails', async () => {
    const settings = createMock<AppSettingsService>()
    const roles = createMock<PlatformRoleLookupPort>()
    settings.get.mockResolvedValue({ on: true })
    roles.getRole.mockRejectedValue(new Error('roles unavailable'))

    expect(await new MaintenanceService(settings, roles).blockMessage('guest')).toBe(
      'Ứng dụng đang bảo trì, vui lòng quay lại sau.',
    )
  })

  it('does not check roles when maintenance is absent', async () => {
    const settings = createMock<AppSettingsService>()
    const roles = createMock<PlatformRoleLookupPort>()
    settings.get.mockResolvedValue(undefined)

    expect(await new MaintenanceService(settings, roles).blockMessage(undefined)).toBeNull()
    expect(roles.getRole).not.toHaveBeenCalled()
  })

  it('keeps the existing fail-open behavior for an unreadable maintenance setting', async () => {
    const settings = createMock<AppSettingsService>()
    const roles = createMock<PlatformRoleLookupPort>()
    settings.get.mockRejectedValue(new Error('settings unavailable'))

    expect(await new MaintenanceService(settings, roles).blockMessage('user')).toBeNull()
  })
})
