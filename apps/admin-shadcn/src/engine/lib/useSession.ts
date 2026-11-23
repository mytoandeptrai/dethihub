import { useSession as useAppSession } from '@/hooks/use-session'
import { toEngineSession } from '@/engine/lib/auth'

export function useSession() { return toEngineSession(useAppSession().session) }
