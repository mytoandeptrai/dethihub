import { Injectable } from '@nestjs/common'

import { AppSettingsService } from '@/modules/app-settings/application/services/app-settings.service'
import { resolveFeatures } from '@/modules/app-settings/domain/policies/settings.policy'
import { visibleAnnouncements } from '@/modules/app-settings/domain/policies/site-status.policy'

import type { SiteFeatures } from '@/modules/app-settings/domain/policies/settings.policy'
import type { SiteAnnouncement } from '@/modules/app-settings/domain/policies/site-status.policy'

export interface SiteStatus {
  features: SiteFeatures
  maintenance: { on: boolean; message: string; until: string | null }
  announcements: SiteAnnouncement[]
}

@Injectable()
export class SiteStatusService {
  constructor(private readonly settings: AppSettingsService) {}

  async get(): Promise<SiteStatus> {
    const [maintenance, announcements, features] = await Promise.all([
      this.settings.get<{ on?: boolean; message?: string; until?: string | null }>('maintenance'),
      this.settings.get<{ items?: SiteAnnouncement[] }>('announcements'),
      this.settings.get<Partial<SiteFeatures>>('features'),
    ])
    return {
      features: resolveFeatures(features),
      maintenance: {
        on: maintenance?.on === true,
        message: maintenance?.message ?? '',
        until: maintenance?.until ?? null,
      },
      announcements: visibleAnnouncements(announcements?.items ?? [], Date.now()),
    }
  }
}
