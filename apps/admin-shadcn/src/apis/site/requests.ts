import { apiClient } from '@/lib/api-client'

export async function getSite() {
  const { data } = await apiClient.GET('/api/site/status')
  return data!
}
