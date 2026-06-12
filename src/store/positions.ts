import { create } from 'zustand'
import type { VehiclePosition } from '@/types/domain'
import { advance, deriveLeg, GPS_STEP_MS, initialPosition, TICK_MS, type Leg } from '@/sim/engine'
import { useFacilitiesStore } from './entities'
import { useOrdersStore } from './orders'
import { useShiftsStore } from './shifts'

interface PositionsState {
  /** Live position per vehicle id, for vehicles currently on the road. */
  positions: Record<string, VehiclePosition>
  running: boolean
  /** Timestamp of the last 30s/manual refresh — drives the "last updated" UI. */
  lastRefreshAt: string | null
  /** Begin the ticker (idempotent) and seed the active set immediately. */
  start: () => void
  /** Stop the ticker. */
  stop: () => void
  /** Re-derive the active set without advancing; stamps lastRefreshAt. */
  refresh: () => void
  /** Advance every active vehicle one step. Exposed for tests. */
  tick: (dtMs?: number) => void
  /** Driver action: jump one vehicle forward, simulating a fresh GPS fix. */
  sendGpsUpdate: (vehicleId: string) => void
}

/**
 * The ticker handle lives at module scope, not in store state, so React
 * StrictMode's double-mount can't spawn two intervals: `start()` is idempotent
 * because it checks this single shared reference.
 */
let timer: ReturnType<typeof setInterval> | null = null

/** Current legs keyed by vehicle id, derived from active shifts. */
function activeLegs(): Map<string, Leg> {
  const facilities = useFacilitiesStore.getState().items
  const orders = useOrdersStore.getState().items
  const shifts = useShiftsStore.getState().items

  const legs = new Map<string, Leg>()
  for (const shift of shifts) {
    if (shift.status !== 'active') continue
    const leg = deriveLeg(shift, orders, facilities)
    if (leg) legs.set(shift.vehicleId, leg)
  }
  return legs
}

/**
 * Reconcile `prev` positions against the current `legs`: keep progress for a
 * vehicle still driving the same order, reset to the origin when its leg
 * changed or it just appeared, and drop vehicles no longer active. When
 * `step` is true each kept position is also advanced one tick.
 */
function reconcile(
  prev: Record<string, VehiclePosition>,
  legs: Map<string, Leg>,
  step: boolean,
  dtMs: number,
): Record<string, VehiclePosition> {
  const next: Record<string, VehiclePosition> = {}
  for (const [vehicleId, leg] of legs) {
    const existing = prev[vehicleId]
    const base =
      existing && existing.activeOrderId === leg.orderId
        ? existing
        : initialPosition(vehicleId, leg)
    next[vehicleId] = step ? advance(base, leg, dtMs) : base
  }
  return next
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: {},
  running: false,
  lastRefreshAt: null,

  refresh: () =>
    set((s) => ({
      positions: reconcile(s.positions, activeLegs(), false, TICK_MS),
      lastRefreshAt: new Date().toISOString(),
    })),

  tick: (dtMs = TICK_MS) =>
    set((s) => ({ positions: reconcile(s.positions, activeLegs(), true, dtMs) })),

  sendGpsUpdate: (vehicleId) =>
    set((s) => {
      const leg = activeLegs().get(vehicleId)
      if (!leg) return {}
      const existing = s.positions[vehicleId]
      const base =
        existing && existing.activeOrderId === leg.orderId
          ? existing
          : initialPosition(vehicleId, leg)
      return { positions: { ...s.positions, [vehicleId]: advance(base, leg, GPS_STEP_MS) } }
    }),

  start: () => {
    get().refresh()
    if (timer) return
    set({ running: true })
    timer = setInterval(() => get().tick(), TICK_MS)
  },

  stop: () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    set({ running: false })
  },
}))
