import { HttpException } from '@nestjs/common'

import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { ChatSink } from '@/modules/ai/application/services/chat.service'
import type { Response } from 'express'

const PING_MS = 15_000

/** Server-Sent Events writer for a chat answer. A client that goes away only stops the writing: the call is still read to the end and settled */
export class ChatEventStream implements ChatSink {
  #started = false
  #ping: ReturnType<typeof setInterval> | undefined

  constructor(private readonly response: Response) {}

  get started(): boolean {
    return this.#started
  }

  start(): void {
    if (this.#started) return
    this.#started = true
    this.response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    this.response.flushHeaders()
    // a model that is still thinking sends nothing; keep proxies and mobile networks from dropping the connection
    this.#ping = setInterval(() => this.#write(': ping\n\n'), PING_MS)
  }

  think(text: string): void {
    this.#event({ type: 'think', d: text })
  }

  delta(text: string): void {
    this.#event({ type: 'delta', c: text })
  }

  retry(): void {
    this.#event({ type: 'retry' })
  }

  done(reply: object): void {
    this.#event({ type: 'done', ...reply })
  }

  fail(error: unknown): void {
    const status = error instanceof HttpException ? error.getStatus() : 500
    const body = error instanceof HttpException ? error.getResponse() : undefined
    const detail = body && typeof body === 'object' ? body : {}
    this.#event({
      type: 'error',
      status,
      code: (detail as { code?: string }).code ?? ErrorCode.INTERNAL_SERVER_ERROR,
      detail:
        (detail as { message?: string }).message ??
        'Máy chủ gặp lỗi không mong muốn, vui lòng thử lại.',
    })
  }

  close(): void {
    clearInterval(this.#ping)
    if (this.#started && !this.response.writableEnded) this.response.end()
  }

  #event(payload: object): void {
    this.#write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  #write(chunk: string): void {
    if (!this.#started || this.response.writableEnded || this.response.destroyed) return
    try {
      this.response.write(chunk)
    } catch {
      // the client has gone away
    }
  }
}
