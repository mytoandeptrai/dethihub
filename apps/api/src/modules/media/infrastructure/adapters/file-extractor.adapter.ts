import { extname } from 'node:path'
import { Worker } from 'node:worker_threads'

import { Injectable, Logger } from '@nestjs/common'

import {
  EXTRACT_DIRECT_URL,
  extractFileDirect,
} from '@/modules/media/infrastructure/extractors/extract-direct'

import type {
  ExtractedFile,
  FileExtractorPort,
} from '@/modules/media/application/ports/file-extractor.port'

const HEAP_MB = 384
const YOUNG_HEAP_MB = 48
const TIMEOUT_MS = 25_000
const NEEDS_WORKER = new Set(['.docx', '.xlsx', '.pptx', '.pdf'])

// Loads the extraction module inside the worker (CommonJS eval context) and reports back
const WORKER_CODE =
  "const { workerData, parentPort } = require('node:worker_threads');" +
  'import(workerData.url).then(async (m) => {' +
  ' parentPort.postMessage({ ok: await m.extractFileDirect(workerData.name, Buffer.from(workerData.data), workerData.marks) })' +
  ' }, (e) => parentPort.postMessage({ boot: String((e && e.message) || e) }))'

interface WorkerOutcome {
  ok?: ExtractedFile
  /** The worker could not start (unusual environment): read in-process instead */
  boot?: string
  error?: string
}

@Injectable()
export class FileExtractorAdapter implements FileExtractorPort {
  readonly #logger = new Logger(FileExtractorAdapter.name)

  /**
   * Binary files are read in a worker with a memory and time cap: a hostile file that bloats the
   * parser or runs forever only kills the worker and the call still returns a plain error.
   */
  async extract(name: string, data: Buffer, marks: boolean): Promise<ExtractedFile> {
    if (!NEEDS_WORKER.has(extname(name).toLowerCase())) return extractFileDirect(name, data, marks)

    const outcome = await this.#runInWorker(name, data, marks)
    if (outcome.ok) return outcome.ok
    if (outcome.boot !== undefined) {
      this.#logger.warn(
        `extract worker did not start, reading in-process: ${outcome.boot.slice(0, 300)}`,
      )
      return extractFileDirect(name, data, marks)
    }
    return {
      name,
      kind: 'unsupported',
      text: '',
      warning: `Không đọc được tệp: ${outcome.error ?? 'lỗi không rõ.'}`,
    }
  }

  #spawn(name: string, data: Buffer, marks: boolean): Worker | Error {
    try {
      return new Worker(WORKER_CODE, {
        eval: true,
        workerData: { url: EXTRACT_DIRECT_URL, name, data: new Uint8Array(data), marks },
        resourceLimits: {
          maxOldGenerationSizeMb: HEAP_MB,
          maxYoungGenerationSizeMb: YOUNG_HEAP_MB,
        },
      })
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error))
    }
  }

  async #runInWorker(name: string, data: Buffer, marks: boolean): Promise<WorkerOutcome> {
    const worker = this.#spawn(name, data, marks)
    if (worker instanceof Error) return { boot: worker.message }
    let finish!: (outcome: WorkerOutcome) => void
    const result = new Promise<WorkerOutcome>((resolve) => {
      finish = resolve
    })
    let settled = false
    const done = (outcome: WorkerOutcome) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      finish(outcome)
      void worker.terminate()
    }
    const timer = setTimeout(
      () => done({ error: 'tệp quá nặng hoặc có cấu trúc bất thường.' }),
      TIMEOUT_MS,
    )
    worker.once('message', (message: WorkerOutcome) => done(message))
    worker.once('error', (error: Error & { code?: string }) => {
      if (error.code === 'ERR_WORKER_OUT_OF_MEMORY') {
        done({ error: 'tệp quá nặng, không đọc được.' })
      } else if (error.code === 'ERR_WORKER_INIT_FAILED') {
        done({ boot: error.message })
      } else {
        done({ error: 'tiến trình đọc tệp gặp lỗi.' })
      }
    })
    worker.once('exit', (code) =>
      done({ error: code ? 'tiến trình đọc tệp bị dừng.' : 'không nhận được kết quả.' }),
    )
    return result
  }
}
