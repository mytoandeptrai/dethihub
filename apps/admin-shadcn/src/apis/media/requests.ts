import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export function extractFile(file: File, marks: boolean) {
  const form = new FormData()
  form.set('file', file)
  form.set('marks', String(marks))
  return mediaExtract({ body: { file: file.name, marks }, bodySerializer: () => form })
}

export async function mediaExtract(options: Types.MediaExtractInput) {
  const { data } = await apiClient.POST('/api/media/extract', options)
  return data!
}

export async function mediaReadPages(options: Types.MediaReadPagesInput) {
  const { data } = await apiClient.POST('/api/media/extract/vision', options)
  return data!
}

export async function mediaDrawImage(options: Types.MediaDrawImageInput) {
  const { data } = await apiClient.POST('/api/media/images', options)
  return data!
}

export async function mediaGetFigure(options: Types.MediaGetFigureInput) {
  const { data } = await apiClient.POST('/api/media/figures', options)
  return data!
}
