import { setTimeout as sleep } from 'node:timers/promises'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { ImageProviderNotConfiguredError } from '@/modules/media/application/ports/image-generator.port'
import { withLanguageNote } from '@/modules/media/domain/policies/image-request.policy'
import { assertPublicHttpsUrl } from '@/modules/media/infrastructure/safe-url'

import type { Env } from '@/app/config/env.schema'
import type {
  GeneratedImage,
  ImageGeneratorPort,
} from '@/modules/media/application/ports/image-generator.port'

interface ProviderConfig {
  baseUrl: string
  apiKey: string
  model: string
}

interface ImageItem {
  url?: string
  b64_json?: string
}

interface UpstreamBody {
  id?: string
  status?: string
  data?: ImageItem[]
  error?: { message?: string } | string
}

/** Agnes answers with the picture in the same request; the second provider answers with a job to poll */
const AGNES = { baseUrl: 'https://apihub.agnes-ai.com/v1', model: 'agnes-image-2.5-flash' }
const JOB_PROVIDER = { baseUrl: 'https://api.xkiro.com/v1', model: 'sensenova/sensenova-u1.5-lite' }

const START_TIMEOUT_MS = 120_000
const POLL_MS = 1500
const POLL_DEADLINE_MS = 240_000
const DOWNLOAD_TIMEOUT_MS = 30_000
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

const upstreamMessage = (status: number, body: UpstreamBody): string => {
  const { error } = body
  if (typeof error === 'string') return error
  return error?.message ?? `HTTP ${status}`
}

@Injectable()
export class ImageGeneratorAdapter implements ImageGeneratorPort {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async generate(prompt: string): Promise<GeneratedImage> {
    const providers = this.#providers()
    if (providers.length === 0) throw new ImageProviderNotConfiguredError()

    const errors: string[] = []
    for (const provider of providers) {
      try {
        return await this.#generateWith(provider, withLanguageNote(prompt))
      } catch (error) {
        errors.push(`${provider.model}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    throw new Error(errors.join(' | '))
  }

  #providers(): ProviderConfig[] {
    const get = <K extends keyof Env>(key: K) => this.config.get(key, { infer: true })
    const providers: ProviderConfig[] = []
    const agnesKey = get('AGNES_API_KEY')
    if (agnesKey) {
      providers.push({
        baseUrl: (get('AGNES_BASE_URL') ?? AGNES.baseUrl).replace(/\/+$/, ''),
        apiKey: agnesKey,
        model: get('AGNES_IMAGE_MODEL') ?? AGNES.model,
      })
    }
    const jobKey = get('IMAGE_API_KEY')
    if (jobKey) {
      providers.push({
        baseUrl: (get('IMAGE_BASE_URL') ?? JOB_PROVIDER.baseUrl).replace(/\/+$/, ''),
        apiKey: jobKey,
        model: get('IMAGE_MODEL') ?? JOB_PROVIDER.model,
      })
    }
    return providers
  }

  async #generateWith(provider: ProviderConfig, prompt: string): Promise<GeneratedImage> {
    await assertPublicHttpsUrl(provider.baseUrl)
    const headers = {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    }
    const start = await this.#json(
      `${provider.baseUrl}/images/generations`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: provider.model, prompt, n: 1, size: '1024x1024' }),
      },
      START_TIMEOUT_MS,
    )
    const direct = await this.#toImage(start.data?.[0])
    if (direct) return direct

    if (!start.id) throw new Error('no picture and no job id in the answer')
    const deadline = Date.now() + POLL_DEADLINE_MS
    while (Date.now() < deadline) {
      await sleep(POLL_MS)
      const job = await this.#json(
        `${provider.baseUrl}/images/generations/${encodeURIComponent(start.id)}`,
        { headers },
      )
      if (job.status === 'failed' || job.status === 'error') throw new Error('image job failed')
      if (job.status === 'succeeded' || job.status === 'completed') {
        const image = await this.#toImage(job.data?.[0])
        if (image) return image
        throw new Error('image job finished without a picture')
      }
    }
    throw new Error('image job timed out')
  }

  async #json(url: string, init: RequestInit, timeoutMs = 15_000): Promise<UpstreamBody> {
    const response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const body = (await response.json().catch(() => ({}))) as UpstreamBody
    if (!response.ok) throw new Error(upstreamMessage(response.status, body))
    return body
  }

  async #toImage(item: ImageItem | undefined): Promise<GeneratedImage | null> {
    if (item?.b64_json) return { buffer: Buffer.from(item.b64_json, 'base64'), mime: 'image/png' }
    if (!item?.url) return null

    // The URL comes from the provider: only public https addresses, and no redirects into the internal network
    const url = await assertPublicHttpsUrl(item.url)
    const response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`picture download failed (${response.status})`)
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length === 0) throw new Error('empty picture')
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error('picture larger than 8 MB')
    return { buffer, mime: response.headers.get('content-type')?.split(';')[0] ?? 'image/png' }
  }
}
