const authHref = (path: string, redirectTo?: string | null) =>
  redirectTo ? `${path}?redirectTo=${encodeURIComponent(redirectTo)}` : path

export const appPaths = {
  home: { href: '/' },
  profile: { href: '/profile', uploads: { href: '/profile/uploads' } },
  admin: { href: '/admin' },
  terms: { href: 'https://dero.id.vn/dieu-khoan' },
  privacy: { href: 'https://dero.id.vn/quyen-rieng-tu' },
  auth: {
    login: {
      href: '/login',
      getHref: (redirectTo?: string | null) => authHref('/login', redirectTo),
    },
    register: {
      href: '/register',
      getHref: (redirectTo?: string | null) => authHref('/register', redirectTo),
    },
    forgot: { href: '/forgot-password' },
    reset: { href: '/reset-password' },
    callback: { href: '/auth/callback' },
  },
} as const

export function safeRedirect(value: string | null | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value))
    return appPaths.home.href
  return value
}

export function requiresAuth(path: string): boolean {
  return (
    path === appPaths.profile.href ||
    path === appPaths.profile.uploads.href ||
    path === appPaths.admin.href ||
    path.startsWith(appPaths.admin.href + '/')
  )
}
