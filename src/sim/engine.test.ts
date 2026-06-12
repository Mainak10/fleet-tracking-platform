import { describe, expect, it } from 'vitest'
import type { Facility, Order, Shift, VehiclePosition } from '@/types/domain'
import { advance, deriveLeg, initialPosition, type Leg } from './engine'

const facilities: Facility[] = [
  { id: 'hub-near', name: 'Near Hub', type: 'hub', address: '', coordinates: { lat: 37.8, lng: -122.27 }, inventory: {} },
  { id: 'hub-far', name: 'Far Hub', type: 'hub', address: '', coordinates: { lat: 37.33, lng: -121.89 }, inventory: {} },
  { id: 'term', name: 'Terminal', type: 'terminal', address: '', coordinates: { lat: 37.67, lng: -122.08 }, inventory: {} },
]

const order = (over: Partial<Order> = {}): Order => ({
  id: 'order-1',
  destinationId: 'term',
  productId: 'diesel',
  quantity: 100,
  deliveryDate: '2026-06-12',
  assignedDriverId: 'driver-1',
  status: 'in_transit',
  ...over,
})

const shift: Shift = {
  id: 'shift-1',
  driverId: 'driver-1',
  vehicleId: 'vehicle-1',
  date: '2026-06-12',
  status: 'active',
  startedAt: '2026-06-12T07:30:00.000Z',
  orderIds: ['order-1'],
}

const leg = (over: Partial<Leg> = {}): Leg => ({
  orderId: 'order-1',
  origin: { lat: 0, lng: 0 },
  dest: { lat: 10, lng: 20 },
  headingDeg: 45,
  etaMs: 10_000,
  ...over,
})

describe('deriveLeg', () => {
  it('routes from the nearest hub to the in-transit order destination', () => {
    const result = deriveLeg(shift, [order()], facilities)
    expect(result).not.toBeNull()
    expect(result!.origin).toEqual({ lat: 37.8, lng: -122.27 }) // hub-near, not hub-far
    expect(result!.dest).toEqual({ lat: 37.67, lng: -122.08 })
    expect(result!.orderId).toBe('order-1')
  })

  it('returns null when the shift has no in-transit order', () => {
    expect(deriveLeg(shift, [order({ status: 'completed' })], facilities)).toBeNull()
  })

  it('returns null when the destination facility is missing', () => {
    expect(deriveLeg(shift, [order({ destinationId: 'ghost' })], facilities)).toBeNull()
  })
})

describe('advance', () => {
  it('moves halfway along the leg at half the ETA', () => {
    const start = initialPosition('vehicle-1', leg())
    const next = advance(start, leg(), 5_000)
    expect(next.progress).toBeCloseTo(0.5)
    expect(next.coordinates).toEqual({ lat: 5, lng: 10 })
    expect(next.heading).toBe(45)
  })

  it('clamps progress at 1 and parks at the destination', () => {
    const arrived: VehiclePosition = {
      vehicleId: 'vehicle-1',
      coordinates: { lat: 10, lng: 20 },
      heading: 45,
      progress: 1,
      activeOrderId: 'order-1',
      updatedAt: '',
    }
    const next = advance(arrived, leg(), 10_000)
    expect(next.progress).toBe(1)
    expect(next.coordinates).toEqual({ lat: 10, lng: 20 })
  })

  it('starts a fresh position parked at the origin', () => {
    const start = initialPosition('vehicle-1', leg())
    expect(start.progress).toBe(0)
    expect(start.coordinates).toEqual({ lat: 0, lng: 0 })
  })
})
