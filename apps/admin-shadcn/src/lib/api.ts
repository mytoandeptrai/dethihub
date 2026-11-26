import createQueryClient from 'openapi-react-query'

import { apiClient } from './api-client'

export const $api = createQueryClient(apiClient)
export type { paths, components } from '@workspace/api-types'
export { apiClient } from './api-client'
