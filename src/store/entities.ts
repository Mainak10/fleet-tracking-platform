import { createCrudStore } from './createCrudStore'
import {
  driversService,
  facilitiesService,
  productsService,
  vehiclesService,
} from '@/services'

/**
 * Master-data stores, each one line. Facilities backs both Hubs and Terminals
 * (filtered by `type` in the UI); inventory lives on the facility records, so
 * the inventory dashboard reads from this same store.
 */
export const useFacilitiesStore = createCrudStore(facilitiesService)
export const useProductsStore = createCrudStore(productsService)
export const useDriversStore = createCrudStore(driversService)
export const useVehiclesStore = createCrudStore(vehiclesService)
