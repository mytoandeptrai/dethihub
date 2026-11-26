import { apiClient } from '@/lib/api-client'

export async function getMe() {
  const { data } = await apiClient.GET('/api/me')
  return data!
}
