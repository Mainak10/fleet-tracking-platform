import { addDays, format } from 'date-fns'
import type {
  Allocation,
  Driver,
  Facility,
  Order,
  Product,
  Shift,
  Vehicle,
} from '@/types/domain'

/**
 * The server-owned collections. Live vehicle positions are deliberately NOT
 * here: they are ephemeral real-time telemetry held in client state (the
 * simulation store), not persisted resources served over the mock API.
 */
export interface Db {
  facilities: Facility[]
  products: Product[]
  drivers: Driver[]
  vehicles: Vehicle[]
  orders: Order[]
  allocations: Allocation[]
  shifts: Shift[]
}

const isoDate = (d: Date) => format(d, 'yyyy-MM-dd')

/**
 * Build a fresh seed dataset. Dates are computed relative to "today" so the
 * sample orders/allocations stay relevant whenever the app is run.
 *
 * Coordinates are real San Francisco Bay Area locations so the live map
 * renders a believable, geographically clustered fleet.
 */
export function createSeedData(): Db {
  const today = new Date()
  const t = isoDate(today)
  const yesterday = isoDate(addDays(today, -1))
  const tomorrow = isoDate(addDays(today, 1))

  const products: Product[] = [
    { id: 'diesel', name: 'Diesel', unit: 'litres', lowStockThreshold: 3000 },
    { id: 'petrol', name: 'Petrol', unit: 'litres', lowStockThreshold: 3000 },
  ]

  const facilities: Facility[] = [
    {
      id: 'hub-1',
      name: 'Downtown Distribution Hub',
      type: 'hub',
      address: '123 Market St, San Francisco, CA',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      inventory: { diesel: 15000, petrol: 12000 },
    },
    {
      id: 'hub-2',
      name: 'Oakland Supply Hub',
      type: 'hub',
      address: '500 Broadway, Oakland, CA',
      coordinates: { lat: 37.8044, lng: -122.2712 },
      inventory: { diesel: 9000, petrol: 8000 },
    },
    {
      id: 'hub-3',
      name: 'South Bay Logistics Hub',
      type: 'hub',
      address: '88 First St, San Jose, CA',
      coordinates: { lat: 37.3382, lng: -121.8863 },
      inventory: { diesel: 11000, petrol: 6500 },
    },
    {
      id: 'terminal-1',
      name: 'Berkeley Fuel Terminal',
      type: 'terminal',
      address: '2200 University Ave, Berkeley, CA',
      coordinates: { lat: 37.8715, lng: -122.273 },
      inventory: { diesel: 2400, petrol: 1800 },
    },
    {
      id: 'terminal-2',
      name: 'Fremont Depot',
      type: 'terminal',
      address: '4000 Mowry Ave, Fremont, CA',
      coordinates: { lat: 37.5485, lng: -121.9886 },
      inventory: { diesel: 5200, petrol: 4100 },
    },
    {
      id: 'terminal-3',
      name: 'Palo Alto Station',
      type: 'terminal',
      address: '300 University Ave, Palo Alto, CA',
      coordinates: { lat: 37.4419, lng: -122.143 },
      inventory: { diesel: 900, petrol: 2700 },
    },
    {
      id: 'terminal-4',
      name: 'Daly City Terminal',
      type: 'terminal',
      address: '6000 Mission St, Daly City, CA',
      coordinates: { lat: 37.6879, lng: -122.4702 },
      inventory: { diesel: 6100, petrol: 5400 },
    },
    {
      id: 'terminal-5',
      name: 'Hayward Terminal',
      type: 'terminal',
      address: '777 W Winton Ave, Hayward, CA',
      coordinates: { lat: 37.6688, lng: -122.0808 },
      inventory: { diesel: 2800, petrol: 600 },
    },
  ]

  const drivers: Driver[] = [
    { id: 'driver-1', name: 'John Smith', license: 'DL-123456', phone: '+1-555-0100' },
    { id: 'driver-2', name: 'Maria Garcia', license: 'DL-223344', phone: '+1-555-0101' },
    { id: 'driver-3', name: 'David Chen', license: 'DL-334455', phone: '+1-555-0102' },
    { id: 'driver-4', name: 'Aisha Khan', license: 'DL-445566', phone: '+1-555-0103' },
    { id: 'driver-5', name: 'Tom Müller', license: 'DL-556677', phone: '+1-555-0104' },
    { id: 'driver-6', name: 'Sara Okoro', license: 'DL-667788', phone: '+1-555-0105' },
  ]

  const vehicles: Vehicle[] = [
    { id: 'vehicle-1', registration: 'TRK-101', capacity: 8000, type: 'Tanker' },
    { id: 'vehicle-2', registration: 'TRK-102', capacity: 6000, type: 'Tanker' },
    { id: 'vehicle-3', registration: 'TRK-103', capacity: 10000, type: 'Tanker' },
    { id: 'vehicle-4', registration: 'TRK-104', capacity: 5000, type: 'Rigid Tanker' },
    { id: 'vehicle-5', registration: 'TRK-105', capacity: 12000, type: 'Articulated Tanker' },
    { id: 'vehicle-6', registration: 'TRK-106', capacity: 7000, type: 'Tanker' },
  ]

  const orders: Order[] = [
    {
      id: 'order-1',
      destinationId: 'terminal-5',
      productId: 'diesel',
      quantity: 5000,
      deliveryDate: t,
      assignedDriverId: 'driver-1',
      status: 'assigned',
    },
    {
      id: 'order-2',
      destinationId: 'terminal-3',
      productId: 'petrol',
      quantity: 3000,
      deliveryDate: t,
      assignedDriverId: 'driver-1',
      status: 'assigned',
    },
    {
      id: 'order-3',
      destinationId: 'terminal-1',
      productId: 'diesel',
      quantity: 4000,
      deliveryDate: t,
      assignedDriverId: 'driver-2',
      status: 'assigned',
    },
    {
      id: 'order-4',
      destinationId: 'terminal-2',
      productId: 'petrol',
      quantity: 2500,
      deliveryDate: tomorrow,
      assignedDriverId: 'driver-3',
      status: 'assigned',
    },
    {
      id: 'order-5',
      destinationId: 'terminal-4',
      productId: 'diesel',
      quantity: 3500,
      deliveryDate: t,
      assignedDriverId: null,
      status: 'created',
    },
    {
      id: 'order-6',
      destinationId: 'terminal-3',
      productId: 'diesel',
      quantity: 1500,
      deliveryDate: tomorrow,
      assignedDriverId: null,
      status: 'created',
    },
    {
      id: 'order-7',
      destinationId: 'terminal-1',
      productId: 'petrol',
      quantity: 2000,
      deliveryDate: yesterday,
      assignedDriverId: 'driver-4',
      status: 'completed',
    },
    {
      id: 'order-8',
      destinationId: 'terminal-2',
      productId: 'diesel',
      quantity: 1800,
      deliveryDate: yesterday,
      assignedDriverId: 'driver-4',
      status: 'failed',
      failureReason: 'Customer site closed on arrival',
    },
  ]

  const allocations: Allocation[] = [
    { id: 'alloc-1', vehicleId: 'vehicle-1', driverId: 'driver-1', date: t },
    { id: 'alloc-2', vehicleId: 'vehicle-2', driverId: 'driver-2', date: t },
    { id: 'alloc-3', vehicleId: 'vehicle-3', driverId: 'driver-3', date: tomorrow },
    { id: 'alloc-4', vehicleId: 'vehicle-4', driverId: 'driver-4', date: yesterday },
  ]

  // One historical, ended shift so Shift History has content on first load.
  const shifts: Shift[] = [
    {
      id: 'shift-1',
      driverId: 'driver-4',
      vehicleId: 'vehicle-4',
      date: yesterday,
      status: 'ended',
      startedAt: `${yesterday}T08:05:00.000Z`,
      endedAt: `${yesterday}T15:40:00.000Z`,
      orderIds: ['order-7', 'order-8'],
    },
  ]

  return { facilities, products, drivers, vehicles, orders, allocations, shifts }
}
