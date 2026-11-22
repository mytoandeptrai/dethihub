import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { Env } from '@/app/config/env.schema'
import type { AlertNotifierPort } from '@/modules/alerts/application/ports/alert-notifier.port'

const TIMEOUT_MS = 10_000

@Injectable()
export class TelegramNotifierAdapter implements AlertNotifierPort {
  readonly #logger = new Logger(TelegramNotifierAdapter.name)

  constructor(private readonly config: ConfigService<Env, true>) {}

  async send(text: string): Promise<boolean> {
    const token = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true })
    const chatId = this.config.get('TELEGRAM_CHAT_ID', { infer: true })
    if (!token || !chatId) return false
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!response.ok) this.#logger.warn(`telegram answered ${response.status}`)
      return response.ok
    } catch (error) {
      // the error text can carry the bot URL, so only the failure kind is logged
      this.#logger.warn(`telegram send failed: ${error instanceof Error ? error.name : 'unknown'}`)
      return false
    }
  }
}
