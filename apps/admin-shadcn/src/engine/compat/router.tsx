'use client'

import NextLink from 'next/link'
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { mapLegacyPath } from '@/config/legacy-paths'

import type { ComponentProps } from 'react'

export type To = string | { pathname?: string; search?: string; hash?: string }
type Options = { replace?: boolean; state?: unknown }
const hrefOf = (to: To) =>
  mapLegacyPath(
    typeof to === 'string' ? to : (to.pathname ?? '') + (to.search ?? '') + (to.hash ?? ''),
  )
const subscribe = (notify: () => void) => {
  window.addEventListener('popstate', notify)
  window.addEventListener('engine-navigation', notify)
  return () => {
    window.removeEventListener('popstate', notify)
    window.removeEventListener('engine-navigation', notify)
  }
}

export function useNavigate() {
  const router = useRouter()
  const pathname = usePathname()
  return useCallback(
    (to: To | number, options: Options = {}) => {
      if (typeof to === 'number') {
        window.history.go(to)
        return
      }
      const href = to === '.' ? pathname + window.location.search : hrefOf(to)
      const state = { ...window.history.state, __engine: options.state ?? null }
      if (to === '.') window.history.replaceState(state, '', href)
      else {
        if (options.replace) router.replace(href)
        else router.push(href)
        window.history.replaceState(state, '')
      }
      window.dispatchEvent(new Event('engine-navigation'))
    },
    [router, pathname],
  )
}

export function Link({
  to,
  replace,
  state,
  onClick,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & { to: To; replace?: boolean; state?: unknown }) {
  const navigate = useNavigate()
  return (
    <NextLink
      {...props}
      href={hrefOf(to)}
      replace={replace}
      onClick={(event) => {
        onClick?.(event)
        if (
          state !== undefined &&
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          (!props.target || props.target === '_self')
        ) {
          event.preventDefault()
          navigate(to, { replace, state })
        }
      }}
    />
  )
}

export function useLocation() {
  const pathname = usePathname()
  const search = useNextSearchParams().toString()
  const state = useSyncExternalStore(
    subscribe,
    () => window.history.state?.__engine ?? null,
    () => null,
  )
  return {
    pathname,
    search: search ? '?' + search : '',
    hash: typeof window === 'undefined' ? '' : window.location.hash,
    state,
    key: pathname + search,
  }
}

export function useParams<T extends string | Record<string, string | undefined> = string>() {
  return useNextParams() as Readonly<T extends string ? Record<T, string | undefined> : Partial<T>>
}

export function Navigate({ to, replace, state }: { to: To; replace?: boolean; state?: unknown }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to, { replace, state })
  }, [navigate, to, replace, state])
  return null
}

export function useSearchParams(): [
  URLSearchParams,
  (
    next:
      | URLSearchParams
      | string
      | Record<string, string>
      | ((previous: URLSearchParams) => URLSearchParams),
    options?: Options,
  ) => void,
] {
  const params = useNextSearchParams()
  const pathname = usePathname()
  const navigate = useNavigate()
  return [
    new URLSearchParams(params),
    (next, options) => {
      const value =
        typeof next === 'function' ? next(new URLSearchParams(params)) : new URLSearchParams(next)
      navigate(pathname + (value.size ? '?' + value : ''), options)
    },
  ]
}

export function matchPath(pattern: string | { path: string; end?: boolean }, pathname: string) {
  const path = mapLegacyPath(typeof pattern === 'string' ? pattern : pattern.path)
  const end = typeof pattern === 'string' || pattern.end !== false
  const expression = path
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:\w+/g, '[^/]+')
    .replace(/\*/g, '.*')
  const match = pathname.match(new RegExp('^' + expression + (end ? '/?$' : '(?:/|$)')))
  return match
    ? { params: {}, pathname: match[0], pathnameBase: match[0], pattern: { path, end } }
    : null
}
