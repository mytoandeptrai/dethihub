import type { QueryClient } from '@tanstack/react-query'
export function adminRequest<T extends (...args: never[]) => unknown>(
  client: QueryClient,
  mutate: (job: () => Promise<unknown>) => Promise<unknown>,
  name: string,
  fn: T,
): T {
  return (async (...args: Parameters<T>) => {
    const run = async () => fn(...(args as never[]))
    if (/^(get|list)/.test(name))
      return client.fetchQuery({
        queryKey: ['admin-pages', name, args],
        queryFn: run,
        staleTime: 0,
        retry: false,
      })
    const result = await mutate(run)
    await client.invalidateQueries({ queryKey: ['admin-pages'] })
    return result
  }) as T
}
