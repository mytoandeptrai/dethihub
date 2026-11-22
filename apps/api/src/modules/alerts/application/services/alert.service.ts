import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron } from '@nestjs/schedule'

import { ALERT_NOTIFIER } from '@/modules/alerts/application/ports/alert-notifier.port'
import { ALERT_REPOSITORY } from '@/modules/alerts/application/ports/alert.repository.port'
import { evaluateAlerts } from '@/modules/alerts/domain/policies/alert-rules.policy'

import type { Env } from '@/app/config/env.schema'
import type { AlertNotifierPort } from '@/modules/alerts/application/ports/alert-notifier.port'
import type { AlertRepositoryPort } from '@/modules/alerts/application/ports/alert.repository.port'
import type { AlertThresholds } from '@/modules/alerts/domain/policies/alert-rules.policy'

const MINUTE_MS = 60_000

@Injectable()
export class AlertService {
  readonly #logger = new Logger(AlertService.name)
  readonly #enabled: boolean
  readonly #cooldownMs: number
  readonly #thresholds: AlertThresholds

  constructor(
    @Inject(ALERT_REPOSITORY) private readonly alerts: AlertRepositoryPort,
    @Inject(ALERT_NOTIFIER) private readonly notifier: AlertNotifierPort,
    config: ConfigService<Env, true>,
  ) {
    this.#enabled = Boolean(
      config.get('TELEGRAM_BOT_TOKEN', { infer: true }) &&
      config.get('TELEGRAM_CHAT_ID', { infer: true }),
    )
    this.#cooldownMs = config.get('ALERT_COOLDOWN_MIN', { infer: true }) * MINUTE_MS
    this.#thresholds = {
      signups1h: config.get('ALERT_SIGNUPS_1H', { infer: true }),
      aiErrorRate: config.get('ALERT_AI_ERR_RATE', { infer: true }),
      aiMinCalls: config.get('ALERT_AI_MIN_CALLS', { infer: true }),
      aiCostUsd: config.get('ALERT_AI_COST_USD', { infer: true }),
      maintenanceMinutes: config.get('ALERT_MAINTENANCE_MIN', { infer: true }),
    }
    if (!this.#enabled) {
      this.#logger.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set: alerts are off')
    }
  }

  @Cron('*/5 * * * *')
  async run(): Promise<void> {
    if (!this.#enabled) return
    try {
      await this.check(new Date())
    } catch (error) {
      this.#logger.error(`alert check failed: ${String(error)}`)
    }
  }

  /** Sends each active alert unless the same kind was already sent within the cooldown; returns the kinds sent */
  async check(now: Date): Promise<string[]> {
    const active = evaluateAlerts(await this.alerts.readMetrics(), this.#thresholds, now)
    if (active.length === 0) return []
    const lastSent = await this.alerts.lastSent()
    const sent: string[] = []
    for (const alert of active) {
      const previous = lastSent.get(alert.kind)
      if (previous && now.getTime() - previous.getTime() < this.#cooldownMs) continue
      if (!(await this.notifier.send(`⚠️ đề rõ\n${alert.text}`))) continue
      await this.alerts.markSent(alert.kind, now)
      sent.push(alert.kind)
    }
    return sent
  }
}
