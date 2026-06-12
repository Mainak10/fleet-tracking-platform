import { api } from './client'
import { createCrudService } from './crud'
import type {
  Allocation,
  Driver,
  Facility,
  Order,
  Product,
  Shift,
  Vehicle,
} from '@/types/domain'

// Master-data entities: plain REST CRUD.
export const facilitiesService = createCrudService<Facility>('facilities')
export const productsService = createCrudService<Product>('products')
export const driversService = createCrudService<Driver>('drivers')
export const vehiclesService = createCrudService<Vehicle>('vehicles')

// Orders: CRUD list/create plus delivery-lifecycle actions.
export const ordersService = {
  list: () => api.get<Order[]>('/orders'),
  create: (body: Partial<Order>) => api.post<Order>('/orders', body),
  assign: (id: string, driverId: string) =>
    api.post<Order>(`/orders/${id}/assign`, { driverId }),
  complete: (id: string) => api.post<Order>(`/orders/${id}/complete`),
  fail: (id: string, reason: string) => api.post<Order>(`/orders/${id}/fail`, { reason }),
}

// Allocations: list/create (409 on double-booking)/delete.
export const allocationsService = {
  list: () => api.get<Allocation[]>('/allocations'),
  create: (body: Pick<Allocation, 'vehicleId' | 'driverId' | 'date'>) =>
    api.post<Allocation>('/allocations', body),
  remove: (id: string) => api.del<Allocation>(`/allocations/${id}`),
}

// Shifts: list/start/end.
export const shiftsService = {
  list: () => api.get<Shift[]>('/shifts'),
  start: (driverId: string, date: string) =>
    api.post<Shift>('/shifts', { driverId, date }),
  end: (id: string) => api.post<Shift>(`/shifts/${id}/end`),
}
