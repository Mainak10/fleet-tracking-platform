import { describe, expect, it } from 'vitest'
import type { Allocation, Order, Shift } from '@/types/domain'
import { activeShiftForDriver, allocationForDriver, deliverySummary, shiftDeliveries } from './shift'

const order = (id: string, status: Order['status']): Order => ({
  id,
  destinationId: 'term',
  productId: 'diesel',
  quantity: 100,
  deliveryDate: '2026-06-12',
  assignedDriverId: 'driver-1',
  status,
})

const shifts: Shift[] = [
  { id: 's1', driverId: 'driver-1', vehicleId: 'v1', date: '2026-06-12', status: 'active', startedAt: '', orderIds: ['o1', 'o2', 'o3'] },
  { id: 's0', driverId: 'driver-1', vehicleId: 'v1', date: '2026-06-11', status: 'ended', startedAt: '', orderIds: [] },
  { id: 's2', driverId: 'driver-2', vehicleId: 'v2', date: '2026-06-12', status: 'active', startedAt: '', orderIds: [] },
]

const allocations: Allocation[] = [
  { id: 'a1', vehicleId: 'v1', driverId: 'driver-1', date: '2026-06-12' },
  { id: 'a2', vehicleId: 'v2', driverId: 'driver-2', date: '2026-06-11' },
]

describe('activeShiftForDriver', () => {
  it('returns only the driver’s active shift', () => {
    expect(activeShiftForDriver(shifts, 'driver-1')?.id).toBe('s1')
    expect(activeShiftForDriver(shifts, 'driver-3')).toBeUndefined()
  })
})

describe('allocationForDriver', () => {
  it('matches driver and date', () => {
    expect(allocationForDriver(allocations, 'driver-1', '2026-06-12')?.id).toBe('a1')
    expect(allocationForDriver(allocations, 'driver-2', '2026-06-12')).toBeUndefined()
  })
})

describe('shiftDeliveries / deliverySummary', () => {
  const orders = [order('o1', 'completed'), order('o2', 'failed'), order('o3', 'in_transit')]

  it('resolves orders in shift order, skipping missing ids', () => {
    expect(shiftDeliveries(orders, ['o3', 'missing', 'o1']).map((o) => o.id)).toEqual(['o3', 'o1'])
  })

  it('tallies outcomes', () => {
    expect(deliverySummary(orders, ['o1', 'o2', 'o3'])).toEqual({
      total: 3,
      completed: 1,
      failed: 1,
      pending: 1,
    })
  })
})
