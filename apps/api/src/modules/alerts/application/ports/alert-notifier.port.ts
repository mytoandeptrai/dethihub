export const ALERT_NOTIFIER = Symbol('ALERT_NOTIFIER')

export interface AlertNotifierPort {
  /** false when the message could not be delivered */
  send(text: string): Promise<boolean>
}
