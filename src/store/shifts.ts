import { create } from 'zustand'
import { shiftsService } from '@/services'
import { ApiError } from '@/services/client'
import type { Shift } from '@/types/domain'
import { useOrdersStore } from './orders'

interface ShiftsState {
  items: Shift[]
  loading: boolean
  error: string | null
  loaded: boolean
  fetchAll: () => Promise<void>
  /** Start a shift for a driver/date. Throws ApiError(422) if no allocation. */
  start: (driverId: string, date: string) => Promise<Shift>
  end: (id: string) => Promise<Shift>
}

const message = (err: unknown) =>
  err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Something went wrong'

export const useShiftsStore = create<ShiftsState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      set({ items: await shiftsService.list(), loading: false, loaded: true })
    } catch (err) {
      set({ error: message(err), loading: false })
    }
  },

  start: async (driverId, date) => {
    const shift = await shiftsService.start(driverId, date)
    set((s) => ({ items: [...s.items, shift] }))
    // Starting a shift moves the day's orders to `in_transit` server-side.
    void useOrdersStore.getState().fetchAll()
    return shift
  },

  end: async (id) => {
    const ended = await shiftsService.end(id)
    set((s) => ({ items: s.items.map((shift) => (shift.id === id ? ended : shift)) }))
    return ended
  },
}))
