import { describe, expect, it } from 'vitest'
import type { Allocation } from '@/types/domain'
import { findAllocationConflict } from './allocations'

const allocations: Allocation[] = [
  { id: 'alloc-1', vehicleId: 'vehicle-1', driverId: 'driver-1', date: '2026-06-12' },
  { id: 'alloc-2', vehicleId: 'vehicle-2', driverId: 'driver-2', date: '2026-06-12' },
]

describe('findAllocationConflict', () => {
  it('returns the existing allocation when the same vehicle is booked on the same date', () => {
    const conflict = findAllocationConflict(allocations, 'vehicle-1', '2026-06-12')
    expect(conflict?.id).toBe('alloc-1')
  })

  it('returns null when the same vehicle is booked on a different date', () => {
    expect(findAllocationConflict(allocations, 'vehicle-1', '2026-06-13')).toBeNull()
  })

  it('returns null for a vehicle that is not yet allocated', () => {
    expect(findAllocationConflict(allocations, 'vehicle-9', '2026-06-12')).toBeNull()
  })

  it('ignores the row being edited via excludeId', () => {
    // Editing alloc-1 itself must not count as a conflict with itself.
    expect(findAllocationConflict(allocations, 'vehicle-1', '2026-06-12', 'alloc-1')).toBeNull()
  })
})
