import { describe, expect, it } from 'vitest'
import { bearing, distanceKm, lerp, nearest } from './geo'

describe('lerp', () => {
  it('returns the endpoints at t=0 and t=1', () => {
    const a = { lat: 0, lng: 0 }
    const b = { lat: 10, lng: 20 }
    expect(lerp(a, b, 0)).toEqual(a)
    expect(lerp(a, b, 1)).toEqual(b)
  })

  it('returns the midpoint at t=0.5', () => {
    expect(lerp({ lat: 0, lng: 0 }, { lat: 10, lng: 20 }, 0.5)).toEqual({ lat: 5, lng: 10 })
  })

  it('clamps t outside the 0..1 range', () => {
    const a = { lat: 0, lng: 0 }
    const b = { lat: 10, lng: 20 }
    expect(lerp(a, b, -1)).toEqual(a)
    expect(lerp(a, b, 2)).toEqual(b)
  })
})

describe('bearing', () => {
  it('points ~north for a destination at a higher latitude', () => {
    expect(bearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0)
  })

  it('points ~east for a destination at a higher longitude', () => {
    expect(bearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90)
  })

  it('returns a value in the 0..360 range', () => {
    const deg = bearing({ lat: 0, lng: 0 }, { lat: -1, lng: -1 })
    expect(deg).toBeGreaterThanOrEqual(0)
    expect(deg).toBeLessThan(360)
  })
})

describe('distanceKm', () => {
  it('is zero for identical points', () => {
    expect(distanceKm({ lat: 37.77, lng: -122.42 }, { lat: 37.77, lng: -122.42 })).toBeCloseTo(0)
  })

  it('grows as points move apart', () => {
    const origin = { lat: 0, lng: 0 }
    const near = distanceKm(origin, { lat: 0, lng: 1 })
    const far = distanceKm(origin, { lat: 0, lng: 2 })
    expect(far).toBeGreaterThan(near)
  })
})

describe('nearest', () => {
  const candidates = [
    { id: 'a', coordinates: { lat: 37.8, lng: -122.27 } },
    { id: 'b', coordinates: { lat: 37.33, lng: -121.89 } },
  ]

  it('picks the closest candidate', () => {
    expect(nearest({ lat: 37.78, lng: -122.25 }, candidates)?.id).toBe('a')
    expect(nearest({ lat: 37.34, lng: -121.9 }, candidates)?.id).toBe('b')
  })

  it('returns undefined for an empty candidate list', () => {
    expect(nearest({ lat: 0, lng: 0 }, [])).toBeUndefined()
  })
})
