import { useEffect } from 'react'
import {
  useAllocationsStore,
  useDriversStore,
  useFacilitiesStore,
  useOrdersStore,
  useProductsStore,
  useShiftsStore,
  useVehiclesStore,
} from '@/store'

/**
 * Load all core collections once on app start so any persona/page has the
 * data it needs. Individual pages can still refetch as required.
 */
export function useBootstrap() {
  useEffect(() => {
    useFacilitiesStore.getState().fetchAll()
    useProductsStore.getState().fetchAll()
    useDriversStore.getState().fetchAll()
    useVehiclesStore.getState().fetchAll()
    useOrdersStore.getState().fetchAll()
    useAllocationsStore.getState().fetchAll()
    useShiftsStore.getState().fetchAll()
  }, [])
}
