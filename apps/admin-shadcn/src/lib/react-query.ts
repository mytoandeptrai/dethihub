import { isServer, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { t } from '@/i18n/translate'

function onError(error: Error) {
  toast.error(error.message || t('common.requestError'))
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (isServer) return createQueryClient()
  browserQueryClient ??= createQueryClient()
  return browserQueryClient
}
