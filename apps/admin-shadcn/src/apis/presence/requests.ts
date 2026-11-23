import { apiClient } from '@/lib/api-client'

export async function submitPresence() {
  const { data } = await apiClient.POST('/api/presence')
  return data
}
