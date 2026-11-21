import { Inject, Injectable, Logger } from '@nestjs/common'

import { ADMIN_AUDIT_REPOSITORY } from '@/modules/access-control/application/ports/admin-audit.repository.port'

import type { AdminAuditRepositoryPort } from '@/modules/access-control/application/ports/admin-audit.repository.port'
import type { AdminAuditPort } from '@/shared-kernel/application/ports/admin-audit.port'

@Injectable()
export class AdminAuditAdapter implements AdminAuditPort {
  readonly #logger = new Logger(AdminAuditAdapter.name)

  constructor(@Inject(ADMIN_AUDIT_REPOSITORY) private readonly repository: AdminAuditRepositoryPort) {}

  async record(
    actorId: string | null,
    action: string,
    target: string,
    detail: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.repository.record({ adminId: actorId, action, target, detail })
    } catch (error) {
      this.#logger.error(`audit write failed for ${action}: ${String(error)}`)
    }
  }
}
