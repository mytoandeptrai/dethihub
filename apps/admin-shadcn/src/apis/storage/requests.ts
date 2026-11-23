import { apiClient } from '@/lib/api-client'

import type * as Types from './types'

export function uploadImageFile(file: File, signal?: AbortSignal) {
  const form = new FormData()
  form.set('file', file)
  return storageUploadImage({ body: { file: file.name }, bodySerializer: () => form, signal })
}

export function uploadDocumentFile(file: File, subject?: string) {
  const form = new FormData()
  form.set('file', file)
  form.set('name', file.name)
  if (subject) form.set('subject', subject)
  return storageUploadDocument({ body: { file: file.name, name: file.name, subject }, bodySerializer: () => form })
}

export async function storageUploadImage(options: Types.StorageUploadImageInput) {
  const { data } = await apiClient.POST('/api/storage/images', options)
  return data!
}

export async function storageListDocuments(options: Types.StorageListDocumentsInput) {
  const { data } = await apiClient.GET('/api/storage/documents', options)
  return data!
}

export async function storageUploadDocument(options: Types.StorageUploadDocumentInput) {
  const { data } = await apiClient.POST('/api/storage/documents', options)
  return data!
}

export async function storageRemoveDocument(options: Types.StorageRemoveDocumentInput) {
  const { data } = await apiClient.DELETE('/api/storage/documents/{id}', options)
  return data!
}

export async function storageUsage(options: Types.StorageUsageInput) {
  const { data } = await apiClient.GET('/api/storage/usage', options)
  return data!
}
