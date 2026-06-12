import type { Allocation } from '@/types/domain'

/**
 * Find an existing allocation that would collide with booking `vehicleId` on
 * `date`. A vehicle may only be allocated once per date — this is the rule
 * that prevents double-booking. Returns the conflicting allocation, or null.
 *
 * Pure and dependency-free so it can be unit tested and reused by both the
 * mock API handler and any client-side pre-validation.
 */
export function findAllocationConflict(
  allocations: Allocation[],
  vehicleId: string,
  date: string,
  excludeId?: string,
): Allocation | null {
  return (
    allocations.find(
      (a) => a.vehicleId === vehicleId && a.date === date && a.id !== excludeId,
    ) ?? null
  )
}
