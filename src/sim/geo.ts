import type { LatLng } from '@/types/domain'

/** Linear interpolation between two coordinates at fraction t (0..1). */
export function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  const clamped = Math.max(0, Math.min(1, t))
  return {
    lat: a.lat + (b.lat - a.lat) * clamped,
    lng: a.lng + (b.lng - a.lng) * clamped,
  }
}

/** Initial compass bearing (degrees, 0=N) from a to b. */
export function bearing(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Approximate great-circle distance in kilometres (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Pick the nearest coordinate from a list of candidates. */
export function nearest<T extends { coordinates: LatLng }>(
  to: LatLng,
  candidates: T[],
): T | undefined {
  return candidates.reduce<T | undefined>((best, c) => {
    if (!best) return c
    return distanceKm(to, c.coordinates) < distanceKm(to, best.coordinates) ? c : best
  }, undefined)
}
