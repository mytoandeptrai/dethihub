import { t } from '@/i18n/translate'
import { ApiClientError, responseError } from '@/lib/api-error'

export type AccessTokenProvider = {
  getToken: () => Promise<string | null>
  refreshToken: () => Promise<string | null>
  onUnauthorized?: () => void
}

export function createAuthenticatedFetch(auth: AccessTokenProvider): typeof fetch {
  let refreshing: Promise<string | null> | null = null
  return async (input, init) => {
    const original = new Request(input, init)
    const token = await auth.getToken()
    if (token) original.headers.set('Authorization', 'Bearer ' + token)
    const replay = original.clone()
    try {
      let response = await globalThis.fetch(original)
      if (response.status === 401) {
        const current = await auth.getToken()
        let next = current && current !== token ? current : null
        if (!next) {
          refreshing ??= auth
            .refreshToken()
            .catch(() => null)
            .finally(() => {
              refreshing = null
            })
          next = await refreshing
        }
        if (next) {
          replay.headers.set('Authorization', 'Bearer ' + next)
          response = await globalThis.fetch(replay)
        }
      }
      if (response.status === 401) {
        const error = await responseError(response)
        auth.onUnauthorized?.()
        throw error
      }
      if (!response.ok) throw await responseError(response)
      return response
    } catch (error) {
      if (
        error instanceof ApiClientError ||
        (error instanceof Error && (error.name === 'AbortError' || 'digest' in error))
      )
        throw error
      throw new ApiClientError({ title: t('common.networkError'), status: 0 })
    }
  }
}
