import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { createCrudService } from '@/services/crud'
import type { Driver } from '@/types/domain'
import { createCrudStore } from './createCrudStore'

// A throwaway store wired to the real `drivers` resource, so we can drive the
// optimistic create/update/remove paths against forced server failures.
const useStore = createCrudStore<Driver>(createCrudService<Driver>('drivers'))

const fail = (method: 'post' | 'put' | 'delete', path: string) =>
  server.use(
    http[method](`/api${path}`, () =>
      HttpResponse.json({ message: 'Server exploded' }, { status: 500 }),
    ),
  )

describe('createCrudStore optimistic updates with rollback', () => {
  beforeEach(async () => {
    await useStore.getState().fetchAll()
  })

  it('rolls back an optimistic create when the request fails', async () => {
    const before = useStore.getState().items
    fail('post', '/drivers')

    await expect(
      useStore.getState().create({ name: 'Ghost', license: 'DL-X', phone: '+1-555-9999' }),
    ).rejects.toMatchObject({ status: 500 })

    // The temporary optimistic row is gone; the list matches its pre-call state.
    expect(useStore.getState().items).toHaveLength(before.length)
    expect(useStore.getState().items.some((d) => d.name === 'Ghost')).toBe(false)
  })

  it('rolls back an optimistic update when the request fails', async () => {
    const target = useStore.getState().items[0]
    fail('put', `/drivers/${target.id}`)

    await expect(
      useStore.getState().update(target.id, { name: 'Renamed' }),
    ).rejects.toMatchObject({ status: 500 })

    // The original value is restored, not the optimistic "Renamed".
    expect(useStore.getState().getById(target.id)?.name).toBe(target.name)
  })

  it('rolls back an optimistic remove when the request fails', async () => {
    const target = useStore.getState().items[0]
    fail('delete', `/drivers/${target.id}`)

    await expect(useStore.getState().remove(target.id)).rejects.toMatchObject({ status: 500 })

    // The row is still present after the failed delete.
    expect(useStore.getState().getById(target.id)).toBeDefined()
  })

  it('applies an optimistic create and reconciles with the server entity on success', async () => {
    const before = useStore.getState().items.length
    const created = await useStore
      .getState()
      .create({ name: 'Real Driver', license: 'DL-REAL', phone: '+1-555-1234' })

    const items = useStore.getState().items
    expect(items).toHaveLength(before + 1)
    // The temp id was replaced by the server id (no leftover tmp- rows).
    expect(items.some((d) => d.id.startsWith('tmp-'))).toBe(false)
    expect(items.some((d) => d.id === created.id && d.name === 'Real Driver')).toBe(true)
  })
})
