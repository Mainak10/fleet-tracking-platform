import { create } from 'zustand'
import { allocationsService } from '@/services'
import { ApiError } from '@/services/client'
import type { Allocation } from '@/types/domain'

interface AllocationsState {
  items: Allocation[]
  loading: boolean
  error: string | null
  loaded: boolean
  fetchAll: () => Promise<void>
  /** Create an allocation. Throws ApiError(409) on double-booking. */
  create: (body: Pick<Allocation, 'vehicleId' | 'driverId' | 'date'>) => Promise<Allocation>
  remove: (id: string) => Promise<void>
}

const message = (err: unknown) =>
  err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Something went wrong'

export const useAllocationsStore = create<AllocationsState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      set({ items: await allocationsService.list(), loading: false, loaded: true })
    } catch (err) {
      set({ error: message(err), loading: false })
    }
  },

  // The component awaits this and surfaces the 409 message; we deliberately
  // re-throw so callers can react (e.g. show a form/toast error).
  create: async (body) => {
    const created = await allocationsService.create(body)
    set((s) => ({ items: [...s.items, created] }))
    return created
  },

  remove: async (id) => {
    await allocationsService.remove(id)
    set((s) => ({ items: s.items.filter((a) => a.id !== id) }))
  },
}))
