import { describe, expect, it } from 'vitest'
import type { Facility, Product } from '@/types/domain'
import { applyDelivery, isLowStock, stockLevel } from './inventory'

const product: Product = {
  id: 'diesel',
  name: 'Diesel',
  unit: 'litres',
  lowStockThreshold: 1000,
}

const facility = (inventory: Record<string, number>): Facility => ({
  id: 'terminal-1',
  name: 'Terminal 1',
  type: 'terminal',
  address: '',
  coordinates: { lat: 0, lng: 0 },
  inventory,
})

describe('isLowStock', () => {
  it('flags quantities at or below the threshold', () => {
    expect(isLowStock(1000, 1000)).toBe(true) // boundary is low
    expect(isLowStock(999, 1000)).toBe(true)
  })

  it('does not flag quantities above the threshold', () => {
    expect(isLowStock(1001, 1000)).toBe(false)
  })
})

describe('applyDelivery', () => {
  it('adds the delivered quantity to the existing stock', () => {
    expect(applyDelivery({ diesel: 500 }, 'diesel', 200)).toEqual({ diesel: 700 })
  })

  it('treats a missing product as zero starting stock', () => {
    expect(applyDelivery({}, 'diesel', 200)).toEqual({ diesel: 200 })
  })

  it('does not mutate the input inventory', () => {
    const before = { diesel: 500 }
    const after = applyDelivery(before, 'diesel', 200)
    expect(before).toEqual({ diesel: 500 })
    expect(after).not.toBe(before)
  })
})

describe('stockLevel', () => {
  it('classifies low stock', () => {
    expect(stockLevel(facility({ diesel: 800 }), product)).toEqual({
      quantity: 800,
      level: 'low',
    })
  })

  it('classifies healthy stock', () => {
    expect(stockLevel(facility({ diesel: 5000 }), product)).toEqual({
      quantity: 5000,
      level: 'ok',
    })
  })

  it('returns unknown when the facility has no record of the product', () => {
    expect(stockLevel(facility({}), product)).toEqual({ quantity: 0, level: 'unknown' })
  })
})
