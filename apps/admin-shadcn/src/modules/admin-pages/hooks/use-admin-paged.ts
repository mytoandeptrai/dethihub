import { useEffect, useState } from 'react'
export function usePaged<T>(list: T[], size = 12, reset?: unknown) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(list.length / size))
  useEffect(() => setPage(1), [reset])
  const cur = Math.min(page, pages)
  const go = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return {
    items: list.slice((cur - 1) * size, cur * size),
    page: cur,
    pages,
    go,
    offset: (cur - 1) * size,
  }
}
