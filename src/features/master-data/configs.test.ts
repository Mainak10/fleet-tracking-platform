import { describe, expect, it } from 'vitest'
import { ENTITY_CONFIGS } from './configs'

const { hubs, products, drivers, vehicles } = ENTITY_CONFIGS

describe('facility schema (hubs/terminals)', () => {
  const schema = hubs.schema

  it('accepts a valid facility and coerces string coordinates to numbers', () => {
    const result = schema.safeParse({
      name: 'North Hub',
      address: '1 Market St',
      coordinates: { lat: '37.7749', lng: '-122.4194' },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      const coords = (result.data as { coordinates: { lat: number; lng: number } }).coordinates
      expect(coords.lat).toBe(37.7749)
      expect(coords.lng).toBe(-122.4194)
    }
  })

  it('rejects a blank name', () => {
    const result = schema.safeParse({
      name: '',
      address: '1 Market St',
      coordinates: { lat: 37.7, lng: -122.4 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects out-of-range coordinates', () => {
    expect(
      schema.safeParse({
        name: 'Bad',
        address: 'x',
        coordinates: { lat: 200, lng: 0 },
      }).success,
    ).toBe(false)
    expect(
      schema.safeParse({
        name: 'Bad',
        address: 'x',
        coordinates: { lat: 0, lng: 999 },
      }).success,
    ).toBe(false)
  })
})

describe('product schema', () => {
  const schema = products.schema

  it('coerces a numeric-string threshold', () => {
    const result = schema.safeParse({ name: 'Diesel', unit: 'litres', lowStockThreshold: '1500' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as { lowStockThreshold: number }).lowStockThreshold).toBe(1500)
    }
  })

  it('rejects a negative threshold', () => {
    expect(
      schema.safeParse({ name: 'Diesel', unit: 'litres', lowStockThreshold: -1 }).success,
    ).toBe(false)
  })
})

describe('driver schema', () => {
  const schema = drivers.schema

  it('accepts a valid driver', () => {
    expect(
      schema.safeParse({ name: 'Jane Doe', license: 'DL-1', phone: '+1-555-0100' }).success,
    ).toBe(true)
  })

  it('rejects a too-short phone number', () => {
    expect(schema.safeParse({ name: 'Jane', license: 'DL-1', phone: '123' }).success).toBe(false)
  })
})

describe('vehicle schema', () => {
  const schema = vehicles.schema

  it('requires a positive capacity', () => {
    expect(schema.safeParse({ registration: 'TRK-1', type: 'Tanker', capacity: 8000 }).success).toBe(
      true,
    )
    expect(schema.safeParse({ registration: 'TRK-1', type: 'Tanker', capacity: 0 }).success).toBe(
      false,
    )
  })
})
