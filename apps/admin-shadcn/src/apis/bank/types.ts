import type { paths } from '@workspace/api-types'
import type { FetchOptions } from 'openapi-fetch'

export type BankOverridesInput = FetchOptions<paths['/api/bank/overrides']['get']>
