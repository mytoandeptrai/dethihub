import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { adminRequest } from './admin-request'
describe('admin query and mutation transport', () => {
  it('returns normal and empty reads without mutating', async () => {
    const client = new QueryClient(),
      mutate = vi.fn(),
      run = vi.fn().mockResolvedValueOnce([1]).mockResolvedValueOnce([])
    const read = adminRequest(client, mutate, 'listUsers', run)
    expect(await read()).toEqual([1])
    expect(await read()).toEqual([])
    expect(mutate).not.toHaveBeenCalled()
  })
  it('propagates forbidden reads without substituting demo data', async () => {
    const client = new QueryClient(),
      fail = new Error('403')
    await expect(
      adminRequest(client, vi.fn(), 'getUserQuota', vi.fn().mockRejectedValue(fail))(),
    ).rejects.toBe(fail)
  })
  it('runs writes through a mutation and invalidates only admin reads', async () => {
    const client = new QueryClient(),
      invalidate = vi.spyOn(client, 'invalidateQueries'),
      run = vi.fn().mockResolvedValue({ ok: true })
    const write = adminRequest(client, async (job) => job(), 'banUser', run)
    expect(await write('fixture')).toEqual({ ok: true })
    expect(run).toHaveBeenCalledWith('fixture')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin-pages'] })
  })
  it('keeps rejected writes rejected without invalidating', async () => {
    const client = new QueryClient(),
      fail = new Error('rejected'),
      invalidate = vi.spyOn(client, 'invalidateQueries')
    await expect(
      adminRequest(client, async (job) => job(), 'banUser', vi.fn().mockRejectedValue(fail))(),
    ).rejects.toBe(fail)
    expect(invalidate).not.toHaveBeenCalled()
  })
})
