import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type MediaExtractInput = FetchOptions<paths['/api/media/extract']['post']>
export type MediaReadPagesInput = FetchOptions<paths['/api/media/extract/vision']['post']>
export type MediaDrawImageInput = FetchOptions<paths['/api/media/images']['post']>
export type MediaGetFigureInput = FetchOptions<paths['/api/media/figures']['post']>
