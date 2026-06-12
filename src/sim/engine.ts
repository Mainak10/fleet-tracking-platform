/**
 * Simulation engine: pure, framework-free logic that turns the persisted domain
 * state (active shifts + their in-transit orders) into live vehicle positions.
 *
 * Keeping this module free of React and Zustand makes the interpolation math
 * trivially unit-testable; the positions store (`src/store/positions.ts`) wires
 * it to a ticker and the rest of the app.
 */
import type { Facility, LatLng, Order, Shift, VehiclePosition } from '@/types/domain'
import { bearing, distanceKm, lerp, nearest } from './geo'

/** Ticker interval — the store advances positions once per second. */
export const TICK_MS = 1000

/**
 * Exaggerated cruising speed (km/h) so a typical Bay Area leg (~20–40 km)
 * completes in roughly a minute of wall-clock time and the movement reads as
 * "live" in a demo rather than imperceptibly slow.
 */
export const SPEED_KMH = 1200

/** Floor on a leg's duration so very short hops still animate visibly. */
export const MIN_ETA_MS = 20_000

/** A single origin→destination trip a vehicle is currently driving. */
export interface Leg {
  orderId: string
  origin: LatLng
  dest: LatLng
  headingDeg: number
  /** Wall-clock milliseconds the full leg should take at SPEED_KMH. */
  etaMs: number
}

/**
 * Build the active leg for a shift: from the nearest hub to the first
 * in-transit order's destination. Returns null when the shift has no in-transit
 * delivery or the referenced facilities are missing.
 */
export function deriveLeg(
  shift: Shift,
  orders: Order[],
  facilities: Facility[],
): Leg | null {
  const order = shift.orderIds
    .map((id) => orders.find((o) => o.id === id))
    .find((o): o is Order => !!o && o.status === 'in_transit')
  if (!order) return null

  const dest = facilities.find((f) => f.id === order.destinationId)
  if (!dest) return null

  const hubs = facilities.filter((f) => f.type === 'hub')
  const origin = nearest(dest.coordinates, hubs)
  if (!origin) return null

  const etaMs = Math.max(
    MIN_ETA_MS,
    (distanceKm(origin.coordinates, dest.coordinates) / SPEED_KMH) * 3_600_000,
  )

  return {
    orderId: order.id,
    origin: origin.coordinates,
    dest: dest.coordinates,
    headingDeg: bearing(origin.coordinates, dest.coordinates),
    etaMs,
  }
}

/** A fresh position parked at the start of a leg (progress 0). */
export function initialPosition(
  vehicleId: string,
  leg: Leg,
  now: number = Date.now(),
): VehiclePosition {
  return {
    vehicleId,
    coordinates: leg.origin,
    heading: leg.headingDeg,
    progress: 0,
    activeOrderId: leg.orderId,
    updatedAt: new Date(now).toISOString(),
  }
}

/**
 * Advance a position one tick along its leg. Progress is clamped at 1 — once a
 * vehicle "arrives" it idles at the destination until the driver marks the
 * delivery complete (which removes it from the active set).
 */
export function advance(
  prev: VehiclePosition,
  leg: Leg,
  dtMs: number = TICK_MS,
  now: number = Date.now(),
): VehiclePosition {
  const progress = Math.min(1, prev.progress + dtMs / leg.etaMs)
  return {
    vehicleId: prev.vehicleId,
    coordinates: lerp(leg.origin, leg.dest, progress),
    heading: leg.headingDeg,
    progress,
    activeOrderId: leg.orderId,
    updatedAt: new Date(now).toISOString(),
  }
}
