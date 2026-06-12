import type { Allocation, Order, Shift } from '@/types/domain'

/**
 * Pure helpers for the driver shift flow. Kept dependency-free so the driver
 * pages stay declarative and the logic is straightforward to unit test.
 */

/** The driver's currently-active shift, if any. */
export function activeShiftForDriver(shifts: Shift[], driverId: string): Shift | undefined {
  return shifts.find((s) => s.driverId === driverId && s.status === 'active')
}

/** The driver's vehicle allocation for a given date, if any. */
export function allocationForDriver(
  allocations: Allocation[],
  driverId: string,
  date: string,
): Allocation | undefined {
  return allocations.find((a) => a.driverId === driverId && a.date === date)
}

/** Orders referenced by a shift, in the shift's order. */
export function shiftDeliveries(orders: Order[], orderIds: string[]): Order[] {
  return orderIds.map((id) => orders.find((o) => o.id === id)).filter((o): o is Order => !!o)
}

export interface DeliverySummary {
  total: number
  completed: number
  failed: number
  pending: number
}

/** Tally delivery outcomes for a set of order ids. */
export function deliverySummary(orders: Order[], orderIds: string[]): DeliverySummary {
  const set = shiftDeliveries(orders, orderIds)
  const completed = set.filter((o) => o.status === 'completed').length
  const failed = set.filter((o) => o.status === 'failed').length
  return { total: set.length, completed, failed, pending: set.length - completed - failed }
}
