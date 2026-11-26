const authHref = (path: string, redirectTo?: string | null) =>
  redirectTo ? `${path}?redirectTo=${encodeURIComponent(redirectTo)}` : path

export const appPaths = {
  home: { href: '/' },
  editor: { href: '/editor' },
  onlineExams: {
    href: '/online-exams',
    getHref: (id: string) => `/online-exams/${encodeURIComponent(id)}`,
    results: (id: string) => `/online-exams/${encodeURIComponent(id)}/results`,
  },
  play: { getHref: (id: string) => `/play/${encodeURIComponent(id)}` },
  quiz: { getHref: (id: string) => `/quiz/${encodeURIComponent(id)}` },
  exams: { getHref: (id: string) => `/exams/${encodeURIComponent(id)}` },
  community: { href: '/community' },
  myDocs: { href: '/my-docs', analytics: '/my-docs/analytics' },
  library: { href: '/library' },
  grading: { href: '/grading' },
  pricing: { href: '/pricing' },
  previewDesigns: { href: '/preview-designs' },
  profile: { href: '/profile', uploads: { href: '/profile/uploads' } },
  admin: {
    href: '/admin',
    users: '/admin/users',
    content: '/admin/content',
    bank: '/admin/bank',
    stats: '/admin/stats',
    payments: '/admin/payments',
    ai: '/admin/ai',
    audit: '/admin/audit',
    features: '/admin/features',
  },
  terms: { href: '/terms' },
  privacy: { href: '/privacy' },
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
