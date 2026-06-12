import { create } from 'zustand'
import { ordersService } from '@/services'
import { ApiError } from '@/services/client'
import type { Order } from '@/types/domain'
import { useFacilitiesStore } from './entities'

interface OrdersState {
  items: Order[]
  loading: boolean
  error: string | null
  loaded: boolean
  fetchAll: () => Promise<void>
  create: (body: Partial<Order>) => Promise<Order>
  assign: (id: string, driverId: string) => Promise<Order>
  complete: (id: string) => Promise<Order>
  fail: (id: string, reason: string) => Promise<Order>
}

const message = (err: unknown) =>
  err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Something went wrong'

const replace = (items: Order[], updated: Order) =>
  items.map((o) => (o.id === updated.id ? updated : o))

export const useOrdersStore = create<OrdersState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      set({ items: await ordersService.list(), loading: false, loaded: true })
    } catch (err) {
      set({ error: message(err), loading: false })
    }
  },

  create: async (body) => {
    const created = await ordersService.create(body)
    set((s) => ({ items: [...s.items, created] }))
    return created
  },

  assign: async (id, driverId) => {
    const updated = await ordersService.assign(id, driverId)
    set((s) => ({ items: replace(s.items, updated) }))
    return updated
  },

  complete: async (id) => {
    const updated = await ordersService.complete(id)
    set((s) => ({ items: replace(s.items, updated) }))
    // Completing a delivery changes destination inventory on the server;
    // refresh facilities so the inventory dashboard reflects it immediately.
    void useFacilitiesStore.getState().fetchAll()
    return updated
  },

  fail: async (id, reason) => {
    const updated = await ordersService.fail(id, reason)
    set((s) => ({ items: replace(s.items, updated) }))
    return updated
  },
}))
