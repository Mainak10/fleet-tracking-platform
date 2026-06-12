import { create, type UseBoundStore, type StoreApi } from 'zustand'
import { ApiError } from '@/services/client'
import type { CrudService } from '@/services/crud'

export interface CrudState<T> {
  items: T[]
  loading: boolean
  error: string | null
  loaded: boolean
  fetchAll: () => Promise<void>
  create: (body: Partial<T>) => Promise<T>
  update: (id: string, body: Partial<T>) => Promise<T>
  remove: (id: string) => Promise<void>
  getById: (id: string) => T | undefined
}

function message(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return err instanceof Error ? err.message : 'Something went wrong'
}

/**
 * Build a Zustand store that mirrors a CRUD collection from the API. Async
 * actions track `loading`/`error` and keep `items` as the single source of
 * truth the UI subscribes to. The four master-data entities each get a store
 * from one call to this factory.
 */
export function createCrudStore<T extends { id: string }>(
  service: CrudService<T>,
): UseBoundStore<StoreApi<CrudState<T>>> {
  return create<CrudState<T>>((set, get) => ({
    items: [],
    loading: false,
    error: null,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true, error: null })
      try {
        const items = await service.list()
        set({ items, loading: false, loaded: true })
      } catch (err) {
        set({ error: message(err), loading: false })
      }
    },

    // The three mutations below are optimistic: the UI updates immediately and
    // reconciles with the server response, rolling back to the pre-call state if
    // the request fails. Errors are always re-thrown so callers (forms/toasts)
    // still see the failure.
    create: async (body) => {
      const tempId = `tmp-${Math.random().toString(36).slice(2, 9)}`
      const optimistic = { ...(body as T), id: tempId }
      set((state) => ({ items: [...state.items, optimistic] }))
      try {
        const created = await service.create(body)
        // Replace the temp row in place so ordering is preserved.
        set((state) => ({
          items: state.items.map((item) => (item.id === tempId ? created : item)),
        }))
        return created
      } catch (err) {
        set((state) => ({ items: state.items.filter((item) => item.id !== tempId) }))
        throw err
      }
    },

    update: async (id, body) => {
      const previous = get().items.find((item) => item.id === id)
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...body } : item,
        ),
      }))
      try {
        const updated = await service.update(id, body)
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? updated : item)),
        }))
        return updated
      } catch (err) {
        if (previous) {
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? previous : item)),
          }))
        }
        throw err
      }
    },

    remove: async (id) => {
      const snapshot = get().items
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
      try {
        await service.remove(id)
      } catch (err) {
        set({ items: snapshot })
        throw err
      }
    },

    getById: (id) => get().items.find((item) => item.id === id),
  }))
}
