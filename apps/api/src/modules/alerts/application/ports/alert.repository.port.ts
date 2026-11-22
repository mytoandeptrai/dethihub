import type { AlertMetrics } from '@/modules/alerts/domain/policies/alert-rules.policy'

export const ALERT_REPOSITORY = Symbol('ALERT_REPOSITORY')

export interface AlertRepositoryPort {
  readMetrics(): Promise<AlertMetrics>
  /** last send time per alert kind */
  lastSent(): Promise<Map<string, Date>>
  markSent(kind: string, at: Date): Promise<void>
}
