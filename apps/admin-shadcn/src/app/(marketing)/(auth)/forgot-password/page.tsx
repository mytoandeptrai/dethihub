import { redirect } from 'next/navigation'

import { appPaths } from '@/config/app-paths'

// Google-only login: email flows are disabled.
export default function Page() {
  redirect(appPaths.auth.login.href)
}
