import { toEngineSession } from '@/engine/lib/auth'
import { useSession as useAppSession } from '@/hooks/use-session'

export function useSession() {
  return toEngineSession(useAppSession().session)
}
