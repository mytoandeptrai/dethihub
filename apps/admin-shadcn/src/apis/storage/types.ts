import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type StorageUploadImageInput = FetchOptions<paths['/api/storage/images']['post']>
export type StorageListDocumentsInput = FetchOptions<paths['/api/storage/documents']['get']>
export type StorageUploadDocumentInput = FetchOptions<paths['/api/storage/documents']['post']>
export type StorageRemoveDocumentInput = FetchOptions<paths['/api/storage/documents/{id}']['delete']>
export type StorageUsageInput = FetchOptions<paths['/api/storage/usage']['get']>
