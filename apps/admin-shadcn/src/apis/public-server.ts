import 'server-only'
import { env } from '@/config/env'

export async function fetchPublicJson<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate },
    })
    return response.ok ? ((await response.json()) as T) : null
  } catch {
    return null
  }
}
